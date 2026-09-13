import { getLang } from "@/lib/lang";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const lang = await getLang();
  return <AdminLoginForm lang={lang} />;
}
