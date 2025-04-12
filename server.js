const app = require('./app');
const { PORT } = require('./config');
const { syncUserModel } = require('./models/user'); // ← Add this line

syncUserModel(); // ← Add this line

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});