import request from 'supertest';
import app, { chatMessages } from './app.js';


//test suite for POST /chat
describe('POST /chat', () => {
  it('should add a new message and return the updated messages array', async () => {
    const initialLength = chatMessages.length;
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message', sender: 'Margaret' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(201);
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages.length).toBe(initialLength + 1);
    expect(response.body.messages[response.body.messages.length - 1].message).toBe('Test message');
    expect(response.body.messages[response.body.messages.length - 1].sender).toBe('Margaret');
  });

  it('should return 400 for an empty message', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '', sender: 'Margaret' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be a non-empty string");
  });

  it('should return 400 for message with only whitespace', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '   ', sender: 'Robert })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be a non-empty string");
  });

  it('should return 400 for missing sender', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message' }) //sender is missing
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be a non-empty string");
  });

  it('should return 400 for empty sender', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message', sender: '' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be a non-empty string");
  });

  it('should return 400 for sender with only whitespace', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message', sender: '   ' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be a non-empty string");
  });
});


//test suite for GET /chat
describe('GET /chat', () => {
    it('should return an array of messages', async () => {
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach(msg => {
            expect(msg).toHaveProperty('message');
            expect(msg).toHaveProperty('sender');
            expect(typeof msg.id).toBe('string');
            expect(typeof msg.message).toBe('string');
            expect(typeof msg.sender).toBe('string');
            expect(typeof msg.timestamp).toBe('string');
            expect(msg.message.length).toBeGreaterThan(0);
            expect(msg.sender.length).toBeGreaterThan(0);
        });
    });
});
    
//check that edge cases are handled for GET /chat
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
