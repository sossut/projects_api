import passport from 'passport';
import { Strategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { getUserLogin } from '../api/models/userModel';

passport.use(
  new Strategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      console.log('🔍 Auth attempt - Email:', email);
      const user = await getUserLogin(email);

      console.log(
        '✅ User found:',
        user?.email,
        'Has password hash:',
        !!user?.password
      );

      if (!user) {
        console.log('❌ User not found');
        return done(null, false);
      }

      const passwordMatch = bcrypt.compareSync(password, user.password!);
      console.log('🔑 Password comparison result:', passwordMatch);
      console.log(
        '🔑 Password hash from DB:',
        user.password?.substring(0, 20) + '...'
      );

      if (!passwordMatch) {
        console.log('❌ Password does not match');
        return done(null, false);
      }
      console.log('✅ Login successful');
      return done(null, user, { message: 'Logged In Successfully' }); // use spread syntax to create shallow copy to get rid of binary row type
    } catch (err) {
      console.log('❌ Auth error:', err);
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
