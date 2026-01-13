import request from 'supertest';
import app from './index.js';

// Tests:
// Check that the response is ok, is an array, and loops
// through every message to ensure each has a non-empty string message property.
describe('GET /chat', () => {
    it('should return an array of messages', async () => {
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach(msg => {
            expect(msg).toHaveProperty('message');
            expect(typeof msg.message).toBe('string');
            expect(msg.message.length).toBeGreaterThan(0);
            });
    });
});