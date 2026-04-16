import { notFound, redirect } from "next/navigation";
import { getUser, getDesignBySlug } from "@/lib/data";
import { PreviewClient } from "./preview-client";

export default async function StandalonePreviewPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { slug, page } = await params;
  const design = await getDesignBySlug(user.id, slug);
  if (!design) notFound();

  return <PreviewClient design={design} pageName={page} />;
}
