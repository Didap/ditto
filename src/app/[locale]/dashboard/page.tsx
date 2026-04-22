import { redirect } from "next/navigation";
import {
  getUser,
  getDashboardDesigns,
  getTrashDesigns,
  DASHBOARD_PAGE_SIZE,
} from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [designsPage, trash] = await Promise.all([
    getDashboardDesigns(user.id, { page: requestedPage }),
    getTrashDesigns(user.id),
  ]);

  return (
    <DashboardClient
      initialDesigns={designsPage.designs}
      initialTrash={trash}
      initialPage={designsPage.page}
      initialTotalPages={designsPage.totalPages}
      initialTotal={designsPage.total}
      perPage={DASHBOARD_PAGE_SIZE}
    />
  );
}
