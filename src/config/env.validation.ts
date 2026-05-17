import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  APP_URL: Joi.string().required(),

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

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.string().required(),

  RATE_LOGIN_STAGE1_LIMIT: Joi.number().integer().min(1).default(5),
  RATE_LOGIN_STAGE1_TIME: Joi.number().integer().min(1).default(900),
  RATE_LOGIN_STAGE2_LIMIT: Joi.number().integer().min(1).default(20),
  RATE_LOGIN_STAGE2_TIME: Joi.number().integer().min(1).default(900),

  RATE_FORGET_STAGE1_LIMIT: Joi.number().integer().min(1).default(3),
  RATE_FORGET_STAGE1_TIME: Joi.number().integer().min(1).default(900),
  RATE_FORGET_STAGE2_LIMIT: Joi.number().integer().min(1).default(10),
  RATE_FORGET_STAGE2_TIME: Joi.number().integer().min(1).default(900),

  RATE_REGISTER_STAGE1_LIMIT: Joi.number().integer().min(1).default(3),
  RATE_REGISTER_STAGE1_TIME: Joi.number().integer().min(1).default(900),
  RATE_REGISTER_STAGE2_LIMIT: Joi.number().integer().min(1).default(10),
  RATE_REGISTER_STAGE2_TIME: Joi.number().integer().min(1).default(900),

  RATE_V_OTP_STAGE1_LIMIT: Joi.number().integer().min(1).default(5),
  RATE_V_OTP_STAGE1_TIME: Joi.number().integer().min(1).default(900),
  RATE_V_OTP_STAGE2_LIMIT: Joi.number().integer().min(1).default(20),
  RATE_V_OTP_STAGE2_TIME: Joi.number().integer().min(1).default(900),

  RATE_R_OTP_STAGE1_LIMIT: Joi.number().integer().min(1).default(3),
  RATE_R_OTP_STAGE1_TIME: Joi.number().integer().min(1).default(900),
  RATE_R_OTP_STAGE2_LIMIT: Joi.number().integer().min(1).default(10),
  RATE_R_OTP_STAGE2_TIME: Joi.number().integer().min(1).default(900),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_CURRENCY: Joi.string().default('usd'),
  STRIPE_SUCCESS_URL: Joi.string().uri().required(),
  STRIPE_CANCEL_URL: Joi.string().uri().required(),

  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_NOTIFICATION_QUEUE: Joi.string().default('notification_events'),
  RABBITMQ_REALTIME_QUEUE: Joi.string().default('realtime_events'),

  ANALYTICS_SERVICE_URL: Joi.string().uri().required(),

  CACHE_STOCKS_TTL_SECONDS: Joi.number().default(300),
  CACHE_PORTFOLIO_TTL_SECONDS: Joi.number().default(120),
});
