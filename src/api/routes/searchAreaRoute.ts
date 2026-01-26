import express from 'express';
import {
  metroAreaListGet,
  metroAreaGet,
  metroAreaPost,
  metroAreaPut,
  metroAreaDelete
} from '../controllers/searchAreaController';
import { body, param } from 'express-validator';
import passport from 'passport';

const router = express.Router();

router
  .route('/')
  .get(passport.authenticate('jwt', { session: false }), metroAreaListGet)
  .post(
    passport.authenticate('jwt', { session: false }),
    body('name').isString().notEmpty().escape(),
    body('continent').custom((value) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('continent must be an object');
      }
      if (!value.name || typeof value.name !== 'string') {
        throw new Error('continent.name is required and must be a string');
      }
      return true;
    }),
    body('country').custom((value) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('country must be an object');
      }
      if (!value.name || typeof value.name !== 'string') {
        throw new Error('country.name is required and must be a string');
      }
      return true;
    }),
    metroAreaPost
  );
router
  .route('/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    metroAreaGet
  )
  .put(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    body('name').optional().isString().notEmpty().escape(),
    body('countryId').optional().isInt({ gt: 0 }).toInt().notEmpty().escape(),
    metroAreaPut
  )
  .delete(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    metroAreaDelete
  );
export default router;
