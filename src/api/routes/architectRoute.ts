import express from 'express';

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

router.post('/', architectPost);

router.put('/:id', architectPut);

router.delete('/:id', architectDelete);

export default router;
