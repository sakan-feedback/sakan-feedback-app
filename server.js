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
const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      name TEXT,
      location TEXT,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table ready ✅");
};

createTable();
app.get("/", (req, res) => {
  res.send("SAKAN Feedback System is Running ✅");
});

app.post("/feedback", async (req, res) => {
  const { name, location, comments } = req.body;

  await pool.query(
    "INSERT INTO feedback (name, location, comments) VALUES ($1, $2, $3)",
    [name, location, comments]
  );

  res.json({ message: "Saved" });
});

app.get("/feedback", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedback ORDER BY id DESC");
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("Server running");
});
