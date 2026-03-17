const SKELETON_HEIGHTS = [280, 360, 320, 400, 300, 380, 340, 260, 350, 310, 390, 270];

function SkeletonCard({ height }: { height: number }) {
  return (
    <div className="break-inside-avoid">
      <div className="relative overflow-hidden rounded-lg bg-white/5" style={{ height }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
      {SKELETON_HEIGHTS.map((h, i) => (
        <SkeletonCard key={i} height={h} />
      ))}
    </div>
  );
}
