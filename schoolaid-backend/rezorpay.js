// ─────────────────────────────────────────────────────────────
//  razorpay-server.js  —  SchoolAid Razorpay Backend
//  npm install express razorpay crypto cors dotenv
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── Razorpay instance ────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,         // rzp_test_XXXXXXXXXXXXXXX
  key_secret: process.env.RAZORPAY_KEY_SECRET, // your secret key
});

// ────────────────────────────────────────────────────────────
//  POST /api/app/create-payment-order
//  Body: { fee_id, amount, student_id }
//  Returns: { order_id, amount, currency, key }
// ────────────────────────────────────────────────────────────
app.post("/api/app/create-payment-order", async (req, res) => {
  try {
    const { fee_id, amount, student_id } = req.body;

    if (!fee_id || !amount || !student_id) {
      return res.status(400).json({ error: "fee_id, amount, and student_id are required" });
    }

    // Amount must be in paise (multiply ₹ by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_fee_${fee_id}_student_${student_id}_${Date.now()}`,
      notes: {
        fee_id: String(fee_id),
        student_id: String(student_id),
      },
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      order_id: order.id,          // rzp_order_XXXXXX — pass to frontend
      amount: order.amount,        // in paise
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // send key to frontend
    });

  } catch (err) {
    console.error("create-payment-order error:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order", details: err.message });
  }
});

// ────────────────────────────────────────────────────────────
//  POST /api/app/verify-payment
//  Body: { order_id, payment_id, signature, fee_id }
//  Returns: { success: true, transaction_id }
// ────────────────────────────────────────────────────────────
app.post("/api/app/verify-payment", async (req, res) => {
  try {
    const { order_id, payment_id, signature, fee_id } = req.body;

    if (!order_id || !payment_id || !signature || !fee_id) {
      return res.status(400).json({ error: "order_id, payment_id, signature, and fee_id are required" });
    }

    // ── Signature verification ───────────────────────────────
    // Razorpay signs: order_id + "|" + payment_id with your secret
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Payment signature verification failed. Possible tamper attempt." });
    }

    // ── Signature is valid — mark fee as paid in your DB ─────
    // TODO: Update your DB here, e.g.:
    // await db.query(
    //   "UPDATE fees SET status='paid', transaction_id=?, paid_date=NOW() WHERE id=?",
    //   [payment_id, fee_id]
    // );

    console.log(`✅ Payment verified — fee_id: ${fee_id}, payment_id: ${payment_id}`);

    return res.json({
      success: true,
      transaction_id: payment_id,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: "Verification failed", details: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 SchoolAid payment server running on port ${PORT}`));