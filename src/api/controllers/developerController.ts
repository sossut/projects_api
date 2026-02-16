import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import {
  getDeveloper,
  getAllDevelopers,
  postDeveloper,
  putDeveloper,
  deleteDeveloper
} from '../models/developerModel';
import { PostDeveloper, PutDeveloper } from '../../interfaces/Developer';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  findDeveloperIdByName,
  throwIfValidationErrors,
  toCamel
} from '../../utils/utilities';
import { User } from '../../interfaces/User';
const developerListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllDevelopers();
    const developers = rows.map((row) => toCamel(row));
    res.json(developers);
  } catch (err) {
    next(err);
  }
};
const developerGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const developer = toCamel(await getDeveloper(req.params.id as number));
    res.json(developer);
  } catch (err) {
    next(err);
  }
};

const developerPost = async (
  req: Request<{}, {}, PostDeveloper>,
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
    const checkExisting = await findDeveloperIdByName(req.body.name);
    if (checkExisting) {
      throw new CustomError('Developer already exists', checkExisting);
    }
    const developer = await postDeveloper(req.body);
    if (developer) {
      const response: MessageResponse = {
        message: 'Developer created successfully',
        id: developer
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const developerPut = async (
  req: Request<{ id: number }, {}, PutDeveloper>,
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
    const success = await putDeveloper(req.body, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Developer updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const developerDelete = async (
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
    const success = await deleteDeveloper(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Developer deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
export {
  developerListGet,
  developerGet,
  developerPost,
  developerPut,
  developerDelete
};
