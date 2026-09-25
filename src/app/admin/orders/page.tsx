import { Suspense } from "react";
import OrdersView from "@/components/admin/OrdersView";

export default function AdminOrdersPage() {
  // OrdersView reads ?order= to open a specific order's drawer
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
