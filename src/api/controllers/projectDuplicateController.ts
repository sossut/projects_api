import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import {
  getAllProjectDuplicates,
  getProjectDuplicate,
  postProjectDuplicate,
  putProjectDuplicate,
  deleteProjectDuplicate
} from '../models/projectDuplicateModel';
import { ProjectDuplicate } from '../../interfaces/ProjectDuplicate';

import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors } from '../../utils/utilities';

const projectDuplicateListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectDuplicates: ProjectDuplicate[] =
      await getAllProjectDuplicates();

    res.json(projectDuplicates);
  } catch (err) {
    next(err);
  }
};

const projectDuplicateGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const projectDuplicate: ProjectDuplicate = await getProjectDuplicate(
      req.params.id as number
    );
    res.json(projectDuplicate);
  } catch (err) {
    next(err);
  }
};

const projectDuplicatePost = async (
  req: Request<{}, {}, ProjectDuplicate>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const projectDuplicateId = await postProjectDuplicate(req.body);
    if (projectDuplicateId) {
      const response: MessageResponse = {
        message: 'ProjectDuplicate created successfully',
        id: projectDuplicateId
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const projectDuplicatePut = async (
  req: Request<{ id: number }, {}, ProjectDuplicate>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const projectDuplicateId = await putProjectDuplicate(
      req.body,
      req.params.id as number
    );
    if (projectDuplicateId) {
      const response: MessageResponse = {
        message: 'ProjectDuplicate updated successfully',
        id: req.params.id as number
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const projectDuplicateDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const success = await deleteProjectDuplicate(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'ProjectDuplicate deleted successfully',
        id: req.params.id as number
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  projectDuplicateListGet,
  projectDuplicateGet,
  projectDuplicatePost,
  projectDuplicatePut,
  projectDuplicateDelete
};
