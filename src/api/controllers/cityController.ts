import { validationResult } from 'express-validator';

import {
  postCity,
  putCity,
  deleteCity,
  getAllCities,
  getCity
} from '../models/cityModel';
import { Request, Response, NextFunction } from 'express';
import { PostCity } from '../../interfaces/City';
import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';

const cityListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await getAllCities();
    const cities = rows.map((row) => toCamel(row));
    res.json(cities);
  } catch (err) {
    next(err);
  }
};

const cityGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const city = toCamel(await getCity(req.params.id as number));
    res.json(city);
  } catch (err) {
    next(err);
  }
};

const cityPost = async (
  req: Request<{}, {}, PostCity>,
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
    const city = await postCity(req.body);
    if (city) {
      const response: MessageResponse = {
        message: 'City created successfully',
        id: city
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const cityPut = async (
  req: Request<{ id: number }, {}, Partial<PostCity>>,
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
    const city = await putCity(req.body, req.params.id as number);
    if (city) {
      const response: MessageResponse = {
        message: 'City updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const cityDelete = async (
  req: Request<{ id: number }, {}, {}>,
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
    const city = await deleteCity(req.params.id as number);
    if (city) {
      const response: MessageResponse = {
        message: 'City deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export { cityListGet, cityGet, cityPost, cityPut, cityDelete };
