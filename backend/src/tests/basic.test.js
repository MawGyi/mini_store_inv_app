import request from 'supertest';
import app from '../app.js';

describe('Basic API Test', () => {
  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
