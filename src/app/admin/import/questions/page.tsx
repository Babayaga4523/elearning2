import { Metadata } from "next";
import { QuestionsImportClient } from "./_components/QuestionsImportClient";

export const metadata: Metadata = {
  title: "Import Soal | Admin",
  description: "Bulk import soal dari Excel",
};

export default function QuestionsImportPage() {
  return <QuestionsImportClient />;
}
