import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import {
  getArchitect,
  getAllArchitects,
  postArchitect,
  putArchitect,
  deleteArchitect
} from '../models/architectModel';

import { PostArchitect, PutArchitect } from '../../interfaces/Architect';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';

const architectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllArchitects();
    const architects = rows.map((row) => toCamel(row));
    res.json(architects);
  } catch (err) {
    next(err);
  }
};
const architectGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const architect = toCamel(await getArchitect(req.params.id as number));
    res.json(architect);
  } catch (err) {
    next(err);
  }
};
const architectPost = async (
  req: Request<{}, {}, PostArchitect>,
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
    const architect = await postArchitect(req.body);
    if (architect) {
      const response: MessageResponse = {
        message: 'Architect created successfully',
        id: architect
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
const architectPut = async (
  req: Request<{ id: number }, {}, PutArchitect>,
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
    const success = await putArchitect(req.body, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Architect updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const architectDelete = async (
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
    const success = await deleteArchitect(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Architect deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  architectListGet,
  architectGet,
  architectPost,
  architectPut,
  architectDelete
};
