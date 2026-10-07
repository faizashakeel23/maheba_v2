import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="font-script text-4xl text-blush-500">oopsie ♡</p>
      <h1 className="mt-1 font-display text-5xl text-plum-900">
        Not found or not public
      </h1>
      <p className="mt-2 text-sm font-semibold text-plum-500">
        This listing is missing, pending approval, or its subscription expired ✿
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-6 py-2 text-sm font-extrabold text-white"
      >
        ← back to the pretty stuff
      </Link>
    </main>
  );
}
