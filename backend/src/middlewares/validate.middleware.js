import { sendError } from '../utils/response.js';

/**
 * Middleware: Validate request body against a Joi schema
 * @param {import('joi').ObjectSchema} schema 
 */
export function validate(schema) {
  return (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message).join(', ');
      return sendError(res, `Validation failed: ${details}`, 400, {
        errors: error.details,
      });
    }

    req.body = value;
    next();
  };
}

export default validate;
