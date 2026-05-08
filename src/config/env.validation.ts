import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().default(3000),

    MONGO_URI: Joi.string().required(),

    JWT_SECRET: Joi.string().min(20).required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),

    OTP_EXPIRES_MINUTES: Joi.number().default(10),

    MAIL_HOST: Joi.string().required(),
    MAIL_PORT: Joi.number().required(),
    MAIL_SECURE: Joi.boolean().required(),
    MAIL_USER: Joi.string().email().required(),
    MAIL_PASS: Joi.string().required(),
    MAIL_FROM: Joi.string().email().required(),

    ADMIN_EMAIL: Joi.string().email().required(),
    ADMIN_PASSWORD: Joi.string().min(8).required(),
    ADMIN_FULL_NAME: Joi.string().required(),
});