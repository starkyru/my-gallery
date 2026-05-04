import type { Artist } from '@gallery/shared';
import { Avatar } from '@/components/common/avatar';
import { Flourish } from '@/components/overtone/flourish';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function getArtists(): Promise<Artist[]> {
  const res = await fetch(`${API_URL}/api/artists?active=true`, { next: { revalidate: 300 } });
  return res.json();
}

export async function generateMetadata() {
  return { title: 'About — Overtone.art' };
}

export default async function AboutPage() {
  const artists = await getArtists();

  return (
    <main>
      {/* Hero */}
      <section className="pt-10 md:pt-20 pb-8 md:pb-10">
        <div className="px-5 md:px-10 max-w-[920px] text-center mx-auto">
          <div className="ot-eyebrow mb-[18px]">About the studio</div>
          <h1 className="ot-display text-[52px] md:text-[96px] m-0 leading-[1.02]">
            We make <span className="italic text-ot-ochre">quiet</span> things
            <br /> in a loud city.
          </h1>
          <Flourish width={120} className="mx-auto mt-6" />
          <p className="text-base md:text-lg leading-relaxed text-ot-ink-soft mt-8 max-w-[640px] mx-auto">
            Overtone is a two-person gallery in Charlotte, North Carolina. Ilia at one end with
            cameras and a wet darkroom, Sveta at the other surrounded by stretched canvas and
            palette knives. Visitors are welcome by appointment.
          </p>
        </div>
      </section>

      {/* Artist cards */}
      <section className="pb-[60px] md:pb-[100px]">
        <div className="px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6">
            {artists.map((a) => (
              <article
                key={a.id}
                className="bg-ot-paper-2 p-5 md:p-8 grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-4 md:gap-6 items-start"
              >
                <div className="w-[100px] md:w-[140px] aspect-square overflow-hidden">
                  <Avatar name={a.name} portraitPath={a.portraitPath} />
                </div>
                <div>
                  <div className="ot-eyebrow mb-1.5">
                    {a.slug === 'ilia' ? 'Photographer' : 'Painter'}
                  </div>
                  <h3 className="ot-display text-[32px] md:text-[40px] m-0 italic">{a.name}</h3>
                  {a.bio && (
                    <p className="text-sm leading-relaxed text-ot-ink-soft mt-3.5">{a.bio}</p>
                  )}
                  <div className="flex gap-4 mt-[18px] font-mono text-[11px] tracking-[0.08em] text-ot-mute uppercase">
                    <span>Charlotte, NC</span>
                    <span>&middot;</span>
                    <span>{a.slug === 'ilia' ? 'Photographer' : 'Painter'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
