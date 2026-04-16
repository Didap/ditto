import { redirect } from "next/navigation";
import { getUser, getDashboardDesigns, getTrashDesigns, getQuestsData } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [designs, trash, questsData] = await Promise.all([
    getDashboardDesigns(user.id),
    getTrashDesigns(user.id),
    getQuestsData(user.id),
  ]);

  return (
    <DashboardClient
      initialDesigns={designs}
      initialTrash={trash}
      initialQuests={questsData.quests}
      referralCode={questsData.referralCode}
    />
  );
}
