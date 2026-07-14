import app from '../backend/server.js';

// Wrap Express app for Vercel serverless
const handler = (req, res) => {
  try {
    app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
