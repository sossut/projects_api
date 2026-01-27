import { validationResult } from 'express-validator';
import {
  postMetroArea,
  putMetroArea,
  deleteMetroArea,
  getAllMetroAreas,
  getMetroArea
} from '../models/metroAreaModel';
import { Request, Response, NextFunction } from 'express';
import { PostMetroArea } from '../../interfaces/MetroArea';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import { checkCountryExistsByName, postCountry } from '../models/countryModel';

const metroAreaListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllMetroAreas();
    const metroAreas = rows.map((row) => toCamel(row));
    res.json(metroAreas);
  } catch (err) {
    next(err);
  }
};
const metroAreaGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const metroArea = toCamel(await getMetroArea(req.params.id as number));
    res.json(metroArea);
  } catch (err) {
    next(err);
  }
};

const metroAreaPost = async (
  req: Request<{}, {}, PostMetroArea>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array());
    throwIfValidationErrors(errors);
    if (!req.body.continent || !req.body.country) {
      throw new CustomError(
        'Continent and Country information are required',
        400
      );
    }
    const continentExists = await checkContinentExistsByName(
      req.body.continent.name
    );
    let continentID = continentExists;
    if (!req.body.continent.code) {
      req.body.continent.code = null;
    }
    if (continentExists === 0) {
      continentID = await postContinent(req.body.continent);
    }
    if (!continentID) {
      throw new CustomError('Failed to create continent', 500);
    }

    const countryExists = await checkCountryExistsByName(req.body.country.name);
    let countryID = countryExists;

    console.log(req.body.country);
    if (countryExists === 0) {
      countryID = await postCountry({
        name: req.body.country.name,
        code: req.body.country.code ? req.body.country.code : null,
        continentId: continentID
      });
    }

    if (!countryID) {
      throw new CustomError('Failed to create country', 500);
    }
    req.body.countryId = countryID;

    req.body.lastSearchedAt = new Date(Date.now());
    const metroAreaId = await postMetroArea(req.body);
    if (!metroAreaId) {
      throw new CustomError('Failed to create metro area', 500);
    }

    const response: MessageResponse = {
      message: 'Metro area created successfully',
      id: metroAreaId
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const metroAreaPut = async (
  req: Request<{ id: number }, {}, PostMetroArea>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    req.body.lastSearchedAt = new Date(Date.now());
    const success = await putMetroArea(req.body, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Metro area updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
const metroAreaDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const success = await deleteMetroArea(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Metro area deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  metroAreaListGet,
  metroAreaGet,
  metroAreaPost,
  metroAreaPut,
  metroAreaDelete
};
