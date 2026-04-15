"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function LottieLoader({ size = 64 }: { size?: number }) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/loader.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <div style={{ width: size, height: size }} />;

  return (
    <Lottie
      animationData={data}
      loop
      autoplay
      style={{ width: size, height: size }}
    />
  );
}
