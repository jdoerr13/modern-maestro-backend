const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/authMiddle");
const authRoutes = require("./routes/auth");
const composerRoutes = require("./routes/composers");
const compositionRoutes = require("./routes/compositions");
const performanceRoutes = require("./routes/performances");
const userInteractionRoutes = require("./routes/userInteractions");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use('/uploads', express.static('uploads'));
// Apply authenticateJWT middleware only to routes that require authentication
app.use("/composers", authenticateJWT);
app.use("/compositions", authenticateJWT);
app.use("/performances", authenticateJWT);
app.use("/interactions", authenticateJWT);
app.use("/users", authenticateJWT);

app.use("/auth", authRoutes);
app.use("/composers", composerRoutes);
app.use("/compositions", compositionRoutes);
app.use("/performances", performanceRoutes);
app.use("/interactions", userInteractionRoutes);
app.use("/users", userRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});
/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    return next(new NotFoundError());
  });
  
  /** Generic error handler; anything unhandled goes here. */
  app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;
  
    return res.status(status).json({
      error: { message, status },
    });
  });
  
  module.exports = app;
