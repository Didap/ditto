import { redirect } from "next/navigation";
import { getUser, getCatalogData } from "@/lib/data";
import { CatalogClient } from "./catalog-client";

export default async function CatalogPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { items, unlockCost } = await getCatalogData(user.id);

  return <CatalogClient initialItems={items} initialUnlockCost={unlockCost} />;
}
