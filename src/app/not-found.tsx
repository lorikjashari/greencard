import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] items-center py-16">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-clay" aria-hidden="true" />
          <p className="eyebrow">404</p>
        </div>

        <h1 className="display mt-5 text-[clamp(2rem,5vw,3.25rem)]">
          Faqja nuk u gjet.
          <span className="block font-normal text-muted">Page not found.</span>
        </h1>

        <p className="lede mt-5 max-w-md text-[15px]">
          Lidhja mund të jetë e vjetër ose e pasaktë. The link may be old or incorrect.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sq" className="btn-primary">
            Kthehu në faqen kryesore
          </Link>
          <Link href="/sq/faq" className="btn-secondary">
            Pyetje të shpeshta
          </Link>
          <Link href="/sq/login" className="btn-ghost">
            Zona e klientit
          </Link>
        </div>
      </div>
    </div>
  );
}
