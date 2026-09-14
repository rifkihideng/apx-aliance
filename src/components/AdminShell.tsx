import AdminNav from "@/components/AdminNav";
import { getLang } from "@/lib/lang";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const lang = await getLang();

  return (
    <div>
      <AdminNav lang={lang} />
      {children}
    </div>
  );
}
