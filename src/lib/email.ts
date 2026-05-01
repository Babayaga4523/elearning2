import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: false, // STARTTLS
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: { 
    ciphers: "SSLv3",
    rejectUnauthorized: false // Sering dibutuhkan oleh korporat
  }, 
});

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export async function sendEmailWithAttachment({
  to,
  cc,
  subject,
  html,
  attachments = [],
}: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  console.log(`[EMAIL] Mengirim email ke: ${to}, subject: ${subject}`);
  
  return transporter.sendMail({
    from: `"BNI Finance E-Learning" <${env.SMTP_USER}>`,
    to,
    cc,
    subject,
    html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}
