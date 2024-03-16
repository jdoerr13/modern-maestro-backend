const express = require('express');
const router = express.Router();
const { Composer } = require('../models/composer');
const { Composition }  = require('../models/composition');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/authMiddle');

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

// Additional import may be required depending on how you've structured your code
// Assuming Composition model has a method to find by composerId

/** GET /composers/:composerId/compositions => { compositions: [...] }
 *
 * Returns list of compositions for a given composer.
 *
 * Authorization required: none
 */
router.get("/:composerId/compositions", async function (req, res, next) {
  try {
    const { composerId } = req.params;
    const compositions = await Composition.findAll({
      where: { composer_id: composerId }
    });
    return res.json({ compositions });
  } catch (err) {
    return next(err);
  }
});

/** POST /composers  =>  { composer }
 *
 * Creates a new composer and returns the newly created composer.
 *
 * Authorization required: Logged in
 */
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const { name, biography, website, social_media_links } = req.body;
    const composer = await Composer.create({ name, biography, website, social_media_links });
    res.status(201).json({ composer });
  } catch (error) {
    next(error);
  }
});

/** PATCH /composers/:id  =>  { composer }
 *
 * Updates an existing composer's details except for the name.
 *
 * Authorization required: Admin
 */
router.patch('/:id', ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }

    const { biography, website, social_media_links } = req.body;
    await composer.update({ biography, website, social_media_links });
    res.json({ composer });
  } catch (error) {
    next(error);
  }
});

/** PATCH /composers/:id/name  =>  { composer }
 *
 * Updates an existing composer's name.
 * This route should be used to update only the composer's name.
 *
 * Authorization required: Admin
 */
router.patch('/:id/name', ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }

    const { name } = req.body;
    await composer.update({ name });
    res.json({ composer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
