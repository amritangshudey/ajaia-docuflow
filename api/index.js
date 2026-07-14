// Test endpoint - verify Vercel can execute functions
export default (req, res) => {
  res.status(200).json({ message: 'API is working', path: req.url });
};
