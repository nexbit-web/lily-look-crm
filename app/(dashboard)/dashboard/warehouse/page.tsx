// "use client";

import ProductsTable from "@/components/table-product";
import { checkRole } from "@/lib/checkRole";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Склад товарів",
};

export default async function WarehousePage() {
  await checkRole(["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ProductsTable />
    </div>
  );
}
