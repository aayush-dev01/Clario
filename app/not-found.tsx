import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-warm-white flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="font-hand text-[28px] text-ink-muted mb-2">Page not found</p>
        <h1 className="text-[40px] font-bold text-ink leading-tight">This route does not exist.</h1>
        <p className="mt-4 text-[15px] text-ink-muted leading-relaxed">
          The page may have moved, or the link may be out of date.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-ink text-warm-white px-6 py-3 text-[14px] font-bold rounded-sm hover:bg-ink/90 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
