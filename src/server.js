import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start the email worker
    try {
      await import('./workers/email.worker.js');
      console.log('Email worker started successfully');
    } catch (workerErr) {
      console.warn('Email worker failed to start (Redis may not be available):', workerErr.message);
      console.warn('Email sending will not work until Redis is available.');
    }

    const server = app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
