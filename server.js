require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

// Simple login users
const users = [
  { username: "admin", password: "1234", role: "admin" }
];

// Test DB connection
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection error:", err.message);
  });

// Create table if not exists
async function initDatabase() {
  const query = `
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      location VARCHAR(255),
      comments TEXT NOT NULL,
      category VARCHAR(100),
      rating VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ feedback table is ready");
  } catch (error) {
    console.error("❌ Error creating feedback table:", error.message);
  }
}

initDatabase();

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SAKAN Feedback System API is running"
  });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      status: "healthy",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      error: error.message
    });
  }
});

// Login
app.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

// Submit feedback
app.post("/feedback", async (req, res) => {
  try {
    const { name, location, comments, category, rating } = req.body;

    if (!comments || !String(comments).trim()) {
      return res.status(400).json({
        success: false,
        message: "comments is required"
      });
    }

    const query = `
      INSERT INTO feedback (name, location, comments, category, rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      name ? String(name).trim() : null,
      location ? String(location).trim() : null,
      String(comments).trim(),
      category ? String(category).trim() : null,
      rating ? String(rating).trim() : null
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error inserting feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
});

// Get all feedback
app.get("/feedback", async (req, res) => {
  try {
    const query = `
      SELECT id, name, location, comments, category, rating, created_at
      FROM feedback
      ORDER BY created_at DESC, id DESC
    `;

    const result = await pool.query(query);

    return res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback"
    });
  }
});

// Get feedback by location
app.get("/feedback/location/:location", async (req, res) => {
  try {
    const { location } = req.params;

    const query = `
      SELECT id, name, location, comments, category, rating, created_at
      FROM feedback
      WHERE location = $1
      ORDER BY created_at DESC, id DESC
    `;

    const result = await pool.query(query, [location]);

    return res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching feedback by location:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch location feedback"
    });
  }
});

// Delete feedback by ID
app.delete("/feedback/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID"
      });
    }

    const result = await pool.query(
      "DELETE FROM feedback WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    return res.json({
      success: true,
      message: "Feedback deleted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete feedback"
    });
  }
});

// Optional update feedback
app.put("/feedback/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, comments, category, rating } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID"
      });
    }

    const check = await pool.query("SELECT * FROM feedback WHERE id = $1", [id]);

    if (check.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    const current = check.rows[0];

    const result = await pool.query(
      `
      UPDATE feedback
      SET name = $1,
          location = $2,
          comments = $3,
          category = $4,
          rating = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        name !== undefined ? name : current.name,
        location !== undefined ? location : current.location,
        comments !== undefined ? comments : current.comments,
        category !== undefined ? category : current.category,
        rating !== undefined ? rating : current.rating,
        id
      ]
    );

    return res.json({
      success: true,
      message: "Feedback updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error updating feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update feedback"
    });
  }
});

// 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unexpected server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
