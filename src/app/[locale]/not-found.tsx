"use client";

import { useLocalePath } from "@/lib/locale-context";

export default function NotFound() {
  const lp = useLocalePath();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-sm">
        <span className="w-16 h-16 ditto-blob inline-block mb-4 opacity-40" />
        <h2 className="text-2xl font-bold text-(--ditto-text) mb-2">
          Page not found
        </h2>
        <p className="text-sm text-(--ditto-text-muted) mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href={lp("/dashboard")}
          className="inline-block rounded-lg bg-(--ditto-primary) px-6 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
