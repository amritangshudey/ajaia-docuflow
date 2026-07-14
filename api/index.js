let app;

// Lazy load the Express app to catch initialization errors
async function getApp() {
  if (!app) {
    try {
      const module = await import('../backend/server.js');
      app = module.default;
    } catch (error) {
      console.error('Failed to import server:', error);
      throw error;
    }
  }
  return app;
}

// Vercel serverless handler
export default async (req, res) => {
  try {
    const app = await getApp();
    
    // Call Express app
    return new Promise((resolve) => {
      app(req, res, () => {
        resolve();
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
