// schoolaid-backend/config.js
require('dotenv').config();

module.exports = {
  // Secret key used to sign JWTs
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',

  // Expiry time for JWTs (e.g. '7d', '1h')
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Port your server should run on
  PORT: process.env.PORT || 5000,

  // Base API URL (optional, useful if you want to centralize Ngrok/local URL)
  API_URL: process.env.API_URL || 'http://localhost:5000'
};
