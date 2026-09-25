import type { Metadata } from "next";
import StaffGate from "@/components/staff/StaffGate";
import Dashboard from "@/components/staff/Dashboard";

export const metadata: Metadata = { title: "Dashboard — BiteME", robots: { index: false } };

export default function AdminPage() {
  return (
    <StaffGate title="Owner dashboard">
      <Dashboard />
    </StaffGate>
  );
}
