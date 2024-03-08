const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/authMiddle"); // Adjust based on your auth strategy
const { Composition } = require("../models/composition");

const compositionNewSchema = require("../schemas/compositionNew.json"); // Define this schema
const compositionUpdateSchema = require("../schemas/compositionUpdate.json"); // Define this schema
const compositionSearchSchema = require("../schemas/compositionSearch.json"); // Define this schema

const router = new express.Router();

/** POST / { composition } =>  { composition }
 *
 * composition should be { title, composerId, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin (adjust as necessary)
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, compositionNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const composition = await Composition.create(req.body);
    return res.status(201).json({ composition });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { compositions: [ { id, title, composerId, year, description, duration, status, instrumentation }, ...] }
 *
 * Can filter on provided search filters:
 * - year
 * - status
 * - composerId
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;

  try {
    const validator = jsonschema.validate(q, compositionSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const compositions = await Composition.findAll(q);
    return res.json({ compositions });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { composition }
 *
 *  Composition is { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const composition = await Composition.get(req.params.id);
    return res.json({ composition });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { composition }
 *
 * Patches composition data.
 *
 * fields can be: { title, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, compositionUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const composition = await Composition.update(req.params.id, req.body);
    return res.json({ composition });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Composition.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;