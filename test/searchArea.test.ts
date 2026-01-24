import request from 'supertest';
import app from '../src/app';

let authToken: string;
let searchAreaId: number;

describe('Search Area Routes', () => {
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
        if (res.status !== 200 || !res.body.token) {
          return done(new Error(`Login failed with status ${res.status}`));
        }
        authToken = res.body.token;
        
        // create a search area to use across tests
        request(app)
          .post('/api/v1/search-areas')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Accept', 'application/json')
          .send({
            name: `TestArea${Date.now()}`,
            continent: {
              name: 'Asia',
              code: 'AS'
            },
            country: {
              name: 'Vietnam'
            }
          })
          .end((createErr, createRes) => {
            if (createErr) return done(createErr);
            if (createRes.status !== 200 || !createRes.body.id) {
              return done(new Error(`Setup create search area failed with status ${createRes.status}`));
            }
            searchAreaId = createRes.body.id;
            done();
          });
      });
  });
  
  describe('GET /api/v1/search-areas', () => {
    it('should get all search areas with valid token', (done) => {
      request(app)
        .get('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('countryId');
          }
          done();
        });
    });

    it('should fail without token', (done) => {
      request(app)
        .get('/api/v1/search-areas')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should fail with invalid token', (done) => {
      request(app)
        .get('/api/v1/search-areas')
        .set('Authorization', 'Bearer invalid_token')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('GET /api/v1/search-areas/:id', () => {
    it('should get search area by id with valid token', (done) => {
      request(app)
        .get(`/api/v1/search-areas/${searchAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('countryId');
          done();
        });
    });

    it('should fail with non-existent search area id', (done) => {
      request(app)
        .get('/api/v1/search-areas/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should fail with invalid id format', (done) => {
      request(app)
        .get('/api/v1/search-areas/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should fail without token', (done) => {
      request(app)
        .get(`/api/v1/search-areas/${searchAreaId}`)
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('POST /api/v1/search-areas', () => {
    it('should create a new search area with valid data and admin token', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          continent: {
            name: 'Asia',
            code: 'AS'
          },
          country: {
            name: 'Vietnam'
          }
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('id');
          searchAreaId = res.body.id;
          done();
        });
    });

    it('should fail without token', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          continent: {
            name: 'Asia',
            code: 'AS'
          },
          country: {
            name: 'Vietnam'
          }
        })
        .expect(401, done);
    });

    it('should fail without name', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          continent: {
            name: 'Asia',
            code: 'AS'
          },
          country: {
            name: 'Vietnam'
          }
        })
        .expect(400, done);
    });

    it('should fail without continent', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          country: {
            name: 'Vietnam'
          }
        })
        .expect(400, done);
    });

    it('should fail without country', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          continent: {
            name: 'Asia',
            code: 'AS'
          }
        })
        .expect(400, done);
    });

    it('should fail without continent.name', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          continent: {
            code: 'AS'
          },
          country: {
            name: 'Vietnam'
          }
        })
        .expect(400, done);
    });

    it('should fail without country.name', (done) => {
      request(app)
        .post('/api/v1/search-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `TestArea${Date.now()}`,
          continent: {
            name: 'Asia',
            code: 'AS'
          },
          country: {}
        })
        .expect(400, done);
    });

    it('should fail with non-admin user', (done) => {
      // Create a non-admin user and get their token
      const uniqueEmail = `nonAdmin${Date.now()}@example.com`;
      request(app)
        .post('/api/v1/users')
        .set('Accept', 'application/json')
        .send({
          username: `nonAdmin${Date.now()}`,
          email: uniqueEmail,
          password: 'TestPassword123'
        })
        .end((err) => {
          if (err) return done(err);
          // Login as non-admin user
          request(app)
            .post('/api/v1/auth/login')
            .set('Accept', 'application/json')
            .send({
              email: uniqueEmail,
              password: 'TestPassword123'
            })
            .end((loginErr, res) => {
              if (loginErr) return done(loginErr);
              const nonAdminToken = res.body.token;

              request(app)
                .post('/api/v1/search-areas')
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .set('Accept', 'application/json')
                .send({
                  name: `TestArea${Date.now()}`,
                  continent: {
                    name: 'Asia',
                    code: 'AS'
                  },
                  country: {
                    name: 'Vietnam'
                  }
                })
                .expect(401, done);
            });
        });
    });
  });

  describe('PUT /api/v1/search-areas/:id', () => {
    it('should update search area with valid token and admin role', (done) => {
      if (!searchAreaId) {
        return done(new Error('No search area created'));
      }

      request(app)
        .put(`/api/v1/search-areas/${searchAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: `UpdatedArea${Date.now()}`
        })
        .expect(200, done);
    });

    it('should fail without token', (done) => {
      request(app)
        .put('/api/v1/search-areas/1')
        .set('Accept', 'application/json')
        .send({
          name: 'UpdatedArea'
        })
        .expect(401, done);
    });

    it('should fail with non-existent search area id', (done) => {
      request(app)
        .put('/api/v1/search-areas/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .send({
          name: 'UpdatedArea'
        })
        .expect(404, done);
    });
  });

  describe('DELETE /api/v1/search-areas/:id', () => {
    it('should delete search area with valid token and admin role', (done) => {
      if (!searchAreaId) {
        return done(new Error('No search area created'));
      }

      request(app)
        .delete(`/api/v1/search-areas/${searchAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should fail without token', (done) => {
      request(app)
        .delete('/api/v1/search-areas/1')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should fail with non-existent search area id', (done) => {
      request(app)
        .delete('/api/v1/search-areas/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
