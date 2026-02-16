import { Request, Response, NextFunction } from 'express';

import { getAllCountries } from '../models/countryModel';

const countryListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllCountries();

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export { countryListGet };
