import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

export const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email_id: Joi.string().email().required(),
    phone_number: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email_id: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  product: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).required(),
    category: Joi.string().required(),
    price: Joi.number().min(0).required(),
    product_type: Joi.string().valid('sale', 'rental').required(),
    // Sale product fields
    sale_price: Joi.when('product_type', {
      is: 'sale',
      then: Joi.number().min(0).required(),
      otherwise: Joi.forbidden()
    }),
    // Rental product fields
    rent_price_per_day: Joi.when('product_type', {
      is: 'rental',
      then: Joi.number().min(0).required(),
      otherwise: Joi.forbidden()
    }),
    security_deposit: Joi.when('product_type', {
      is: 'rental',
      then: Joi.number().min(0).required(),
      otherwise: Joi.forbidden()
    }),
    rental_duration_limit: Joi.when('product_type', {
      is: 'rental',
      then: Joi.number().min(1).required(),
      otherwise: Joi.forbidden()
    })
  }),

  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).optional()
  }),

  report: Joi.object({
    accused_id: Joi.string().optional(),
    product_id: Joi.string().optional(),
    review_id: Joi.string().optional(),
    complaint: Joi.string().min(10).max(500).required()
  })
};