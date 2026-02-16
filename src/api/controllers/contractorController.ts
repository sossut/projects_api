import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  getContractor,
  getAllContractors,
  postContractor,
  putContractor,
  deleteContractor
} from '../models/contractorModel';
import { PostContractor, PutContractor } from '../../interfaces/Contractor';
import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  findContractorIdByName,
  throwIfValidationErrors,
  toCamel
} from '../../utils/utilities';
import { User } from '../../interfaces/User';
const contractorListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllContractors();
    const contractors = rows.map((row) => toCamel(row));
    res.json(contractors);
  } catch (err) {
    next(err);
  }
};

const contractorGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const contractor = toCamel(await getContractor(req.params.id as number));
    res.json(contractor);
  } catch (err) {
    next(err);
  }
};

const contractorPost = async (
  req: Request<{}, {}, PostContractor>,
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
    const checkExisting = await findContractorIdByName(req.body.name);
    if (checkExisting) {
      throw new CustomError('Contractor already exists', checkExisting);
    }
    const contractor = await postContractor(req.body);
    if (contractor) {
      const response: MessageResponse = {
        message: 'Contractor created successfully',
        id: contractor
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const contractorPut = async (
  req: Request<{ id: number }, {}, PutContractor>,
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
    const success = await putContractor(req.body, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Contractor updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const contractorDelete = async (
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
    const success = await deleteContractor(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Contractor deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  contractorListGet,
  contractorGet,
  contractorPost,
  contractorPut,
  contractorDelete
};
