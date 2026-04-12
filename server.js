const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Users (Login)
const users = [
  { username: "admin", password: "1234" }
];

// Login API
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("SAKAN Feedback System is Running ✅");
});

// Add feedback
app.post("/feedback", async (req, res) => {
  try {
    const { name, location, comments, site } = req.body;

    await pool.query(
      "INSERT INTO feedback (name, location, comments, site) VALUES ($1, $2, $3, $4)",
      [name, location, comments, site]
    );

    res.json({ message: "Saved" });
  } catch (error) {
    console.error("POST /feedback error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get all feedback
app.get("/feedback", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM feedback ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /feedback error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get feedback by site
app.get("/feedback/:site", async (req, res) => {
  try {
    const site = req.params.site;

    const result = await pool.query(
      "SELECT * FROM feedback WHERE site = $1 ORDER BY id DESC",
      [site]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /feedback/:site error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
