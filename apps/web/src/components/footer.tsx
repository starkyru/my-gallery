import { config } from '@/config';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 text-center text-sm text-gallery-gray">
      <p>
        &copy; {new Date().getFullYear()} {config.galleryName}. All rights reserved.
      </p>
    </footer>
  );
}
