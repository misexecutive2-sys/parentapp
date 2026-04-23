// controllers/settings.controller.js

const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ─────────────────────────────────────────────
//  POST /api/settings/change-password
//  Body: { currentPassword, newPassword }
//  Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const userId = req.user.id;                         // comes from JWT middleware
  const { currentPassword, newPassword } = req.body;

  // ── 1. Validate input ─────────────────────
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "currentPassword and newPassword are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters long.",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from current password.",
    });
  }

  try {
    // ── 2. Fetch current password hash from DB ─
    // NOTE: Adjust the table/column names to match the senior dev's schema.
    const [rows] = await db.query(
      "SELECT id, password FROM users WHERE id = ? AND is_active = 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = rows[0];

    // ── 3. Verify the current password ────────
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // ── 4. Hash new password ──────────────────
    const salt = await bcrypt.genSalt(12);           // 12 rounds = strong & fast enough
    const newHash = await bcrypt.hash(newPassword, salt);

    // ── 5. Update password in DB ──────────────
    await db.query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [newHash, userId]
    );

    // ── 6. (Optional) log the change ─────────
    // If the senior dev has a password_logs or audit_logs table, insert here:
    // await db.query(
    //   "INSERT INTO password_logs (user_id, changed_at, ip_address) VALUES (?, NOW(), ?)",
    //   [userId, req.ip]
    // );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });

  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};


// ─────────────────────────────────────────────
//  PUT /api/settings/notifications
//  Body: { enabled: true | false }
//  Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
exports.updateNotifications = async (req, res) => {
  const userId = req.user.id;
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "'enabled' must be a boolean (true or false).",
    });
  }

  try {
    // ── Check if a preference row exists for this user ──
    // NOTE: Adjust table name to match the existing DB schema.
    const [existing] = await db.query(
      "SELECT id FROM notification_preferences WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
      // Row exists → UPDATE it
      await db.query(
        "UPDATE notification_preferences SET push_enabled = ?, updated_at = NOW() WHERE user_id = ?",
        [enabled ? 1 : 0, userId]
      );
    } else {
      // No row yet → INSERT first time
      await db.query(
        "INSERT INTO notification_preferences (user_id, push_enabled, updated_at) VALUES (?, ?, NOW())",
        [userId, enabled ? 1 : 0]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Notifications ${enabled ? "enabled" : "disabled"} successfully.`,
      data: { userId, notificationsEnabled: enabled },
    });

  } catch (err) {
    console.error("updateNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};


// ─────────────────────────────────────────────
//  GET /api/settings/notifications
//  Fetch the current notification preference
//  Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT push_enabled FROM notification_preferences WHERE user_id = ?",
      [userId]
    );

    // If no row exists yet, default to enabled = true
    const enabled = rows.length > 0 ? rows[0].push_enabled === 1 : true;

    return res.status(200).json({
      success: true,
      data: { notificationsEnabled: enabled },
    });

  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};
