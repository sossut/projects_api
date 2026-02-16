import { getAllBuildingTypes } from '../models/buildingTypeModel';

import { Request, Response, NextFunction } from 'express';

const buildingTypeListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllBuildingTypes();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export { buildingTypeListGet };
