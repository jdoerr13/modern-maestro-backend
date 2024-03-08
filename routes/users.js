// Import necessary libraries and middleware
const express = require('express');
const router = express.Router();
const { User } = require('../models/user'); 
const bcrypt = require('bcrypt');
const jsonschema = require('jsonschema');
const { ensureAdmin, ensureCorrectUserOrAdmin } = require('../middleware/authMiddle'); 
const { BadRequestError } = require('../expressError'); 
const userNewSchema = require('../schemas/userNew.json'); 
const userUpdateSchema = require('../schemas/userUpdate.json'); 
const userSearchSchema = require('../schemas/userSearch.json'); 
const { createToken } = require('../helpers/tokens'); 

// POST /users { user } => { user, token }
// Route for admin to add new users
router.post('/', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { username, email, password, user_type, preferences } = req.body;
        const password_hash = await bcrypt.hash(password, 10); // Hash password

        const user = await User.findOrCreateUser(username, email, password_hash, user_type, preferences);
        const token = createToken(user); // Ensure your createToken method can handle Sequelize models

        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

// GET /users => { users: [...users] }
// Route for listing all users, admin only
router.get('/', ensureAdmin, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

// GET /users/:username => { user }
// Route for retrieving a single user, with authorization
router.get('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const username = req.params.username;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new BadRequestError('User not found');
        }
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

// GET /users/search => { users: [...matchedUsers] }
// Route for searching users based on certain criteria
router.get('/search', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.query, userSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { username, email, user_type } = req.query;
        const whereClause = {};
        if (username) whereClause.username = username;
        if (email) whereClause.email = email;
        if (user_type) whereClause.user_type = user_type;

        const matchedUsers = await User.findAll({ where: whereClause });
        return res.json({ users: matchedUsers });
    } catch (err) {
        return next(err);
    }
});

// PATCH /users/:username => { user }
// Route for updating a user, with authorization
router.patch('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const username = req.params.username;
        let user = await User.findOne({ where: { username } });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Assuming password can be updated. Hash new password if present.
        if (req.body.password) {
            req.body.password_hash = await bcrypt.hash(req.body.password, 10);
            delete req.body.password; // Remove plain password from the request body
        }

        // Update user details
        await user.update(req.body);

        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

// DELETE /users/:username => { deleted: username }
// Route for deleting a user, with authorization
router.delete('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const username = req.params.username;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        await user.destroy();
        return res.json({ deleted: username });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
