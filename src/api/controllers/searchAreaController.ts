import { validationResult } from 'express-validator';
import {
  postSearchArea,
  putSearchArea,
  deleteSearchArea,
  getAllSearchAreas,
  getSearchArea
} from '../models/searchAreaModel';
import { Request, Response, NextFunction } from 'express';
import { PostSearchArea } from '../../interfaces/SearchArea';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import { checkCountryExistsByName, postCountry } from '../models/countryModel';

const searchAreaListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllSearchAreas();
    const searchAreas = rows.map((row) => toCamel(row));
    res.json(searchAreas);
  } catch (err) {
    next(err);
  }
};
const searchAreaGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const searchArea = toCamel(await getSearchArea(req.params.id as number));
    res.json(searchArea);
  } catch (err) {
    next(err);
  }
};

const searchAreaPost = async (
  req: Request<{}, {}, PostSearchArea>,
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
    const searchAreaId = await postSearchArea(req.body);
    if (!searchAreaId) {
      throw new CustomError('Failed to create search area', 500);
    }

    const response: MessageResponse = {
      message: 'Search area created successfully',
      id: searchAreaId
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const searchAreaPut = async (
  req: Request<{ id: number }, {}, PostSearchArea>,
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
    const success = await putSearchArea(req.body, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Search area updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
const searchAreaDelete = async (
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
    const success = await deleteSearchArea(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Search area deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  searchAreaListGet,
  searchAreaGet,
  searchAreaPost,
  searchAreaPut,
  searchAreaDelete
};
