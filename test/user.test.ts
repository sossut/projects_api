import request from 'supertest';
import app from '../src/app';

let authToken: string;

describe('User Routes', () => {
  beforeAll((done) => {
    // Get auth token for protected routes
    request(app)
      .post('/api/v1/auth/login')
      .set('Accept', 'application/json')
      .send({
        email: 'admin@example.com',
        password: '1234'
      })
      .end((err, res) => {
        if (err) return done(err);
        authToken = res.body.token;
        done();
      });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users with valid token', (done) => {
      request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('email');
            expect(res.body[0]).toHaveProperty('username');
          }
          done();
        });
    });

    it('should fail without token', (done) => {
      request(app)
        .get('/api/v1/users')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should fail with invalid token', (done) => {
      request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid_token')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by id with valid token', (done) => {
      request(app)
        .get('/api/v1/users/1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
          done();
        });
    });

    it('should fail with non-existent user id', (done) => {
      request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should fail with invalid id format', (done) => {
      request(app)
        .get('/api/v1/users/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should fail without token', (done) => {
      request(app)
        .get('/api/v1/users/1')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user with valid data', (done) => {
      const uniqueEmail = `user${Date.now()}@example.com`;
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `testuser${Date.now()}`,
          email: uniqueEmail,
          password: 'TestPassword123'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('id');
          done();
        });
    });

    it('should fail without username', (done) => {
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassword123'
        })
        .expect(400, done);
    });

    it('should fail without email', (done) => {
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `testuser${Date.now()}`,
          password: 'TestPassword123'
        })
        .expect(400, done);
    });

    it('should fail without password', (done) => {
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `testuser${Date.now()}`,
          email: `test${Date.now()}@example.com`
        })
        .expect(400, done);
    });

    it('should fail with duplicate email', (done) => {
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `testuser${Date.now()}`,
          email: 'admin@example.com',
          password: 'TestPassword123'
        })
        .expect(400, done);
    });

    it('should fail with invalid email format', (done) => {
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `testuser${Date.now()}`,
          email: 'invalidemail',
          password: 'TestPassword123'
        })
        .expect(400, done);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user with valid token', (done) => {
      request(app)
        .put('/api/v1/users/1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          username: `updated${Date.now()}`
        })
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('should fail without token', (done) => {
      request(app)
        .put('/api/v1/users/1')
        .set('Accept', 'application/json')
        .send({
          username: 'updated'
        })
        .expect(401, done);
    });

    it('should fail with non-existent user id', (done) => {
      request(app)
        .put('/api/v1/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          username: 'updated'
        })
        .expect(404, done);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user with valid token and admin role', (done) => {
      // First create a user to delete
      const uniqueEmail = `deleteme${Date.now()}@example.com`;
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `deleteme${Date.now()}`,
          email: uniqueEmail,
          password: 'TestPassword123'
        })
        .end((err, res) => {
          if (err) return done(err);
          const userId = res.body.id;

          // Now delete the user
          request(app)
            .delete(`/api/v1/users/${userId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Accept', 'application/json')
            .expect(200, done);
        });
    });

    it('should fail without token', (done) => {
      request(app)
        .delete('/api/v1/users/1')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should fail with non-existent user id', (done) => {
      request(app)
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
