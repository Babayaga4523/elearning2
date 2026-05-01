"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, Phone, Clock, GraduationCap, Headphones } from "lucide-react";

interface SupportContactProps {
  userName?: string;
  userEmail?: string;
  userDepartment?: string;
}

export function SupportContact({ userName, userEmail, userDepartment }: SupportContactProps) {
  
  // Generate email template for support
  const generateSupportEmail = () => {
    const subject = encodeURIComponent(`[E-Learning Support] Kendala dari ${userName || 'Karyawan'}`);
    
    const body = encodeURIComponent(`Halo Tim Support,

Saya mengalami kendala dalam menggunakan sistem E-Learning BNI Finance.

INFORMASI PENGGUNA:
Nama: ${userName || '[Nama Anda]'}
Email: ${userEmail || '[Email Anda]'}
Departemen: ${userDepartment || '[Departemen Anda]'}
Tanggal: ${new Date().toLocaleDateString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

DETAIL KENDALA:
Jenis Kendala: [Pilih: Login/Akses | Test/Quiz | Upload File | Video/Materi | Lainnya]

Deskripsi Masalah:
[Jelaskan kendala yang Anda alami dengan detail]

Langkah yang Sudah Dicoba:
[Jelaskan apa yang sudah Anda coba untuk mengatasi masalah]

Screenshot/Error Message:
[Lampirkan screenshot jika ada]

Browser/Device:
[Contoh: Chrome v120 / Windows 11]

Terima kasih atas bantuannya.

Hormat saya,
${userName || '[Nama Anda]'}`);

    return `mailto:dwi.islamiati@bnifinance.co.id?subject=${subject}&body=${body}`;
  };

  // Generate email template for training HC
  const generateTrainingEmail = () => {
    const subject = encodeURIComponent(`[E-Learning Training] Pertanyaan dari ${userName || 'Karyawan'}`);
    
    const body = encodeURIComponent(`Halo Tim Training & Development,

Saya ingin bertanya mengenai program pelatihan E-Learning.

INFORMASI PENGGUNA:
Nama: ${userName || '[Nama Anda]'}
Email: ${userEmail || '[Email Anda]'}
Departemen: ${userDepartment || '[Departemen Anda]'}
Tanggal: ${new Date().toLocaleDateString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

TOPIK PERTANYAAN:
[Pilih: Materi Pembelajaran | Jadwal Pelatihan | Sertifikat | Enrollment | Lainnya]

PERTANYAAN:
[Tuliskan pertanyaan Anda dengan detail]

Terima kasih atas perhatiannya.

Hormat saya,
${userName || '[Nama Anda]'}`);

    return `mailto:dwi.islamiati@bnifinance.co.id?subject=${subject}&body=${body}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          Butuh Bantuan?
        </CardTitle>
        <CardDescription>
          Hubungi tim kami untuk bantuan dan dukungan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Training HC */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 mb-1">Tim Training & Development</h4>
            <p className="text-xs text-slate-600 mb-3">
              Pertanyaan seputar materi pembelajaran, jadwal pelatihan, dan sertifikat
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <a 
                href={generateTrainingEmail()}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">dwi.islamiati@bnifinance.co.id</span>
              </a>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              asChild
            >
              <a href={generateTrainingEmail()}>
                <Mail className="h-4 w-4 mr-2" />
                Hubungi Training HC
              </a>
            </Button>
          </div>
        </div>

        {/* Technical Support */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all">
          <div className="p-2 bg-green-100 rounded-lg shrink-0">
            <Headphones className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 mb-1">Technical Support</h4>
            <p className="text-xs text-slate-600 mb-3">
              Bantuan untuk masalah teknis: login, error sistem, upload file, dll
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <a 
                href={generateSupportEmail()}
                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">dwi.islamiati@bnifinance.co.id</span>
              </a>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              asChild
            >
              <a href={generateSupportEmail()}>
                <Mail className="h-4 w-4 mr-2" />
                Hubungi Support
              </a>
            </Button>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>Jam Operasional: Senin - Jumat, 08:00 - 17:00 WIB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-5">
            Respon email dalam 1x24 jam kerja
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
