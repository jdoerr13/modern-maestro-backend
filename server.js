require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();

// Ensure the environment variables are correctly loaded
console.log('Environment Variables:', {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

// Set the port to the environment variable PORT, or use port 3000 as a default
const PORT = process.env.PORT || 3000;

// Create a new Pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for connecting to a managed database with SSL
  }
});

// Function to query the database
const query = (text, params) => pool.query(text, params);

// Test database connection route
app.get("/test-db", async (req, res) => {
  try {
    const result = await query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).send("Error connecting to database");
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
