import express from 'express';
import passport from 'passport';
import {
  architectListGet,
  architectGet,
  architectPost,
  architectPut,
  architectDelete,
  architecstGetByCountryId
} from '../controllers/architectController';

const router = express.Router();

router.get('/', architectListGet);

router.get('/country/:countryId', architecstGetByCountryId);

router.get('/:id', architectGet);

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  architectPost
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),

  architectPut
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  architectDelete
);

export default router;
