import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

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
  content: Buffer | Blob;
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
  log.info("Sending email", {
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    context: "email"
  });

  // Convert Blob to Buffer if needed (for Edge/Serverless compatibility)
  const processedAttachments = await Promise.all(
    attachments.map(async (a) => ({
      filename: a.filename,
      content: a.content instanceof Blob
        ? Buffer.from(await a.content.arrayBuffer())
        : a.content,
      contentType: a.contentType,
    }))
  );

  return transporter.sendMail({
    from: `"BNI Finance E-Learning" <${env.SMTP_USER}>`,
    to,
    cc,
    subject,
    html,
    attachments: processedAttachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}