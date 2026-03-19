import { UPLOAD_URL } from '@/config';

export function Avatar({ name, portraitPath }: { name: string; portraitPath?: string | null }) {
  if (portraitPath) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-white/5">
        <img src={`${UPLOAD_URL}/${portraitPath}`} alt={name} className="w-full h-auto" />
      </div>
    );
  }

  return (
    <div className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
      <span className="text-6xl text-gallery-gray">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
