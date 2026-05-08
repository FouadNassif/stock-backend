
export function buildOtpEmailTemplate(code: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email</title>
      </head>

      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background-color:#0f172a; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                      Stock Market
                    </h1>
                    <p style="margin:8px 0 0; color:#cbd5e1; font-size:14px;">
                      Secure Email Verification
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700;">
                      Verify your email address
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                      Welcome to Stock Market. Use the verification code below to complete your account registration.
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:24px; text-align:center; margin:28px 0;">
                      <p style="margin:0 0 10px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:1px;">
                        Your OTP Code
                      </p>

                      <div style="font-size:34px; font-weight:800; letter-spacing:8px; color:#0f172a;">
                        ${code}
                      </div>
                    </div>

                    <p style="margin:0 0 12px; color:#4b5563; font-size:15px; line-height:1.6;">
                      This code will expire in <strong>10 minutes</strong>. Please do not share it with anyone.
                    </p>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      If you did not request this verification, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px;">
                    <div style="border-top:1px solid #e5e7eb; padding-top:20px;">
                      <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.5; text-align:center;">
                        This is an automated message. Please do not reply to this email.
                      </p>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}