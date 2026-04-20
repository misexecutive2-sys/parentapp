const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'DEMO_SECRET';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://staging.schoolaid.in/api/login/verify-license';

module.exports = { PORT, JWT_SECRET, JWT_EXPIRES_IN, LICENSE_API_URL };
