import { requireAdmin } from "@/lib/admin-server";
import AdminNav from "@/components/AdminNav";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
