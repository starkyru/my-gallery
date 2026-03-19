export function ArrowUpRightIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="h-5 w-5"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 17L17 7M17 7H7M17 7v10"
      />
    </svg>
  );
}
