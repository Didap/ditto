import { headers } from "next/headers";
import { detectRegion } from "@/lib/regions";
import { getPricing } from "@/lib/pricing";
import { PricingClient } from "./pricing-client";

export default async function PricingPage() {
  const hdrs = await headers();
  const region = detectRegion(hdrs);
  const data = await getPricing(region);

  return <PricingClient data={data} />;
}
