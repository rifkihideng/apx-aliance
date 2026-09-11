import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import ChatBot from "@/components/ChatBot";
import { getLang } from "@/lib/lang";
import { getTheme } from "@/lib/theme";
import { getSiteUrl } from "@/lib/site";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "APX Alliance",
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/icon.svg`,
  description: "Website resmi aliansi APX di game Narco Empire.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "APX Alliance — Narco Empire",
    template: "%s | APX Alliance",
  },
  description: "Website resmi aliansi APX di game Narco Empire.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "APX Alliance",
    title: "APX Alliance — Narco Empire",
    description: "Website resmi aliansi APX di game Narco Empire.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "APX Alliance — Narco Empire",
    description: "Website resmi aliansi APX di game Narco Empire.",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const theme = await getTheme();

  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        theme === "light" ? "light" : ""
      }`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <CursorGlow />
        <Navbar lang={lang} theme={theme} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} />
        <ChatBot lang={lang} />
      </body>
    </html>
  );
}
