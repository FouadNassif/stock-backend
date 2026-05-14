export enum NotificationEventType {
    PriceAlertTriggered = 'price_alert.triggered',
}

export type PriceAlertTriggeredPayload = {
    email: string;
    fullName: string;
    ticker: string;
    companyName: string;
    targetPrice: number;
    currentPrice: number;
    direction: 'above' | 'below';
};

export type NotificationEventPayloadMap = {
    [NotificationEventType.PriceAlertTriggered]: PriceAlertTriggeredPayload;
};

export type NotificationEvent<
    T extends NotificationEventType = NotificationEventType,
> = {
    type: T;
    payload: NotificationEventPayloadMap[T];
};