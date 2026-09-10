import { requireAdmin } from "@/lib/admin-server";
import AdminNav from "@/components/AdminNav";
import { getLang } from "@/lib/lang";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const lang = await getLang();

  return (
    <div>
      <AdminNav lang={lang} />
      {children}
    </div>
  );
}
