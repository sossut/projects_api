import express from 'express';
import { login } from '../controllers/authController';
import { body } from 'express-validator';

const router = express.Router();

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
  login
);

export default router;
