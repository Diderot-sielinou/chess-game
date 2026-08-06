import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // DATABASE_URL: Joi.string().required(),
  //Auth
  // JWT_SECRET: Joi.string().min(16).required(),
  // JWT_EXPIRES_IN: Joi.string().default('1d'),
});
