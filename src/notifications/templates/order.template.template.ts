export function buildTradeConfirmationEmailTemplate(params: {
  fullName: string;
  type: 'buy' | 'sell';
  ticker: string;
  companyName: string;
  quantity: number;
  priceAtExecution: number;
  totalAmount: number;
  walletBalance: number;
  realizedProfitLoss?: number;
}): string {
  const {
    fullName,
    type,
    ticker,
    companyName,
    quantity,
    priceAtExecution,
    totalAmount,
    walletBalance,
    realizedProfitLoss,
  } = params;

  const isBuy = type === 'buy';

  const title = isBuy ? 'Buy Order Completed' : 'Sell Order Completed';
  const subtitle = isBuy
    ? 'Your buy order was executed successfully.'
    : 'Your sell order was executed successfully.';

  const badgeText = isBuy ? 'BUY' : 'SELL';

  const pnlSection = !isBuy
    ? `
      <tr>
        <td style="padding:12px 0; color:#64748b; font-size:14px;">
          Realized Profit / Loss
        </td>
        <td align="right" style="padding:12px 0; color:#111827; font-size:14px; font-weight:700;">
          $${(realizedProfitLoss ?? 0).toFixed(2)}
        </td>
      </tr>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>

      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background-color:#0f172a; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                      Stock Market Platform
                    </h1>
                    <p style="margin:8px 0 0; color:#cbd5e1; font-size:14px;">
                      Trade Confirmation
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 24px;">
                    <div style="text-align:center; margin-bottom:24px;">
                      <span style="display:inline-block; padding:8px 16px; border-radius:999px; background-color:${isBuy ? '#dcfce7' : '#dbeafe'
    }; color:${isBuy ? '#166534' : '#1e40af'
    }; font-size:13px; font-weight:800; letter-spacing:1px;">
                        ${badgeText}
                      </span>
                    </div>

                    <h2 style="margin:0 0 12px; color:#111827; font-size:22px; font-weight:700; text-align:center;">
                      ${title}
                    </h2>

                    <p style="margin:0 0 28px; color:#4b5563; font-size:15px; line-height:1.6; text-align:center;">
                      Hi ${fullName}, ${subtitle}
                    </p>

                    <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:22px; margin:28px 0;">
                      <p style="margin:0 0 6px; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:0.8px;">
                        Stock
                      </p>

                      <p style="margin:0; color:#111827; font-size:20px; font-weight:800;">
                        ${ticker}
                      </p>

                      <p style="margin:4px 0 0; color:#6b7280; font-size:14px;">
                        ${companyName}
                      </p>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:12px 0; color:#64748b; font-size:14px; border-bottom:1px solid #e5e7eb;">
                          Quantity
                        </td>
                        <td align="right" style="padding:12px 0; color:#111827; font-size:14px; font-weight:700; border-bottom:1px solid #e5e7eb;">
                          ${quantity}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:12px 0; color:#64748b; font-size:14px; border-bottom:1px solid #e5e7eb;">
                          Price at Execution
                        </td>
                        <td align="right" style="padding:12px 0; color:#111827; font-size:14px; font-weight:700; border-bottom:1px solid #e5e7eb;">
                          $${priceAtExecution.toFixed(2)}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:12px 0; color:#64748b; font-size:14px; border-bottom:1px solid #e5e7eb;">
                          Total Amount
                        </td>
                        <td align="right" style="padding:12px 0; color:#111827; font-size:14px; font-weight:700; border-bottom:1px solid #e5e7eb;">
                          $${totalAmount.toFixed(2)}
                        </td>
                      </tr>

                      ${pnlSection}

                      <tr>
                        <td style="padding:12px 0; color:#64748b; font-size:14px;">
                          Wallet Balance
                        </td>
                        <td align="right" style="padding:12px 0; color:#111827; font-size:14px; font-weight:700;">
                          $${walletBalance.toFixed(2)}
                        </td>
                      </tr>
                    </table>

                    <p style="margin:28px 0 0; color:#6b7280; font-size:14px; line-height:1.6;">
                      You can view this order in your order history and transaction history.
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