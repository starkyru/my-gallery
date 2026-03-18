import { InstagramIcon } from '@/components/icons/instagram-icon';

function ensureHttps(url: string): string {
  return url.startsWith('https://') ? url : `https://${url}`;
}

export function InstagramLink({ url, name }: { url: string; name: string }) {
  return (
    <a
      href={ensureHttps(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gallery-gray hover:text-gallery-accent transition-colors"
      aria-label={`${name} on Instagram`}
    >
      <InstagramIcon />
    </a>
  );
}
