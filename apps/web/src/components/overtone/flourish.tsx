interface FlourishProps {
  width?: number;
  className?: string;
}

export function Flourish({ width = 120, className = '' }: FlourishProps) {
  const h = Math.round((width / 120) * 14);
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      className={`text-ot-ochre block ${className}`}
      aria-hidden="true"
    >
      <path
        d={`M2 ${h * 0.57} C ${width * 0.25} ${h * 0.14}, ${width * 0.5} ${h * 0.86}, ${width - 2} ${h * 0.43}`}
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
