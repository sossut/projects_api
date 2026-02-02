import express from 'express';
import { companiesPost } from '../controllers/companiesContoller';
import { body } from 'express-validator';
const router = express.Router();

router.post(
  '/',
  body('results').isObject().withMessage('Results must be an object'),
  body('results.contractors')
    .optional()
    .isArray()
    .withMessage('Contractors must be an array'),
  body('results.developers')
    .optional()
    .isArray()
    .withMessage('Developers must be an array'),
  body('results.architects')
    .optional()
    .isArray()
    .withMessage('Architects must be an array'),
  companiesPost
);
export default router;
