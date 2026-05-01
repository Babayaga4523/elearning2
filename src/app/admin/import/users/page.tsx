import { Metadata } from "next";
import { UsersImportClient } from "./_components/UsersImportClient";

export const metadata: Metadata = {
  title: "Import Karyawan | Admin",
  description: "Bulk import karyawan dari Excel",
};

export default function UsersImportPage() {
  return <UsersImportClient />;
}
