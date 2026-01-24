import request from 'supertest';
import app from '../src/app';

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', (done) => {
      request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .send({
          email: 'admin@example.com',
          password: '1234'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user).toHaveProperty('username');
          expect(res.body.user).not.toHaveProperty('password');
          done();
        });
    });

    it('should fail with invalid email', (done) => {
      request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(401, done);
    });

    it('should fail with invalid password', (done) => {
      request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/)
        .expect(401, done);
    });

    it('should fail without email', (done) => {
      request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .send({
          password: '1234'
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('should fail without password', (done) => {
      request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .send({
          email: 'admin@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
});
