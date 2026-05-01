import { Metadata } from "next";
import { EnrollmentsImportClient } from "./_components/EnrollmentsImportClient";

export const metadata: Metadata = {
  title: "Import Enrollment | Admin",
  description: "Bulk import enrollment dari Excel",
};

export default function EnrollmentsImportPage() {
  return <EnrollmentsImportClient />;
}
