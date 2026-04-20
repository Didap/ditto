import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { AdminUsersClient } from "./users-client";

export const metadata: Metadata = { title: "Manage Users" };

export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/dashboard");
  return <AdminUsersClient currentAdminId={admin.id} />;
}
