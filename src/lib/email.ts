import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
    from: process.env.SMTP_FROM || `"BNI Finance E-Learning" <${process.env.SMTP_USER}>`,
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
