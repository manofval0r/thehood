import { redirect } from "next/navigation";

/**
 * Files and videos are one page now. This route stays so old bookmarks and
 * links still land on the videos, not just the shared page with Files open.
 */
export default function AdminVideosPage() {
  redirect("/admin/resources?tab=videos");
}
