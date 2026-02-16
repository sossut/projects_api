import express from 'express';
import { buildingTypeListGet } from '../controllers/buildingTypeController';

const router = express.Router();

router.route('/').get(
  // passport.authenticate('jwt', { session: false }),
  buildingTypeListGet
);

export default router;
