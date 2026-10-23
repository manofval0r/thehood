import { redirect } from "next/navigation";

/** Notification controls live under Settings now. */
export default function AdminNotificationsPage() {
  redirect("/admin/settings/notifications");
}
