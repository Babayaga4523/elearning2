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

export async function sendEmailWithRetry({
  to,
  subject,
  html,
  text,
  retries = 3
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  retries?: number;
}): Promise<{ success: boolean; error?: string }> {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      await transporter.sendMail({
        from: `"BNI Finance E-Learning" <${env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      });
      return { success: true };
    } catch (error) {
      attempt++;
      log.warn(`Email sending failed (attempt ${attempt}/${retries})`, {
        to,
        error: error instanceof Error ? error.message : "Unknown error",
        context: "email"
      });
      
      if (attempt >= retries) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to send email after retries"
        };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return { success: false, error: "Max retries exceeded" };
}