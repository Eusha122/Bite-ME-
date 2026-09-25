import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Bagel_Fat_One, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { getCatalog } from "@/lib/db";
import CatalogProvider from "@/components/CatalogProvider";
import CartDrawer from "@/components/shop/CartDrawer";

const bagel = Bagel_Fat_One({ variable: "--font-bagel", subsets: ["latin"], weight: "400" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  openGraph: { title: `${site.name} — ${site.tagline}`, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f0e4d2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // the menu is editable, so every request reads it fresh
  await connection();
  const catalog = await getCatalog();
  return (
    <html lang="en" className={`${bagel.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh">
        <CatalogProvider initial={catalog}>
          {children}
          <CartDrawer />
        </CatalogProvider>
      </body>
    </html>
  );
}
