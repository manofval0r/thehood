import { redirect } from "next/navigation";

/**
 * Files and videos are one page now. This route stays so old bookmarks and
 * links still land on the material instead of a 404.
 */
export default function AdminFilesPage() {
  redirect("/admin/resources");
}
