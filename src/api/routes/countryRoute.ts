import express from 'express';

import { countryListGet } from '../controllers/coutnryController';

const router = express.Router();

router.get('/', countryListGet);

export default router;
