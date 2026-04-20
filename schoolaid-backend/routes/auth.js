const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userStore, loginAttemptStore, childrenStore } = require('../stores/memoryStores');
const { sanitizePhone, isValidPhone, isValidPassword, isValidLicenseFormat } = require('../utils/validators');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── Signup ───────────────────────────────────────────────
// router.post('/signup', rateLimiter, async (req, res) => {
//   const { licenseKey, number, phone, password } = req.body ?? {};
//   const rawPhone = number || phone;

//   if (!licenseKey || !rawPhone || !password) {
//     return res.status(400).json({ success: false, message: 'All fields are required: licenseKey, number, password.' });
//   }

//   if (!isValidLicenseFormat(licenseKey)) {
//     return res.status(400).json({ success: false, message: 'Invalid license key format.' });
//   }

//   const cleanPhone = sanitizePhone(rawPhone);
//   if (!isValidPhone(cleanPhone)) {
//     return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
//   }

//   if (!isValidPassword(password)) {
//     return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.' });
//   }

//   if (userStore.has(cleanPhone)) {
//     return res.status(409).json({ success: false, message: 'An account with this phone number already exists. Please log in.' });
//   }

//   const passwordHash = await bcrypt.hash(password, 12);

//   userStore.set(cleanPhone, {
//     phone: cleanPhone,
//     passwordHash,
//     licenseKey: licenseKey.trim(),
//     createdAt: new Date().toISOString()
//   });

//   // ✅ Insert default child profile
//   const defaultChild = {
//     id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
//     name: cleanPhone,
//     grade: "N/A",
//     section: "N/A",
//     school: "Demo School",
//     addedAt: new Date().toISOString()
//   };

//   childrenStore.set(cleanPhone, [defaultChild]);
//   console.log('[Signup] ✅ Child created for', cleanPhone, defaultChild);

//   const token = generateToken({ phone: cleanPhone, licenseKey: licenseKey.trim() });

//   return res.status(201).json({
//     success: true,
//     message: 'Account created successfully.',
//     token,
//     user: { phone: cleanPhone }
//   });
// });

// ─── Signup ───────────────────────────────────────────────
router.post('/signup', rateLimiter, async (req, res) => {
  const { licenseKey, number, phone, password } = req.body ?? {};
  const rawPhone = number || phone;

  if (!licenseKey || !rawPhone || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required: licenseKey, number, password.' });
  }

  if (!isValidLicenseFormat(licenseKey)) {
    return res.status(400).json({ success: false, message: 'Invalid license key format.' });
  }

  const cleanPhone = sanitizePhone(rawPhone);
  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.' });
  }

  if (userStore.has(cleanPhone)) {
    return res.status(409).json({ success: false, message: 'An account with this phone number already exists. Please log in.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  userStore.set(cleanPhone, {
    phone: cleanPhone,
    passwordHash,
    licenseKey: licenseKey.trim(),
    createdAt: new Date().toISOString()
  });

  // ✅ Insert default child profile
  const defaultChild = {
    id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanPhone,
    grade: "N/A",
    section: "N/A",
    school: "Demo School",
    addedAt: new Date().toISOString()
  };

  childrenStore.set(cleanPhone, [defaultChild]);
  console.log('[Signup] ✅ Child created for', cleanPhone, defaultChild);

  // 🚫 Do NOT issue token here
  return res.status(201).json({
    success: true,
    message: 'Account created successfully. Please log in to continue.'
  });
});


// ─── Login ───────────────────────────────────────────────
router.post('/login', rateLimiter, async (req, res) => {
  const { number, phone, password } = req.body ?? {};
  const rawPhone = number || phone;
  console.log('[Login] rawPhone:', rawPhone);

  if (!rawPhone || !password) {
    return res.status(400).json({ success: false, message: 'Phone number and password are required.' });
  }

  const cleanPhone = sanitizePhone(rawPhone);
  console.log('[Login] cleanPhone:', cleanPhone);

  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  const user = userStore.get(cleanPhone);
  console.log('[Login] user from store:', user);

  const dummyHash = '$2a$12$placeholderHashUsedForTimingProtectionOnly1234';
  const passwordMatch = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
  console.log('[Login] passwordMatch:', passwordMatch);

  if (!user || !passwordMatch) {
    const entry = loginAttemptStore.get(cleanPhone) || { attempts: 0 };
    entry.attempts += 1;
    loginAttemptStore.set(cleanPhone, entry);
    return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
  }

  loginAttemptStore.delete(cleanPhone);

  // ✅ Ensure at least one child exists
  if (!childrenStore.has(cleanPhone) || childrenStore.get(cleanPhone).length === 0) {
    const defaultChild = {
      id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanPhone,
      grade: "N/A",
      section: "N/A",
      school: user.licenseKey ? "Demo School" : "N/A",
      addedAt: new Date().toISOString()
    };
    childrenStore.set(cleanPhone, [defaultChild]);
    console.log('[Login] ✅ Default child created for', cleanPhone, defaultChild);
  }

  const token = generateToken({ phone: cleanPhone, licenseKey: user.licenseKey });

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: { phone: cleanPhone }
  });
});

module.exports = router;
