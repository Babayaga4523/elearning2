import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-600 mb-8">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
      <Link 
        href="/"
        className="px-6 py-2 bg-[#0F1C3F] text-white rounded-lg hover:bg-[#1A3060] transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
