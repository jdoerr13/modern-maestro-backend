const app = require('./app');



// Set the port to the environment variable PORT, or use port 3000 as a default
const PORT = process.env.PORT || 3000;

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
