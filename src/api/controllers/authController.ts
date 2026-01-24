import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import passport from '../../passport';
import CustomError from '../../classes/CustomError';
import { User } from '../../interfaces/User';
import { throwIfValidationErrors } from '../../utils/utilities';

const login = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  throwIfValidationErrors(errors);

  passport.authenticate(
    'local',
    { session: false },
    (err: Error, user: Partial<User>) => {
      if (err || !user) {
        next(new CustomError('Invalid username/password', 401));
        return;
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          next(new CustomError('Login error', 400));
          return;
        }

        delete user.password; // this is the reason for partial
        const token = jwt.sign(user, process.env.JWT_SECRET as string);
        return res.json({ user, token });
      });
    }
  )(req, res, next);
};

export { login };
