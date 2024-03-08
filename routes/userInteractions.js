const express = require('express');
const router = express.Router();
const { UserInteraction } = require('../models/userInteraction');

/** GET /userInteractions  =>
 *   { userInteractions: [ { interaction_id, user_id, target_id, interaction_type, content, interaction_date }, ...] }
 *
 * Authorization required: none
 */
router.get('/', async (req, res, next) => {
  try {
    const userInteractions = await UserInteraction.findAll();
    res.json({ userInteractions });
  } catch (error) {
    next(error);
  }
});

/** GET /userInteractions/:id  =>  { userInteraction }
 *
 * Authorization required: none
 */
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

// Add more route handlers as needed

module.exports = router;