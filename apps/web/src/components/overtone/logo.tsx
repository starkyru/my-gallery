import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  small?: boolean;
  linked?: boolean;
}

export function Logo({ small = false, linked = true }: LogoProps) {
  const size = small ? 30 : 38;
  const content = (
    <span className="inline-flex items-center gap-3 text-ot-ink">
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className="flex-none"
        aria-hidden="true"
      />
      <span className="flex flex-col leading-none">
        <span className="font-serif tracking-tight" style={{ fontSize: small ? 20 : 26 }}>
          Overtone<span className="text-ot-ochre">.art</span>
        </span>
        <span
          className="font-sans font-medium text-ot-mute uppercase mt-1"
          style={{
            fontSize: small ? 8 : 9,
            letterSpacing: small ? '0.28em' : '0.32em',
          }}
        >
          Art Studio
        </span>
      </span>
    </span>
  );

  if (!linked) return content;

  return (
    <Link href="/" className="no-underline">
      {content}
    </Link>
  );
}
