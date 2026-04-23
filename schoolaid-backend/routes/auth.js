const express = require("express");
const jwt = require("jsonwebtoken"); // only once
const router = express.Router();

// signup/login routes here
router.post("/login", (req, res) => {
  // issue JWT
});

module.exports = router;
