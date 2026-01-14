import request from 'supertest';
import app, { chatMessages } from './index.js';


// Test suite:

// check that the response is ok
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
    
// edge cases
describe('GET /chat edge cases', () => {
    it('returns 200 and an empty array if chatMessages is empty', async () => {
        chatMessages.length = 0; // clear the array
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    it('returns 400/error if a message object is missing the message property', async () => {
        chatMessages.length = 0;
        chatMessages.push({});
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Message must be a string');
    });

    it('returns 400 if message is not a string', async () => {
        chatMessages.length = 0;
        chatMessages.push({ message: 123 });
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(400);
    });

    it('handles very long messages gracefully', async () => {
        chatMessages.length = 0;
        chatMessages.push({ message: 'a'.repeat(10000) });
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(response.body[0].message.length).toBe(10000);
    });

    it('returns special characters and emojis correctly', async () => {
        chatMessages.length = 0;
        chatMessages.push({ message: 'Hello 😊 #chat' });
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(response.body[0].message).toBe('Hello 😊 #chat');
    });

    it('returns 400 if chatMessages contains non-object', async () => {
        chatMessages.length = 0;
        chatMessages.push('not an object');
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(400);
    });
  });
