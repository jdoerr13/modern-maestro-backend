// auth.js
const express = require("express");
const router = new express.Router();
const jsonschema = require("jsonschema");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError, UnauthorizedError } = require("../expressError");

// Register route
router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const { username, email, firstName, lastName, password, user_type = 'normal', isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new BadRequestError("Username already exists");
    }
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new BadRequestError("Email already exists");
    }
    const newUser = await User.create({
      username,
      firstName,
      lastName,
      email,
      password_hash: hashedPassword,
      user_type,
      isAdmin: isAdmin || false,
    });
    const token = createToken({ userId: newUser.user_id, username: newUser.username, isAdmin: newUser.isAdmin });
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

// Token route
router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedError("Invalid username/password");
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid username/password");
    }
    const token = createToken({ userId: user.user_id, username: user.username, isAdmin: user.isAdmin });
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
