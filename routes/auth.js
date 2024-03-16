const jsonschema = require("jsonschema");
const bcrypt = require("bcrypt");
const { User }= require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");
const { Composer } = require('../models/composer'); // Adjust the path as needed


/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      throw new BadRequestError("Invalid username or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new BadRequestError("Invalid username or password");
    }

    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, email, password, firstName, lastName }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    console.log("Received a registration request:", req.body);

    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      console.error("Validation errors:", errs);
      throw new BadRequestError(errs);
    }

    const { username, email, firstName, lastName, password, user_type, preferences, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      throw new BadRequestError("User already exists");
    }

    // Create the user
    const newUser = await User.create({
      username,
      firstName,
      lastName,
      email,
      password_hash: hashedPassword,
      user_type,
      preferences,
      isAdmin: isAdmin || false,
    });

    console.log("User created:", newUser.toJSON());
    const token = createToken({ userId: newUser.user_id, username: newUser.username, isAdmin: newUser.isAdmin });
    return res.status(201).json({ token });
  } catch (err) {
    console.error("Registration error:", err);
    return next(err);
  }
});





module.exports = router;

