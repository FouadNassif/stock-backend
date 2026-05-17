export function buildWalletCreditEmailTemplate(params: {
  fullName: string;
  amount: number;
  newBalance: number;
}): string {
  const { fullName, amount, newBalance } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Wallet Deposit Confirmation</title>
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
                      Wallet Deposit Confirmation
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700;">
                      Hi ${fullName},
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                      Your wallet has been credited successfully.
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Deposit Amount
                      </p>

                      <p style="margin:0 0 20px; color:#111827; font-size:28px; font-weight:800;">
                        $${amount.toFixed(2)}
                      </p>

                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        New Wallet Balance
                      </p>

                      <p style="margin:0; color:#111827; font-size:22px; font-weight:700;">
                        $${newBalance.toFixed(2)}
                      </p>
                    </div>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      You can now use your wallet balance to buy listed stocks on the platform.
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

export function buildWithdrawalApprovedEmailTemplate(params: {
  fullName: string;
  amount: number;
  newBalance: number;
}): string {
  const { fullName, amount, newBalance } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Withdrawal Approved</title>
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
                      Withdrawal Approved
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700;">
                      Hi ${fullName},
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                      Your withdrawal request has been reviewed and approved successfully.
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Approved Withdrawal Amount
                      </p>

                      <p style="margin:0 0 20px; color:#111827; font-size:28px; font-weight:800;">
                        $${amount.toFixed(2)}
                      </p>

                      <p style="margin:0 0 8px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        New Wallet Balance
                      </p>

                      <p style="margin:0; color:#111827; font-size:22px; font-weight:700;">
                        $${newBalance.toFixed(2)}
                      </p>
                    </div>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      The amount has been deducted from your wallet balance.
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

export function buildWithdrawalRejectedEmailTemplate(params: {
  fullName: string;
  amount: number;
  reason: string;
}): string {
  const { fullName, amount, reason } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Withdrawal Rejected</title>
      </head>

      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background-color:#7f1d1d; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                      Stock Market Platform
                    </h1>
                    <p style="margin:8px 0 0; color:#fecaca; font-size:14px;">
                      Withdrawal Rejected
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700;">
                      Hi ${fullName},
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                      Your withdrawal request has been reviewed and rejected.
                    </p>

                    <div style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 8px; color:#991b1b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Requested Withdrawal Amount
                      </p>

                      <p style="margin:0 0 20px; color:#111827; font-size:28px; font-weight:800;">
                        $${amount.toFixed(2)}
                      </p>

                      <p style="margin:0 0 8px; color:#991b1b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Rejection Reason
                      </p>

                      <p style="margin:0; color:#7f1d1d; font-size:15px; line-height:1.6;">
                        ${reason}
                      </p>
                    </div>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      No amount has been deducted from your wallet balance.
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