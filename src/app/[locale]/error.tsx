"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-sm">
        <span className="w-12 h-12 ditto-blob inline-block mb-4 opacity-40" />
        <h2 className="text-xl font-bold text-(--ditto-text) mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-(--ditto-text-muted) mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-(--ditto-primary) px-6 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
