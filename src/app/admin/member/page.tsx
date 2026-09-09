import MemberManager from "@/components/MemberManager";
import AdminShell from "@/components/AdminShell";

export const metadata = { title: "Kelola Member" };

export default function AdminMemberPage() {
  return (
    <AdminShell>
      <MemberManager />
    </AdminShell>
  );
}
