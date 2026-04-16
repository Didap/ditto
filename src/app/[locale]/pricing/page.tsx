import { headers } from "next/headers";
import { detectRegion } from "@/lib/regions";
import { getPricing } from "@/lib/pricing";
import { getUser } from "@/lib/data";
import { PricingClient } from "./pricing-client";

export default async function PricingPage() {
  const hdrs = await headers();
  const region = detectRegion(hdrs);
  const [data, user] = await Promise.all([getPricing(region), getUser()]);

  return <PricingClient data={data} isAuthenticated={!!user} />;
}
