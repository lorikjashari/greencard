export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="border-b border-line bg-paper">
        <div className="container-page py-9">
          <div className="skeleton h-2.5 w-24" />
          <div className="mt-4 skeleton h-8 w-64" />
          <div className="mt-3 skeleton h-2.5 w-40" />
        </div>
      </div>
      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-px">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b border-line py-5">
                <div className="skeleton h-3 w-24" />
                <div className="mt-3 skeleton h-5 w-48" />
                <div className="mt-3 skeleton h-3 w-full max-w-md" />
              </div>
            ))}
          </div>
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
