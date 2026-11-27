export default function CatalogSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} aria-hidden="true" className="grid gap-3">
          <div className="wl-skeleton aspect-square" />
          <div className="wl-skeleton h-4 w-3/4" />
          <div className="wl-skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
