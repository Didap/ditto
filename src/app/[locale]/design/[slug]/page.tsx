import { notFound, redirect } from "next/navigation";
import { getUser, getDesignBySlug } from "@/lib/data";
import { DesignDetailClient } from "./design-client";

export default async function DesignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const design = await getDesignBySlug(user.id, slug);
  if (!design) notFound();

  return <DesignDetailClient initialDesign={design} slug={slug} />;
}
