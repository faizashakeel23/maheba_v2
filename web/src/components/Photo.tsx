/**
 * Photo with a graceful fallback: when `src` is missing or empty, render a
 * branded placeholder instead of `<img src="">` (an empty src makes the
 * browser re-download the whole page and logs a console error).
 */
export default function Photo({
  src,
  alt,
  className,
  eager,
  compact,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
  compact?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-blush-50 via-blush-100 to-fuchsia-100 ${
          className ?? ""
        }`}
      >
        <span
          className={
            compact
              ? "text-xl text-blush-400"
              : "px-4 text-center font-script text-2xl text-blush-500"
          }
        >
          {compact ? "✿" : "pretty photos coming soon ♡"}
        </span>
      </div>
    );
  }
  // Plain <img> is intentional: sources are local/DB paths, no remote
  // optimization needed.
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? undefined : "lazy"}
    />
  );
}
