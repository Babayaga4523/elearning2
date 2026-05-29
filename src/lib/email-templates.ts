/**
 * Forgot Password Email Template
 *
 * Creates a branded HTML email for password reset requests.
 * Uses inline styles for maximum email client compatibility.
 */

export interface ForgotPasswordEmailData {
  recipientName: string;
  resetLink: string;
  expiryHours: number;
  requestIp?: string;
  requestTime: Date;
}

/**
 * Format date in Indonesian locale with WIB timezone
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  }).format(date);
}

/**
 * Generate the forgot password email HTML
 */
export function generateForgotPasswordEmail(data: ForgotPasswordEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, resetLink, expiryHours, requestIp, requestTime } = data;

  const formattedDate = formatDate(requestTime);

  const subject = "Reset Password - BNI Finance E-Learning";

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F1C3F 0%, #1A3060 100%); padding: 32px 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://elearning.bnifinance.co.id/logo-bnifinance-white.png" alt="BNI Finance" style="max-width: 160px; height: auto; margin-bottom: 16px;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">Reset Password</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Halo <strong>${recipientName}</strong>,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Kami menerima permintaan untuk mereset password akun Anda di <strong>BNI Finance E-Learning</strong>.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #E8A020 0%, #F5C842 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FB; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong style="color: #374151;">Informasi:</strong><br>
                      • Link ini berlaku selama <strong>${expiryHours} jam</strong><br>
                      • Permintaan dibuat pada: <strong>${formattedDate}</strong>
                      ${requestIp ? `<br>• Alamat IP: <strong>${requestIp}</strong>` : ""}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400E; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong>Keamanan:</strong> Jika Anda tidak meminta reset password ini, abaikan email ini. Seseorang mungkin memasukkan email Anda secara tidak sengaja.
                </p>
              </div>

              <!-- Footer Text -->
              <p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
                Email ini dikirim secara otomatis oleh sistem. Mohon jangan membalas email ini.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB; border-radius: 0 0 12px 12px;">
              <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
                <strong>BNI Finance E-Learning System</strong><br>
                HR Operations Division
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

        <!-- Additional Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                Pesan ini dikirimkan kepada Anda karena ada aktivitas reset password pada akun Anda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version
  const text = `
BNI Finance E-Learning - Reset Password

Halo ${recipientName},

Kami menerima permintaan untuk mereset password akun Anda.

Klik link di bawah untuk mereset password Anda:
${resetLink}

Informasi:
- Link ini berlaku selama ${expiryHours} jam
- Permintaan dibuat pada: ${formattedDate}
${requestIp ? `- Alamat IP: ${requestIp}` : ""}

Jika Anda tidak meminta reset password ini, abaikan email ini.

---
BNI Finance E-Learning System
HR Operations Division
  `.trim();

  return { subject, html, text };
}