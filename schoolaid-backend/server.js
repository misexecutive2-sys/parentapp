const express = require("express");
const cors    = require("cors");
const { v4: uuidv4 } = require("uuid");

const app  = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Add this middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ── In-memory store ──
let leaveRecords = [];

// ADD THIS MISSING ENDPOINT - This is causing your calendar error!
app.get("/attendance_calendar", (req, res) => {
  // Return sample attendance data for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendarData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Random status for demo - replace with your actual data
    const statuses = ["P", "A", "P", "P", "H", "P", "A", "P", "P", "P"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    calendarData.push({ date, status });
  }
  
  res.json(calendarData);
});

// ── Helpers ──
function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  return !isNaN(new Date(str).getTime());
}

function hasOverlap(student_id, from_date, to_date, excludeId = null) {
  return leaveRecords.some((r) => {
    if (r.student_id !== student_id) return false;
    if (r.id         === excludeId)  return false;
    if (r.status     === "Rejected") return false;
    return from_date <= r.to_date && to_date >= r.from_date;
  });
}

// ── POST /attendance_leave_history ── Apply leave
app.post("/attendance_leave_history", (req, res) => {
  console.log("POST /attendance_leave_history", req.body);
  
  const { student_id, student_name, from_date, to_date, reason } = req.body;

  const errors = [];
  if (!student_id || !String(student_id).trim())   errors.push("student_id is required.");
  if (!from_date  || !isValidDate(from_date))      errors.push("from_date is required (YYYY-MM-DD).");
  if (!to_date    || !isValidDate(to_date))        errors.push("to_date is required (YYYY-MM-DD).");
  if (from_date && to_date && new Date(from_date) > new Date(to_date))
                                                   errors.push("from_date cannot be after to_date.");
  if (!reason || String(reason).trim().length < 3) errors.push("reason is required (min 3 chars).");

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  if (hasOverlap(student_id, from_date, to_date)) {
    return res.status(409).json({
      success: false,
      errors: ["A pending or approved leave already exists for these dates."],
    });
  }

  const record = {
    id:           uuidv4(),
    student_id:   String(student_id).trim(),
    student_name: student_name ? String(student_name).trim() : "Unknown",
    from_date,
    to_date,
    reason:       String(reason).trim(),
    status:       "Pending",
    applied_at:   new Date().toISOString(),
  };

  leaveRecords.push(record);
  console.log("Leave added:", record);
  return res.status(201).json({ success: true, message: "Leave submitted.", data: record });
});

// ── GET /attendance_leave_history ── Get history
app.get("/attendance_leave_history", (req, res) => {
  console.log("GET /attendance_leave_history", req.query);
  
  const { student_id, status } = req.query;

  let result = [...leaveRecords];
  if (student_id) result = result.filter((r) => r.student_id === String(student_id).trim());
  if (status)     result = result.filter((r) => r.status === status);

  result.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
  return res.json(result);
});

// ── PATCH /attendance_leave_history/:id ── Approve / Reject
app.patch("/attendance_leave_history/:id", (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  const allowed = ["Approved", "Rejected", "Pending"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, errors: [`status must be one of: ${allowed.join(", ")}`] });
  }

  const idx = leaveRecords.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ success: false, errors: ["Record not found."] });

  leaveRecords[idx] = { ...leaveRecords[idx], status };
  return res.json({ success: true, data: leaveRecords[idx] });
});

// ── DELETE /attendance_leave_history/:id ── Delete record
app.delete("/attendance_leave_history/:id", (req, res) => {
  const idx = leaveRecords.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, errors: ["Record not found."] });

  leaveRecords.splice(idx, 1);
  return res.json({ success: true, message: "Deleted." });
});

// Add a test endpoint to verify server is working
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   GET  /attendance_calendar`);
  console.log(`   POST /attendance_leave_history`);
  console.log(`   GET  /attendance_leave_history`);
  console.log(`   PATCH /attendance_leave_history/:id`);
  console.log(`   DELETE /attendance_leave_history/:id`);
  console.log(`   GET  /test`);
});