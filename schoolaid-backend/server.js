

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// ── Route imports ─────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const childrenRoutes = require("./routes/children");
const settingsRoutes = require(".routes/settings/routes");       
const paymentRoutes = require("./routes/payment/routes");  
const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.disable("x-powered-by");

// Rate limiting — protects sensitive endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,
  message: { success: false, message: "Too many requests. Please slow down." },
});
app.use("/api/settings/change-password", limiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SchoolAid API running on port ${PORT}`);
});
