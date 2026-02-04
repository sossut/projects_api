import express from 'express';
import {
  cityListGet,
  cityGet,
  cityPost,
  cityPut,
  cityDelete
} from '../controllers/cityController';
import { body, param } from 'express-validator';
import passport from 'passport';

const router = express.Router();

router
  .route('/')
  .get(
    // passport.authenticate('jwt', { session: false }),
    cityListGet
  )
  .post(
    passport.authenticate('jwt', { session: false }),
    body('name').isString().notEmpty().escape(),
    body('countryId').isInt({ gt: 0 }).toInt().notEmpty().escape(),
    cityPost
  );
router
  .route('/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    cityGet
  )
  .put(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    body('name').optional().isString().notEmpty().escape(),
    body('countryId').optional().isInt({ gt: 0 }).toInt().notEmpty().escape(),
    cityPut
  )
  .delete(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    cityDelete
  );
export default router;
