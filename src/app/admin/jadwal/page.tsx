import EventManager from "@/components/EventManager";
import AdminShell from "@/components/AdminShell";

export const metadata = { title: "Kelola Jadwal" };

export default function AdminJadwalPage() {
  return (
    <AdminShell>
      <EventManager />
    </AdminShell>
  );
}
