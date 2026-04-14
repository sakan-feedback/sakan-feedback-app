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

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Get all feedback
app.get("/feedback/location/:location", async (req, res) => {
  try {
    const { location } = req.params;

    const result = await pool.query(
      "SELECT * FROM feedback WHERE UPPER(location) = UPPER($1) ORDER BY id DESC",
      [location]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching location data");
  }
});

// Add feedback
app.post("/feedback", async (req, res) => {
  try {
    const { name, location, comments } = req.body;

    await pool.query(
      "INSERT INTO feedback (name, location, comments) VALUES ($1,$2,$3)",
      [name, location, comments]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving data");
  }
});

// Delete feedback
app.delete("/feedback/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM feedback WHERE id = $1",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting data");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
