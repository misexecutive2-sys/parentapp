// routes/settings.routes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const settingsController = require("../controllers/settings.controller");

// All settings routes are PROTECTED — user must be logged in
router.use(authMiddleware);

// Change Password
router.post("/change-password", settingsController.changePassword);

// Notifications
router.get("/notifications", settingsController.getNotifications);
router.put("/notifications", settingsController.updateNotifications);

module.exports = router;
