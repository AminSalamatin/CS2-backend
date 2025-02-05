import app from './app';
import mongoConnect from './utils/db';

const port = Number(process.env.PORT) || 3000;
(async () => {
  try {
    await mongoConnect();
    app.listen(port, '0.0.0.0', () => {
      /* eslint-disable no-console */
      console.log(`Listening: ${port}`);
      /* eslint-enable no-console */
    });
  } catch (error) {
    console.log('Server error', (error as Error).message);
  }
})();
