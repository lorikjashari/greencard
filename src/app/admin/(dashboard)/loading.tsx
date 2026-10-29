export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-2">
          <div className="skeleton h-2.5 w-16" />
          <div className="skeleton h-6 w-56" />
          <div className="skeleton h-2.5 w-80" />
        </div>
        <div className="skeleton h-8 w-32" />
      </div>
      <div className="mt-5 grid border border-line bg-paper sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-b border-line p-4 last:border-b-0 sm:border-b-0 sm:border-l sm:first:border-l-0">
            <div className="skeleton h-2.5 w-20" />
            <div className="mt-3 skeleton h-7 w-12" />
            <div className="mt-2 skeleton h-2.5 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-6 border border-line bg-paper p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
