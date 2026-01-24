import { validationResult } from 'express-validator';
import {
  postUser,
  putUser,
  deleteUser,
  getAllUsers,
  getUser
} from '../models/userModel';
import { Request, Response, NextFunction } from 'express';

import bcrypt from 'bcryptjs';

import { User, PostUser } from '../../interfaces/User';
import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors } from '../../utils/utilities';
const salt = bcrypt.genSaltSync(12);

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users: User[] = await getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const userGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const user: User = await getUser(req.params.id as number);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const userPost = async (
  req: Request<{}, {}, PostUser>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);

    const { password } = req.body;
    req.body.password = bcrypt.hashSync(password, salt);

    const user = await postUser(req.body);
    if (user) {
      const response: MessageResponse = {
        message: 'User created successfully',
        id: user
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const userPut = async (
  req: Request<{ id: number }, {}, PostUser>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const u = req.user as User;
    if (u.id !== req.params.id && u.role !== 'admin') {
      throw new CustomError('Unauthorized', 403);
    }
    const result = await putUser(req.body, req.params.id as number);
    if (result) {
      const response: MessageResponse = {
        message: 'User updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const userDelete = async (
  req: Request<{ id: number }, {}, { user: User }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const u = req.user as User;
    if (u.id !== req.params.id && u.role !== 'admin') {
      throw new CustomError('Unauthorized', 403);
    }
    const result = await deleteUser(req.params.id as number);
    if (result) {
      const response: MessageResponse = {
        message: 'User deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('token not valid', 403));
  } else {
    res.json(req.user);
  }
};

export { userListGet, userGet, userPost, userPut, userDelete, checkToken };
