import request from 'supertest';
import app, { chatMessages } from './app.js';

//test suite for lon-polling version
it('should return only new messages since the given timestamp', async () => {
  chatMessages.length = 0;
  const oldMsg = {
    messageId: '1',
    message: 'Old',
    sender: 'Margaret',
    timestamp: Date.now() - 10000
  };
  const newMsg = {
    messageId: '2',
    message: 'New',
    sender: 'Robert',
    timestamp: Date.now()
  };
  chatMessages.push(oldMsg, newMsg);

  const response = await request(app).get(`/chat?since=${oldMsg.timestamp}`);
  expect(response.statusCode).toBe(200);
  expect(response.body.length).toBe(1);
  expect(response.body[0].message).toBe('New');
});

//if no new messages response should be delayed
it('should delay response if no new messages are available', async () => {
  chatMessages.length = 0;
  const msg = {
    messageId: '1',
    message: 'Only',
    sender: 'A',
    timestamp: Date.now()
  };
  chatMessages.push(msg);

  const start = Date.now();
  // Use a timestamp in the future to ensure no new messages
  const response = await request(app).get(`/chat?since=${Date.now() + 1000}`);
  const duration = Date.now() - start;
  // Should be close to 30 seconds (your timeout)
  expect(duration).toBeGreaterThanOrEqual(29000);
  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBe(0);
}, 35000);