import AnnouncementManager from "@/components/AnnouncementManager";
import AdminShell from "@/components/AdminShell";

export const metadata = { title: "Kelola Berita" };

export default function AdminBeritaPage() {
  return (
    <AdminShell>
      <AnnouncementManager />
    </AdminShell>
  );
}
