'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Artist, GalleryConfig } from '@gallery/shared';
import { InstagramLink } from '@/components/instagram-link';
import { Avatar } from '@/components/avatar';
import { api } from '@/lib/api';

export function HomeAbout() {
  const [config, setConfig] = useState<GalleryConfig | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cfg, arts] = await Promise.all([api.galleryConfig.get(), api.artists.list()]);
      if (!cancelled) {
        setConfig(cfg);
        setArtists(arts.filter((a) => a.isActive));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!config) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <h2 className="font-serif text-4xl md:text-5xl mb-8">About</h2>

      {config.aboutText && (
        <div className="text-gallery-gray leading-relaxed text-lg mb-16 max-w-3xl whitespace-pre-line">
          {config.aboutText}
        </div>
      )}

      {artists.length > 0 && (
        <div>
          <h3 className="font-serif text-2xl mb-8">
            {artists.length === 1 ? 'Artist' : 'Artists'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="group relative flex gap-6 p-4 rounded-lg border border-white/5 hover:border-white/15 transition-colors"
              >
                <Link
                  href={`/artists/${artist.slug}`}
                  className="absolute inset-0 z-0"
                  aria-label={artist.name}
                />
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <Avatar name={artist.name} portraitPath={artist.portraitPath} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-xl group-hover:text-gallery-accent transition-colors">
                    {artist.name}
                  </h4>
                  {artist.bio && (
                    <p className="text-gallery-gray text-sm mt-1 line-clamp-3">{artist.bio}</p>
                  )}
                  {artist.instagramUrl && (
                    <div className="relative z-10 mt-2">
                      <InstagramLink url={artist.instagramUrl} name={artist.name} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
