import { Request, Response, NextFunction } from 'express';

import { getAllBuildingUses } from '../models/buildingUseModel';

const buildingUseListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllBuildingUses();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export { buildingUseListGet };
