const express = require('express');
const router = express.Router();
const { UserInteraction } = require('../models/userInteraction');
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require('../middleware/authMiddle'); // Adjust path as necessary

// GET all userInteractions
router.get('/', async (req, res, next) => {
  try {
    const userInteractions = await UserInteraction.findAll();
    res.json({ userInteractions });
  } catch (error) {
    next(error);
  }
});

// GET a single userInteraction by id
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const userInteraction = await UserInteraction.findByPk(id);
    if (!userInteraction) {
      return res.status(404).json({ error: 'User interaction not found' });
    }
    res.json({ userInteraction });
  } catch (error) {
    next(error);
  }
});

// POST a new userInteraction - Requires login
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const { user_id, target_id, target_type, interaction_type, content, rating } = req.body;
    const newUserInteraction = await UserInteraction.create({
      user_id,
      target_id,
      target_type,
      interaction_type,
      content,
      rating
    });
    res.status(201).json({ newUserInteraction });
  } catch (error) {
    next(error);
  }
});

// PATCH/update a userInteraction by id - User must be correct user or admin
router.patch('/:id', ensureCorrectUserOrAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { content, rating } = req.body;
    const userInteraction = await UserInteraction.findByPk(id);
    if (!userInteraction) {
      return res.status(404).json({ error: 'User interaction not found' });
    }

    userInteraction.content = content ?? userInteraction.content;
    userInteraction.rating = rating ?? userInteraction.rating;
    await userInteraction.save();

    res.json({ userInteraction });
  } catch (error) {
    next(error);
  }
});

// DELETE a userInteraction by id - Requires admin
router.delete('/:id', ensureAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const userInteraction = await UserInteraction.findByPk(id);
    if (!userInteraction) {
      return res.status(404).json({ error: 'User interaction not found' });
    }

    await userInteraction.destroy();
    res.json({ deleted: id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
