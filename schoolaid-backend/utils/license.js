// routes/license.js
const express = require('express');
const router = express.Router();

// Example: using a simple in-memory store or DB
const { userStore } = require('../stores/memoryStores');

router.post('/login/verify-license', (req, res) => {
  const { licenseKey } = req.body ?? {};

  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'License key is required.' });
  }

  // Look up license key in your user store or database
  const found = Array.from(userStore.values()).find(
    u => u.licenseKey === licenseKey.trim()
  );

  if (!found) {
    console.log(`[License] ❌ Invalid license key entered: ${licenseKey}`);
    return res.status(404).json({ success: false, message: 'Invalid or expired license key.' });
  }

  console.log(`[License] ✅ License key verified: ${licenseKey}`);
  return res.status(200).json({
    success: true,
    message: 'License key verified.',
    school: found.school || 'Demo School',
    phone: found.phone
  });
});

module.exports = router;
