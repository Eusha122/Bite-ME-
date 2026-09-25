import type { Metadata } from "next";
import StaffGate from "@/components/staff/StaffGate";
import KitchenDisplay from "@/components/staff/KitchenDisplay";

export const metadata: Metadata = { title: "Kitchen — BiteME", robots: { index: false } };

export default function KitchenPage() {
  return (
    <StaffGate title="Kitchen display">
      <KitchenDisplay />
    </StaffGate>
  );
}
