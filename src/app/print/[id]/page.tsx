import type { Metadata } from "next";
import StaffGate from "@/components/staff/StaffGate";
import PrintOrder from "@/components/admin/PrintOrder";

export const metadata: Metadata = { title: "Print — BiteME", robots: { index: false } };

export default async function PrintPage({ params, searchParams }: PageProps<"/print/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const type = sp.type === "kot" ? "kot" : "receipt";
  return (
    <StaffGate title="Print">
      <PrintOrder id={id} type={type} />
    </StaffGate>
  );
}
