import passport from 'passport';
import { Strategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { getUserLogin } from '../api/models/userModel';

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      const user = await getUserLogin(username);

      if (!user) {
        return done(null, false);
      }
      if (!bcrypt.compareSync(password, user.password!)) {
        return done(null, false);
      }
      return done(null, user, { message: 'Logged In Successfully' }); // use spread syntax to create shallow copy to get rid of binary row type
    } catch (err) {
      return done(err);
    }
  })
);

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    },
    (jwtPayload, done) => {
      done(null, jwtPayload);
    }
  )
);

export default passport;
