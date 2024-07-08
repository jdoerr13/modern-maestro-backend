const app = require('./app');



// // Set the port to the environment variable PORT, or use port 3000 as a default
// const PORT = process.env.PORT || 3000;

// // Start the server and listen on the specified port
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


const app = express();
app.use(express.json());
app.use('/auth', userRoutes);

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });