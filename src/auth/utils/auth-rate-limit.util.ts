export enum AuthRateLimitAction {
    Login = 'login',
    ForgotPassword = 'forgot-password',
    Register = 'register',
    VerifyOtp = 'verify-otp',
    ResendOtp = 'resend-otp',
}

export function normalizeIp(ipAddress: string): string {
    return ipAddress.replace(/:/g, '_');
}

export function buildAuthComboRateLimitKey(params: {
    action: AuthRateLimitAction;
    target: string;
    ipAddress: string;
}): string {
    const normalizedIp = normalizeIp(params.ipAddress);

    return `rate-limit:${params.action}:combo:${normalizedIp}:${params.target}`;
}

export function buildAuthIpRateLimitKey(params: {
    action: AuthRateLimitAction;
    ipAddress: string;
}): string {
    const normalizedIp = normalizeIp(params.ipAddress);

    return `rate-limit:${params.action}:ip:${normalizedIp}`;
}