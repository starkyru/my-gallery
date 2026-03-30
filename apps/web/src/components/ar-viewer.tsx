'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { ArMode } from '@/hooks/useArSupport';
import { CloseIcon } from '@/components/icons/close-icon';

interface ArViewerProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  mode: ArMode;
}

export function ArViewer({
  open,
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
  mode,
}: ArViewerProps) {
  if (!open || !mode) return null;

  if (mode === 'webxr') {
    return (
      <WebXrViewer
        onClose={onClose}
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />
    );
  }

  return (
    <CameraOverlay
      onClose={onClose}
      imageUrl={imageUrl}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
    />
  );
}

// ─── WebXR with Three.js (Android) ───────────────────────────────────────────

function WebXrViewer({
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
}: {
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startXr() {
      try {
        const THREE = await import('three');

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          70,
          window.innerWidth / window.innerHeight,
          0.01,
          20,
        );

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));

        // Load artwork texture
        const textureLoader = new THREE.TextureLoader();
        const texture = await new Promise<InstanceType<typeof THREE.Texture>>((resolve, reject) => {
          textureLoader.load(imageUrl, resolve, undefined, reject);
        });
        texture.colorSpace = THREE.SRGBColorSpace;

        // Create artwork plane with correct aspect ratio
        const aspect = imageWidth / imageHeight;
        const planeHeight = 0.4; // 40cm in AR space
        const planeWidth = planeHeight * aspect;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const artworkMesh = new THREE.Mesh(geometry, material);
        artworkMesh.visible = false;
        scene.add(artworkMesh);

        // Reticle (placement indicator)
        const reticleGeometry = new THREE.RingGeometry(0.05, 0.06, 32);
        const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xc9a96e });
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // Request AR session
        const nav = navigator as Navigator & {
          xr: {
            requestSession: (mode: string, opts: Record<string, unknown>) => Promise<XRSession>;
          };
        };
        const session = await nav.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
        });

        renderer.xr.setReferenceSpaceType('local');
        await renderer.xr.setSession(session);

        const refSpace = await session.requestReferenceSpace('local');
        const viewerSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await (
          session as XRSession & {
            requestHitTestSource: (opts: { space: XRReferenceSpace }) => Promise<XRHitTestSource>;
          }
        ).requestHitTestSource({ space: viewerSpace });

        // Track whether the current reticle hit is on a wall
        let lastHitIsWall = false;
        let lastHitNormal = new THREE.Vector3(0, 1, 0);

        // Tap to place (or re-place)
        session.addEventListener('select', () => {
          if (reticle.visible) {
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(reticle.matrix);

            if (lastHitIsWall) {
              // Wall placement: flush against the wall surface
              artworkMesh.position.copy(pos);
              // Face outward from the wall (along the surface normal)
              const target = pos.clone().add(lastHitNormal);
              artworkMesh.lookAt(target);
            } else {
              // Floor/table placement: stand upright, face the camera
              artworkMesh.position.set(pos.x, pos.y + planeHeight / 2, pos.z);
              const camPos = new THREE.Vector3();
              camera.getWorldPosition(camPos);
              artworkMesh.lookAt(camPos.x, artworkMesh.position.y, camPos.z);
            }

            artworkMesh.visible = true;
          }
        });

        // Render loop — prioritize vertical (wall) surfaces
        renderer.setAnimationLoop((_time: number, frame?: XRFrame) => {
          if (!frame) return;

          if (hitTestSource) {
            const hitResults = frame.getHitTestResults(hitTestSource);
            if (hitResults.length > 0) {
              // Check all hits — prefer vertical surfaces (walls)
              let bestPose: XRPose | null = null;
              let bestIsWall = false;
              let bestNormal = new THREE.Vector3(0, 1, 0);

              for (const hit of hitResults) {
                const pose = hit.getPose(refSpace);
                if (!pose) continue;

                // Extract the surface normal (Y axis of the hit's rotation matrix)
                const mat = new THREE.Matrix4().fromArray(pose.transform.matrix);
                const normal = new THREE.Vector3(0, 1, 0).applyMatrix4(
                  new THREE.Matrix4().extractRotation(mat),
                );
                // A wall normal is mostly horizontal (small Y component)
                const isWall = Math.abs(normal.y) < 0.5;

                if (!bestPose || (isWall && !bestIsWall)) {
                  bestPose = pose;
                  bestIsWall = isWall;
                  bestNormal = normal;
                }
              }

              if (bestPose) {
                reticle.visible = true;
                reticle.matrix.fromArray(bestPose.transform.matrix);
                lastHitIsWall = bestIsWall;
                lastHitNormal = bestNormal;
              }
            } else {
              reticle.visible = false;
            }
          }

          renderer.render(scene, camera);
        });

        if (!cancelled) {
          setStatus('active');
        }

        // Cleanup
        cleanupRef.current = () => {
          renderer.setAnimationLoop(null);
          session.end().catch(() => {});
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          texture.dispose();
          reticleGeometry.dispose();
          reticleMaterial.dispose();
        };

        session.addEventListener('end', () => {
          if (!cancelled) onClose();
        });
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Failed to start AR session');
        }
      }
    }

    startXr();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, [imageUrl, imageWidth, imageHeight, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-sm">Starting AR...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90">
          <p className="text-white text-center px-8">{errorMsg}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}

      {status === 'active' && (
        <>
          <button
            onClick={() => {
              cleanupRef.current?.();
              onClose();
            }}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-sm"
            aria-label="Back"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => {
              cleanupRef.current?.();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm"
            aria-label="Close AR view"
          >
            <CloseIcon size={22} />
          </button>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <span className="px-4 py-2 bg-black/50 rounded-full text-white/80 text-sm backdrop-blur-sm">
              Point at a wall and tap to place. Tap again to move.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Camera overlay fallback (iOS) ──────────────────────────────────────────

function CameraOverlay({
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
}: {
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [artPos, setArtPos] = useState({ x: 0, y: 0 });
  const [artScale, setArtScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        setError('Camera access denied. Please allow camera access to use AR mode.');
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    setArtPos({
      x: window.innerWidth / 2 - (window.innerWidth * 0.4) / 2,
      y: window.innerHeight / 2 - (window.innerWidth * 0.4) / (imageWidth / imageHeight) / 2,
    });
  }, [imageWidth, imageHeight]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          posX: artPos.x,
          posY: artPos.y,
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: artScale };
      }
    },
    [artPos, artScale],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setArtPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
    } else if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      setArtScale(Math.max(0.2, Math.min(3, newScale)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragStart.current = null;
    pinchStart.current = null;
  }, []);

  const artW = typeof window !== 'undefined' ? window.innerWidth * 0.4 * artScale : 200;
  const artH = artW / (imageWidth / imageHeight);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white text-center px-8">{error}</p>
        </div>
      )}

      {!error && (
        <div
          className="absolute touch-none"
          style={{ left: artPos.x, top: artPos.y, width: artW, height: artH }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={imageUrl}
            alt="AR artwork preview"
            width={imageWidth}
            height={imageHeight}
            className="w-full h-full object-contain drop-shadow-2xl"
            draggable={false}
          />
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label="Back"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">Back</span>
      </button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label="Close AR view"
      >
        <CloseIcon size={22} />
      </button>

      {!error && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
          <span className="px-4 py-2 bg-black/50 rounded-full text-white/80 text-sm backdrop-blur-sm">
            Drag to move, pinch to resize
          </span>
        </div>
      )}
    </div>
  );
}
