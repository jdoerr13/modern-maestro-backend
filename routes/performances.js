const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/authMiddle"); // Adjust based on your auth strategy
const Performance = require("../models/performance");

// const performanceNewSchema = require("../schemas/performanceNew.json"); // Define this schema
// const performanceUpdateSchema = require("../schemas/performanceUpdate.json"); // Define this schema
// const performanceSearchSchema = require("../schemas/performanceSearch.json"); // Define this schema

const router = new express.Router();

/** POST / { performance } =>  { performance }
 *
 * performance should be { title, composerId, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin (adjust as necessary)
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, performanceNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const performance = await Performance.create(req.body);
    return res.status(201).json({ performance });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { performances: [ { id, title, composerId, year, description, duration, status, instrumentation }, ...] }
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
    const validator = jsonschema.validate(q, performanceSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const performances = await Performance.findAll(q);
    return res.json({ performances });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { performance }
 *
 *  Performance is { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const performance = await Performance.get(req.params.id);
    return res.json({ performance });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { performance }
 *
 * Patches performance data.
 *
 * fields can be: { title, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, performanceUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const performance = await Performance.update(req.params.id, req.body);
    return res.json({ performance });
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
    await Performance.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
