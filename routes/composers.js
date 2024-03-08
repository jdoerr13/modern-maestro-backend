const express = require('express');
const router = express.Router();
const { Composer } = require('../models/composer');

/** GET /composers  =>
 *   { composers: [ { composer_id, name, biography, website, social_media_links }, ...] }
 *
 * Authorization required: none
 */
router.get('/', async (req, res, next) => {
  try {
    const composers = await Composer.findAll();
    res.json({ composers });
  } catch (error) {
    next(error);
  }
});

/** GET /composers/:id  =>  { composer }
 *
 * Authorization required: none
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }
    res.json({ composer });
  } catch (error) {
    next(error);
  }
});

// Add more route handlers as needed

module.exports = router;
