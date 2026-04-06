const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// test
app.get("/", (req, res) => {
  res.send("SAKAN Feedback System is Running ✅");
});

// add feedback
app.post("/feedback", async (req, res) => {
  const { name, location, comments } = req.body;

  await pool.query(
    "INSERT INTO feedback (name, location, comments) VALUES ($1,$2,$3)",
    [name, location, comments]
  );

  res.json({ message: "Saved" });
});

// get feedback
app.get("/feedback", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedback ORDER BY id DESC");
  res.json(result.rows);
});

app.listen(3000, () => console.log("Server running"));
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});
