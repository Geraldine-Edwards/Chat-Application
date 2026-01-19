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
    expect(response.body.error).toBe("Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)");
  });

  it('should return 400 for message with only whitespace', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '   ', sender: 'Robert' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)");
  });

  it('should return 400 for missing sender', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message' }) //sender is missing
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)");
  });

  it('should return 400 for empty sender', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message', sender: '' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)");
  });

  it('should return 400 for sender with only whitespace', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Test message', sender: '   ' })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)");
  });

  it('sanitizes script tags in message', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<script>alert(1)</script>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).not.toContain('<script>');
    expect(lastMsg).not.toContain('alert');
  });

  it('removes event handler attributes', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<img src="x" onerror="alert(1)">', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<img src="x">');
    expect(lastMsg).not.toContain('onerror');
  });

  it('removes unquoted event handler attributes', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<img src=x onerror=alert(1)>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<img src="x">');
    expect(lastMsg).not.toContain('onerror');
  });

  it('removes javascript: URLs', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<a href="javascript:alert(1)">Click</a>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<a>Click</a>');
    expect(lastMsg).not.toContain('javascript:');
  });

  it('removes data: URLs with scripts', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<a>Click</a>');
    expect(lastMsg).not.toContain('data:text/html');
  });

  it('removes SVG with script tags', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<svg><script>alert("XSS")</script></svg>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).not.toContain('<script>');
    expect(lastMsg).toContain('svg');
  });

  it('removes style attributes with javascript', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<div style="background-image: url(javascript:alert(1))">Test</div>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<div>Test</div>');
    expect(lastMsg).not.toContain('style=');
    expect(lastMsg).not.toContain('javascript:');
  });

  it('removes iframe and embed tags', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<iframe src="javascript:alert(1)"></iframe><embed src="javascript:alert(1)">', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).not.toContain('<iframe');
    expect(lastMsg).not.toContain('<embed');
  });

  it('removes obfuscated javascript in href', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<a href="jav&#x09;ascript:alert(1)">Click</a>', sender: 'Attacker' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toContain('<a>Click</a>');
    expect(lastMsg).not.toContain('javascript:');
  });

  it('allows safe HTML', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: '<b>Hello</b>', sender: 'User' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toBe('<b>Hello</b>');
  });

  it('escapes plain text', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Hello & < > " \'', sender: 'User' })
      .set('Content-Type', 'application/json');
    const lastMsg = response.body.messages.at(-1).message;
    expect(lastMsg).toBe('Hello &amp; &lt; &gt; " \'');
  });

});


//test suite for GET /chat
describe('GET /chat', () => {
    beforeEach(() => {
        chatMessages.length = 0;
        chatMessages.push({
          id: 'test-id',
          message: 'Hello',
          sender: 'Test',
          timestamp: new Date().toISOString()
        });
    });

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
        chatMessages.push({ 
          id: 'long-id',
          message: 'a'.repeat(10000),
          sender: 'LongSender',
          timestamp: new Date().toISOString()
        });
        const response = await request(app).get('/chat');
        expect(response.statusCode).toBe(200);
        expect(response.body[0].message.length).toBe(10000);
    });

    it('returns special characters and emojis correctly', async () => {
        chatMessages.length = 0;
        chatMessages.push({ 
          id: 'emoji-id',
          message: 'Hello 😊 #chat',
          sender: 'EmojiUser',
          timestamp: new Date().toISOString()
        });
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
