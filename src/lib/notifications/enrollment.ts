import { sendEmailWithAttachment } from "@/lib/email";

export type EnrollmentNotifType = "APPROVED" | "REJECTED";

interface EnrollmentNotifPayload {
  to: string;
  employeeName: string;
  courseName: string;
  type: EnrollmentNotifType;
  rejectionNote?: string;
}

export async function sendEnrollmentNotification(payload: EnrollmentNotifPayload) {
  const isApproved = payload.type === "APPROVED";
  
  const subject = isApproved
    ? `Pendaftaran Kursus "${payload.courseName}" Disetujui`
    : `Pendaftaran Kursus "${payload.courseName}" Ditolak`;

  const body = isApproved
    ? `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #059669;">Selamat!</h2>
        <p>Halo <strong>${payload.employeeName}</strong>,</p>
        <p>Pendaftaran Anda untuk kursus <strong>"${payload.courseName}"</strong> telah <strong>DISETUJUI</strong> oleh Admin.</p>
        <p>Mulai hari ini, Anda sudah dapat mengakses materi pembelajaran lengkap di dashboard E-Learning.</p>
        <div style="margin-top: 20px;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Mulai Belajar</a>
        </div>
        <p style="margin-top: 30px; font-size: 0.8em; color: #666;">BNI Finance E-Learning System</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #DC2626;">Pendaftaran Belum Dapat Disetujui</h2>
        <p>Halo <strong>${payload.employeeName}</strong>,</p>
        <p>Kami mohon maaf, pendaftaran Anda untuk kursus <strong>"${payload.courseName}"</strong> belum dapat kami setujui saat ini.</p>
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #991B1B;">Alasan Penolakan:</p>
          <p style="margin: 5px 0 0 0; font-style: italic;">"${payload.rejectionNote || "Tanpa alasan spesifik"}"</p>
        </div>
        <p>Silakan tinjau alasan di atas dan ajukan kembali jika diperlukan. Terima kasih atas pengertiannya.</p>
        <p style="margin-top: 30px; font-size: 0.8em; color: #666;">BNI Finance E-Learning System</p>
      </div>
    `;

  return sendEmailWithAttachment({
    to: payload.to,
    subject,
    html: body,
  });
}
