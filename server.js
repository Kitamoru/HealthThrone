require('dotenv').config();
const express = require('express');
const path = require('path');
const { startBot } = require('./bot');
const apiRouter = require('./api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startBot();
});