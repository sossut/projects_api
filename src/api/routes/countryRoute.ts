import express from 'express';

import { countryListGet } from '../controllers/countryController';

const router = express.Router();

router.get('/', countryListGet);

export default router;
