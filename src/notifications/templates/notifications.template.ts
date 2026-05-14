export function buildPriceAlertEmailTemplate(params: {
  fullName: string;
  ticker: string;
  companyName: string;
  targetPrice: number;
  currentPrice: number;
  direction: 'above' | 'below';
}): string {
  const {
    fullName,
    ticker,
    companyName,
    targetPrice,
    currentPrice,
    direction,
  } = params;

  const directionText = direction === 'above' ? 'above' : 'below';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Price Alert Triggered</title>
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
                      Price Alert Notification
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <div style="text-align:center; margin-bottom:24px;">
                      <span style="display:inline-block; padding:8px 16px; border-radius:999px; background-color:#dbeafe; color:#1d4ed8; font-size:13px; font-weight:800; letter-spacing:1px;">
                        PRICE ALERT TRIGGERED
                      </span>
                    </div>

                    <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:700; text-align:center;">
                      Hi ${fullName},
                    </h2>

                    <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6; text-align:center;">
                      Your price alert for <strong>${ticker}</strong> has been triggered.
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 10px; color:#111827; font-size:18px; font-weight:700;">
                        ${ticker} - ${companyName}
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0; color:#6b7280; font-size:14px;">
                            Alert Condition
                          </td>
                          <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:700; text-align:right;">
                            Price ${directionText} $${targetPrice.toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:8px 0; color:#6b7280; font-size:14px;">
                            Current Price
                          </td>
                          <td style="padding:8px 0; color:#16a34a; font-size:18px; font-weight:800; text-align:right;">
                            $${currentPrice.toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
                      This alert has now been marked as triggered and will not be sent again.
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