export type PasswordSetupTokenPayload = {
    sub: string;
    email: string;
    type: 'password-setup';
};