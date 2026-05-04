import Link from 'next/link';
import type { Artist } from '@gallery/shared';
import { Flourish } from '@/components/overtone/flourish';
import { Avatar } from '@/components/common/avatar';
import { InstagramIcon } from '@/components/icons/instagram-icon';

export function AboutStrip({ artists }: { artists: Artist[] }) {
  return (
    <section className="bg-ot-paper-2 px-5 md:px-7 lg:px-10 py-[60px] md:py-20 lg:py-[100px]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1fr] gap-8 md:gap-14 items-center max-w-[1280px] mx-auto">
        {/* Left */}
        <div>
          <div className="ot-eyebrow mb-[18px]">About Us</div>
          <h2 className="ot-display text-[40px] md:text-[52px] m-0 leading-[1.05]">
            Two artists.
            <br />
            One vision.
          </h2>
          <Flourish width={60} className="mt-5" />
        </div>

        {/* Center — prose */}
        <div className="flex flex-col gap-3.5 font-serif italic text-[17px] text-ot-ink-soft leading-relaxed">
          <p className="m-0">
            We see the world differently &mdash;
            <br /> in light, in color, in quiet moments.
          </p>
          <p className="m-0">
            Svetlana paints emotion,
            <br /> Ilia captures atmosphere.
          </p>
          <p className="m-0">Together &mdash; we create what is felt.</p>
          <Link href="/about" className="ot-btn self-start mt-3.5">
            Learn More About Us
          </Link>
        </div>

        {/* Right — artist cards */}
        <div className="flex gap-5 justify-start md:justify-end">
          {artists.map((a) => (
            <div key={a.id} className="text-center max-w-[160px]">
              <div className="w-[140px] h-[170px] mb-3 overflow-hidden">
                <Avatar name={a.name} portraitPath={a.portraitPath} />
              </div>
              <div className="font-serif text-lg">{a.name}</div>
              <div className="ot-meta mt-1 text-[9px] tracking-[0.24em]">
                {a.slug === 'ilia' ? 'Photographer' : 'Painter'}
              </div>
              {a.instagramUrl && (
                <a
                  href={
                    a.instagramUrl.startsWith('https://')
                      ? a.instagramUrl
                      : `https://${a.instagramUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-ot-mute hover:text-ot-ochre transition-colors"
                  aria-label={`${a.name} on Instagram`}
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
