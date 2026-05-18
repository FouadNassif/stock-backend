export type PasswordResetTokenPayload = {
  sub: string;
  email: string;
  type: 'password-reset';
};
