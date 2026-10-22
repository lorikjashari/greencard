import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-serif text-5xl text-forest-900">404</p>
        <h1 className="mt-3 text-lg font-semibold text-ink">Faqja nuk u gjet.</h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">Page not found. Lidhja mund të jetë e vjetër ose e pasaktë.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link href="/sq" className="btn-primary btn-sm">
            Kthehu në faqen kryesore
          </Link>
          <Link href="/en" className="btn-secondary btn-sm">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
