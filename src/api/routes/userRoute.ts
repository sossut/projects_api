import express from 'express';
import {
  userListGet,
  userGet,
  userPost,
  userPut,
  userDelete,
  checkToken
} from '../controllers/userController';
import { body, param } from 'express-validator';
import passport from 'passport';

const router = express.Router();

router
  .route('/')
  .get(passport.authenticate('jwt', { session: false }), userListGet)
  .post(
    body('username').isString().notEmpty().escape(),
    body('email').isEmail().normalizeEmail().escape(),
    body('password').isString().isLength({ min: 4 }).escape(),
    userPost
  );

router
  .route('/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    userGet
  )
  .put(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    body('username').optional().isString().notEmpty().escape(),
    body('email').optional().isEmail().normalizeEmail().escape(),
    body('password').optional().isString().isLength({ min: 4 }).escape(),
    userPut
  )
  .delete(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    userDelete
  );

router
  .route('/check-token')
  .get(passport.authenticate('jwt', { session: false }), checkToken);

export default router;
