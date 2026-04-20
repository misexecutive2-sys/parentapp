function sanitizePhone(phone) { return String(phone).replace(/[^\d+]/g, '').trim(); }
function isValidPhone(phone) { return /^(\+91)?[6-9]\d{9}$/.test(phone); }
function isValidPassword(password) {
  return typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}
function isValidLicenseFormat(key) {
  return typeof key === 'string' && /^[A-Za-z0-9\-_.]{6,128}$/.test(key.trim());
}

module.exports = { sanitizePhone, isValidPhone, isValidPassword, isValidLicenseFormat };
