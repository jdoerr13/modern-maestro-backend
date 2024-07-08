const app = require('./app');



// Set the port to the environment variable PORT, or use port 3000 as a default
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
