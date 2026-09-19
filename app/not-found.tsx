import Link from "next/link";

export default function NotFound() {
  return (
    <div className="border border-line bg-panel px-6 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Not found</p>
      <h2 className="mt-2 text-2xl">That yard record is not in the store.</h2>
      <Link href="/" className="mt-6 inline-block border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wider text-amber">
        Return to intake
      </Link>
    </div>
  );
}
