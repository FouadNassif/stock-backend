export enum AuthRateLimitAction {
    Login = 'login',
    ForgotPassword = 'forgot-password',
}

export function normalizeIp(ipAddress: string): string {
    return ipAddress.replace(/:/g, '_');
}

export function buildAuthComboRateLimitKey(params: {
    action: AuthRateLimitAction;
    email: string;
    ipAddress: string;
}): string {
    const normalizedIp = normalizeIp(params.ipAddress);

    return `rate-limit:${params.action}:combo:${normalizedIp}:${params.email}`;
}

export function buildAuthIpRateLimitKey(params: {
    action: AuthRateLimitAction;
    ipAddress: string;
}): string {
    const normalizedIp = normalizeIp(params.ipAddress);

    return `rate-limit:${params.action}:ip:${normalizedIp}`;
}