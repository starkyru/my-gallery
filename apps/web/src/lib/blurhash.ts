import { decode } from 'blurhash';

const cache = new Map<string, string>();

export function blurhashToDataURL(hash: string, width = 32, height = 32): string {
  const key = `${hash}:${width}:${height}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const pixels = decode(hash, width, height);
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);

  const dataURL = canvas.toDataURL();
  cache.set(key, dataURL);
  return dataURL;
}
