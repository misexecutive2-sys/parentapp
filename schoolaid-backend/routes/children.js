const express = require('express');
const { childrenStore } = require('../stores/memoryStores');
const authenticateToken = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// ─── Validators ───────────────────────────────────────────────
function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}
function isValidGrade(grade) {
  return typeof grade === 'string' && grade.trim().length >= 1 && grade.trim().length <= 20;
}
function isValidSection(section) {
  return typeof section === 'string' && section.trim().length >= 1 && section.trim().length <= 10;
}
function isValidSchool(school) {
  return typeof school === 'string' && school.trim().length >= 2 && school.trim().length <= 150;
}

// ─── Add Child ───────────────────────────────────────────────
router.post('/add', rateLimiter, authenticateToken, (req, res) => {
  const { name, grade, section, school } = req.body ?? {};
  const parentPhone = req.user.phone;

  if (!name || !grade || !section || !school) {
    return res.status(400).json({ success: false, message: 'All fields are required: name, grade, section, school.' });
  }
  if (!isValidName(name)) return res.status(400).json({ success: false, message: 'Child name must be 2–100 characters.' });
  if (!isValidGrade(grade)) return res.status(400).json({ success: false, message: 'Invalid grade.' });
  if (!isValidSection(section)) return res.status(400).json({ success: false, message: 'Invalid section.' });
  if (!isValidSchool(school)) return res.status(400).json({ success: false, message: 'School name must be 2–150 characters.' });

  const existingChildren = childrenStore.get(parentPhone) || [];

  if (existingChildren.length >= 10) {
    return res.status(400).json({ success: false, message: 'Maximum of 10 children can be added per account.' });
  }

  const duplicate = existingChildren.find(
    c => c.name.toLowerCase() === name.trim().toLowerCase() &&
         c.grade.toLowerCase() === grade.trim().toLowerCase() &&
         c.section.toLowerCase() === section.trim().toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'This child is already added to your account.' });
  }

  const newChild = {
    id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    grade: grade.trim(),
    section: section.trim(),
    school: school.trim(),
    addedAt: new Date().toISOString()
  };

  existingChildren.push(newChild);
  childrenStore.set(parentPhone, existingChildren);

  console.log(`[Children] ✅ Added "${newChild.name}" for parent ...${parentPhone.slice(-4)}`);

  return res.status(201).json({ success: true, message: 'Child added successfully.', child: newChild });
});

// ─── Get Children ─────────────────────────────────────────────
router.get('/', rateLimiter, authenticateToken, (req, res) => {
  const parentPhone = req.user.phone;
  const children = childrenStore.get(parentPhone) || [];
  return res.status(200).json({ success: true, count: children.length, children });
});

// ─── Delete Child ─────────────────────────────────────────────
router.delete('/:id', rateLimiter, authenticateToken, (req, res) => {
  const parentPhone = req.user.phone;
  const { id } = req.params;

  const existing = childrenStore.get(parentPhone) || [];
  const index = existing.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Child not found.' });
  }

  const removed = existing.splice(index, 1)[0];
  childrenStore.set(parentPhone, existing);

  console.log(`[Children] ❌ Removed "${removed.name}" for parent ...${parentPhone.slice(-4)}`);

  return res.status(200).json({ success: true, message: `${removed.name} removed successfully.` });
});


router.post('/add', rateLimiter, authenticateToken, (req, res) => {
  const { name, grade, section, school, licenseKey } = req.body ?? {};
  const parentPhone = req.user.phone;

  if (!name || !grade || !section || !school || !licenseKey) {
    return res.status(400).json({ success: false, message: 'All fields are required: name, grade, section, school, licenseKey.' });
  }

  if (!isValidName(name)) return res.status(400).json({ success: false, message: 'Child name must be 2–100 characters.' });
  if (!isValidGrade(grade)) return res.status(400).json({ success: false, message: 'Invalid grade.' });
  if (!isValidSection(section)) return res.status(400).json({ success: false, message: 'Invalid section.' });
  if (!isValidSchool(school)) return res.status(400).json({ success: false, message: 'School name must be 2–150 characters.' });

  const existingChildren = childrenStore.get(parentPhone) || [];

  if (existingChildren.length >= 10) {
    return res.status(400).json({ success: false, message: 'Maximum of 10 children can be added per account.' });
  }

  // ✅ Reject duplicate child (same name/grade/section)
  const duplicateChild = existingChildren.find(
    c => c.name.toLowerCase() === name.trim().toLowerCase() &&
         c.grade.toLowerCase() === grade.trim().toLowerCase() &&
         c.section.toLowerCase() === section.trim().toLowerCase()
  );
  if (duplicateChild) {
    return res.status(409).json({ success: false, message: 'This child is already added to your account.' });
  }

  // ✅ Reject duplicate license key (same as parent OR another child)
  const parent = req.user; // comes from authMiddleware
  if (parent.licenseKey === licenseKey.trim()) {
    return res.status(400).json({ success: false, message: 'You must provide a different license key than your own.' });
  }
  const duplicateLicense = existingChildren.find(c => c.licenseKey === licenseKey.trim());
  if (duplicateLicense) {
    return res.status(409).json({ success: false, message: 'This license key is already used for another child.' });
  }

  const newChild = {
    id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    grade: grade.trim(),
    section: section.trim(),
    school: school.trim(),
    licenseKey: licenseKey.trim(),
    addedAt: new Date().toISOString()
  };

  existingChildren.push(newChild);
  childrenStore.set(parentPhone, existingChildren);

  console.log(`[Children] ✅ Added "${newChild.name}" for parent ...${parentPhone.slice(-4)}`);

  return res.status(201).json({ success: true, message: 'Child added successfully.', child: newChild });
});


module.exports = router;
