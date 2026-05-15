export enum AuditActorType {
    Admin = 'admin',
    Member = 'member',
    System = 'system',
}

export enum AuditTargetType {
    Member = 'member',
    Admin = 'admin',
    Stock = 'stock',
    Wallet = 'wallet',
    Withdrawal = 'withdrawal',
    Transaction = 'transaction',
    Order = 'order',
    Position = 'position',
    PriceAlert = 'price_alert',
    System = 'system',
}

export enum AuditLogAction {
    AdminCreated = 'admin.created',

    MemberIdentityApproved = 'member.identity.approved',
    MemberIdentityRejected = 'member.identity.rejected',
    MemberSuspended = 'member.suspended',
    MemberReinstated = 'member.reinstated',

    WalletAdjusted = 'wallet.adjusted',
    WithdrawalApproved = 'withdrawal.approved',
    WithdrawalRejected = 'withdrawal.rejected',

    StockCreated = 'stock.created',
    StockUpdated = 'stock.updated',
    StockListed = 'stock.listed',
    StockDelisted = 'stock.delisted',

    PriceAlertCreated = 'price_alert.created',
    PriceAlertTriggered = 'price_alert.triggered',
    PriceAlertDeleted = 'price_alert.deleted',
}