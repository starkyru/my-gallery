import Link from 'next/link';
import type { Artist, GalleryConfig } from '@gallery/shared';
import { InstagramLink } from '@/components/instagram-link';
import { Avatar } from '@/components/avatar';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function getConfig(): Promise<GalleryConfig> {
  const res = await fetch(`${API_URL}/api/gallery-config`, { next: { revalidate: 300 } });
  return res.json();
}

async function getArtists(): Promise<Artist[]> {
  const res = await fetch(`${API_URL}/api/artists?active=true`, { next: { revalidate: 300 } });
  return res.json();
}

export async function generateMetadata() {
  const config = await getConfig();
  return { title: `About \u2014 ${config.galleryName}` };
}

export default async function AboutPage() {
  const [config, artists] = await Promise.all([getConfig(), getArtists()]);

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-24">
      <h1 className="font-serif text-4xl md:text-5xl mb-8">About</h1>

      {config.aboutText && (
        <div className="text-gallery-gray leading-relaxed text-lg mb-16 max-w-3xl whitespace-pre-line">
          {config.aboutText}
        </div>
      )}

      {artists.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl mb-8">
            {artists.length === 1 ? 'Artist' : 'Artists'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className="group flex gap-6 p-4 rounded-lg border border-white/5 hover:border-white/15 transition-colors"
              >
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <Avatar name={artist.name} portraitPath={artist.portraitPath} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl group-hover:text-gallery-accent transition-colors">
                    {artist.name}
                  </h3>
                  {artist.bio && (
                    <p className="text-gallery-gray text-sm mt-1 line-clamp-3">{artist.bio}</p>
                  )}
                  {artist.instagramUrl && (
                    <div className="mt-2">
                      <InstagramLink url={artist.instagramUrl} name={artist.name} />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
