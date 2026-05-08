export function buildNewAdminEmailTemplate(params: {
  fullName: string;
  email: string;
  tempPassword: string;
}): string {
  const { fullName, email, tempPassword } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin Account Created</title>
      </head>

      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background-color:#0f172a; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                      Stock Market Platform
                    </h1>
                    <p style="margin:8px 0 0; color:#cbd5e1; font-size:14px;">
                      Admin Account Provisioning
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700;">
                      Welcome, ${fullName}
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                      An internal admin account has been created for you on the Stock Market Platform.
                      Use the credentials below to log in for the first time.
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Login Email
                      </p>

                      <p style="margin:0 0 20px; color:#111827; font-size:16px; font-weight:700;">
                        ${email}
                      </p>

                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Temporary Password
                      </p>

                      <div style="background-color:#ffffff; border:1px dashed #cbd5e1; border-radius:10px; padding:16px; text-align:center;">
                        <span style="font-size:24px; font-weight:800; letter-spacing:2px; color:#0f172a;">
                          ${tempPassword}
                        </span>
                      </div>
                    </div>

                    <div style="background-color:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:16px; margin-bottom:22px;">
                      <p style="margin:0; color:#9a3412; font-size:14px; line-height:1.6;">
                        <strong>Security reminder:</strong> This is a temporary password. Please log in and change it immediately. Do not share this email or password with anyone.
                      </p>
                    </div>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      If you were not expecting this account, please contact the platform administrator.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px;">
                    <div style="border-top:1px solid #e5e7eb; padding-top:20px;">
                      <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.5; text-align:center;">
                        This is an automated message from Stock Market Platform. Please do not reply to this email.
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