import app from './index.js';

const port = 3000;

app.listen(port, () => {
  console.log(`Chat server listening on port ${port}`);
});