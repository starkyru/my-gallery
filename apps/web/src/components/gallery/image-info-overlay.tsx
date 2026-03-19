interface ImageInfoOverlayProps {
  title: string;
  projectName?: string;
  artistName?: string;
}

export function ImageInfoOverlay({ title, projectName, artistName }: ImageInfoOverlayProps) {
  return (
    <div className="absolute bottom-20 left-0 z-10 px-6 py-4">
      <div className="flex flex-col gap-0.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        <span className="text-lg font-semibold text-white">{title}</span>
        {projectName && <span className="text-sm text-white/80">{projectName}</span>}
        {artistName && <span className="text-sm text-white/80">by {artistName}</span>}
      </div>
    </div>
  );
}
