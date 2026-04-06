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
<div class="box">
  <h2>Feedback</h2>

  <input id="name" placeholder="Name">
  <input id="location" placeholder="Location">
  <textarea id="comments" placeholder="Comments"></textarea>

  <button onclick="send()">Send</button>
</div>

<script>
async function send() {
  const data = {
    name: document.getElementById("name").value,
    location: document.getElementById("location").value,
    comments: document.getElementById("comments").value
  };

  await fetch("https://sakan-feedback-app.onrender.com/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  alert("Saved ✅");
}
</script>
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
app.get("/admin", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedback ORDER BY id DESC");

  let html = `
  <html>
  <head>
    <title>SAKAN Dashboard</title>
    <style>
      body { font-family: Arial; padding: 40px; background: #f5f5f5; }
      table { width: 100%; border-collapse: collapse; background: white; }
      th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
      th { background: #6c2bd9; color: white; }
      tr:hover { background: #f1f1f1; }
    </style>
  </head>
  <body>

  <h2>📊 Feedback Dashboard</h2>

  <table>
    <tr>
      <th>Name</th>
      <th>Location</th>
      <th>Comments</th>
      <th>Date</th>
    </tr>
  `;

  result.rows.forEach(item => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.location}</td>
        <td>${item.comments}</td>
        <td>${new Date(item.created_at).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
    </table>
  </body>
  </html>
  `;

  res.send(html);
});
