import { redirect } from "next/navigation";

/** Session breaks live under Settings now. */
export default function AdminSchedulePage() {
  redirect("/admin/settings/breaks");
}
