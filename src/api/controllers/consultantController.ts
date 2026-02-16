import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import {
  getConsultant,
  getAllConsultants,
  postConsultant,
  putConsultant,
  deleteConsultant
} from '../models/consultantModel';
import { PostConsultant, PutConsultant } from '../../interfaces/Consultant';

import MessageResponse from '../../interfaces/MessageResponse';
import {
  findConsultantIdByName,
  throwIfValidationErrors,
  toCamel
} from '../../utils/utilities';
import CustomError from '../../classes/CustomError';
// import { User } from '../../interfaces/User';

const consultantListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllConsultants();
    const consultants = rows.map((row) => toCamel(row));
    res.json(consultants);
  } catch (err) {
    next(err);
  }
};

const consultantGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const consultant = toCamel(await getConsultant(req.params.id as number));
    res.json(consultant);
  } catch (err) {
    next(err);
  }
};

const consultantPost = async (
  req: Request<{}, {}, PostConsultant>,
  res: Response,
  next: NextFunction
) => {
  try {
    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const checkExisting = await findConsultantIdByName(req.body.name);
    if (checkExisting) {
      throw new CustomError('Consultant already exists', checkExisting);
    }
    const consultant = await postConsultant(req.body);
    if (consultant) {
      const response: MessageResponse = {
        message: 'Consultant created successfully',
        id: consultant
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const consultantPut = async (
  req: Request<{ id: number }, {}, PutConsultant>,
  res: Response,
  next: NextFunction
) => {
  try {
    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const result = await putConsultant(req.body, req.params.id as number);
    if (result) {
      const response: MessageResponse = {
        message: 'Consultant updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const consultantDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const result = await deleteConsultant(req.params.id as number);
    if (result) {
      const response: MessageResponse = {
        message: 'Consultant deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  consultantListGet,
  consultantGet,
  consultantPost,
  consultantPut,
  consultantDelete
};
