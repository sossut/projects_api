import supertest from 'supertest';
import app from '../src/app';

describe('City Routes', () => {
  describe('GET /api/v1/cities', () => {
    it('should get all cities', (done) => {
      supertest(app)
        .get('/api/v1/cities')
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
  });
});
