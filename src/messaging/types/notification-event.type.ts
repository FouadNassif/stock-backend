export enum NotificationEventType {
  OtpEmailRequested = 'otp.email.requested',
  PasswordResetOtpEmailRequested = 'password_reset_otp.email.requested',

  NewAdminEmailRequested = 'new_admin.email.requested',

  WalletCreditEmailRequested = 'wallet_credit.email.requested',

  WithdrawalApprovedEmailRequested = 'withdrawal.approved.email.requested',
  WithdrawalRejectedEmailRequested = 'withdrawal.rejected.email.requested',

  TradeConfirmationEmailRequested = 'trade_confirmation.email.requested',

  IdentityApprovedEmailRequested = 'identity.approved.email.requested',
  IdentityRejectedEmailRequested = 'identity.rejected.email.requested',

  MemberSuspendedEmailRequested = 'member.suspended.email.requested',

  PriceAlertTriggered = 'price_alert.triggered',

  StockPriceUpdated = 'stock.price.updated',
}

export type OtpEmailRequestedPayload = {
  email: string;
  code: string;
};

export type PasswordResetOtpEmailRequestedPayload = {
  email: string;
  fullName: string;
  code: string;
};

export type NewAdminEmailRequestedPayload = {
  email: string;
  fullName: string;
  tempPassword: string;
};

export type WalletCreditEmailRequestedPayload = {
  email: string;
  fullName: string;
  amount: number;
  newBalance: number;
};

export type WithdrawalApprovedEmailRequestedPayload = {
  email: string;
  fullName: string;
  amount: number;
  newBalance: number;
};

export type WithdrawalRejectedEmailRequestedPayload = {
  email: string;
  fullName: string;
  amount: number;
  reason: string;
};

export type TradeConfirmationEmailRequestedPayload = {
  email: string;
  fullName: string;
  type: 'buy' | 'sell';
  ticker: string;
  companyName: string;
  quantity: number;
  priceAtExecution: number;
  totalAmount: number;
  walletBalance: number;
  realizedProfitLoss?: number;
};

export type IdentityApprovedEmailRequestedPayload = {
  email: string;
  fullName: string;
};

export type IdentityRejectedEmailRequestedPayload = {
  email: string;
  fullName: string;
  reason: string;
};

export type MemberSuspendedEmailRequestedPayload = {
  email: string;
  fullName: string;
  reason: string;
};

export type PriceAlertTriggeredPayload = {
  email: string;
  fullName: string;
  ticker: string;
  companyName: string;
  targetPrice: number;
  currentPrice: number;
  direction: 'above' | 'below';
};

export type StockPriceUpdatedPayload = {
  stockId: string;
  ticker: string;
  currentPrice: number;
  updatedAt: string;
};

export type NotificationEventPayloadMap = {
  [NotificationEventType.OtpEmailRequested]: OtpEmailRequestedPayload;
  [NotificationEventType.PasswordResetOtpEmailRequested]: PasswordResetOtpEmailRequestedPayload;

  [NotificationEventType.NewAdminEmailRequested]: NewAdminEmailRequestedPayload;

  [NotificationEventType.WalletCreditEmailRequested]: WalletCreditEmailRequestedPayload;

  [NotificationEventType.WithdrawalApprovedEmailRequested]: WithdrawalApprovedEmailRequestedPayload;
  [NotificationEventType.WithdrawalRejectedEmailRequested]: WithdrawalRejectedEmailRequestedPayload;

  [NotificationEventType.TradeConfirmationEmailRequested]: TradeConfirmationEmailRequestedPayload;

  [NotificationEventType.IdentityApprovedEmailRequested]: IdentityApprovedEmailRequestedPayload;
  [NotificationEventType.IdentityRejectedEmailRequested]: IdentityRejectedEmailRequestedPayload;

  [NotificationEventType.MemberSuspendedEmailRequested]: MemberSuspendedEmailRequestedPayload;

  [NotificationEventType.PriceAlertTriggered]: PriceAlertTriggeredPayload;
  [NotificationEventType.StockPriceUpdated]: StockPriceUpdatedPayload;
};

export type NotificationEvent<
  T extends NotificationEventType = NotificationEventType,
> = {
  type: T;
  payload: NotificationEventPayloadMap[T];
};
