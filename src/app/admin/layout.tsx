import type { Metadata } from "next";
import StaffGate from "@/components/staff/StaffGate";
import AdminDataProvider from "@/components/admin/AdminData";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "BiteME Admin", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <StaffGate title="Admin">
      <AdminDataProvider>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </StaffGate>
  );
}
