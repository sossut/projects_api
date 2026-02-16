import express from 'express';
import { buildingUseListGet } from '../controllers/buildingUseController';

const router = express.Router();

// Get all building uses
router.get('/', buildingUseListGet);

export default router;
