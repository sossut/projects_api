import express from 'express';
import {
  projectListGet,
  projectGet,
  projectPost,
  projectPut,
  projectDelete
} from '../controllers/projectController';
import { body, param } from 'express-validator';
import passport from 'passport';

const router = express.Router();

router
  .route('/')
  .get(passport.authenticate('jwt', { session: false }), projectListGet)
  .post(
    // passport.authenticate('jwt', { session: false }),
    // body('name').isString().notEmpty().escape(),
    // body('buildingType').isString().notEmpty().escape(),
    // body('buildingUse').isArray({ min: 1 }),
    // body('buildingUse.*').isString().notEmpty().escape(),
    // body('buildingHeightMeters').optional().isFloat({ gt: 0 }).toFloat(),
    // body('buildingHeightFloors').optional().isInt({ gt: 0 }).toInt(),
    // body('addressId').isInt({ gt: 0 }).toInt(),
    // body('glassFacade').optional().isIn(['yes', 'no', 'unknown']),
    // body('facadeBasis')
    //   .optional()
    //   .isIn([
    //     'renderings',
    //     'construction_photos',
    //     'architectural_specs',
    //     'mixed',
    //     'unknown'
    //   ]),
    // body('status')
    //   .optional()
    //   .isIn([
    //     'planned',
    //     'approved',
    //     'proposed',
    //     'on_hold',
    //     'under_construction'
    //   ]),
    // body('budgetEur').optional().isFloat({ gt: 0 }).toFloat(),
    // body('expectedCompletionWindow').optional().isObject(),
    // body('expectedCompletionWindow.expected')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('expectedCompletionWindow.earliest')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('expectedCompletionWindow.latest')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('location').optional().isObject(),
    // body('location.continent').optional().isString().notEmpty().escape(),
    // body('location.country').optional().isString().notEmpty().escape(),
    // body('location.city').optional().isString().notEmpty().escape(),
    // body('location.metroArea').optional().isString().notEmpty().escape(),
    // body('location.address').optional().isString().notEmpty().escape(),
    // body('location.postcode').optional().isString().notEmpty().escape(),
    // body('projectWebsites').optional().isArray(),
    // body('projectWebsites.*').isString().notEmpty().isURL(),
    // body('developers').optional().isArray(),
    // body('developers.*.name').isString().notEmpty().escape(),
    // body('developers.*.website').optional().isString().notEmpty().isURL(),
    // body('developers.*.contact').optional().isObject(),
    // body('developers.*.contact.email').optional().isEmail().normalizeEmail(),
    // body('developers.*.contact.phone')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('architects').optional().isArray(),
    // body('architects.*.name').isString().notEmpty().escape(),
    // body('architects.*.website').optional().isString().notEmpty().isURL(),
    // body('architects.*.contact').optional().isObject(),
    // body('architects.*.contact.email').optional().isEmail().normalizeEmail(),
    // body('architects.*.contact.phone')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('contractors').optional().isArray(),
    // body('contractors.*.name').isString().notEmpty().escape(),
    // body('contractors.*.website').optional().isString().notEmpty().isURL(),
    // body('contractors.*.contact').optional().isObject(),
    // body('contractors.*.contact.email').optional().isEmail().normalizeEmail(),
    // body('contractors.*.contact.phone')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('sources').optional().isArray(),
    // body('sources.*.url').isString().notEmpty().isURL(),
    // body('sources.*.sourceType').optional().isString().notEmpty().escape(),
    // body('sources.*.publisher').optional().isString().notEmpty().escape(),
    // body('sources.*.accessedAt').optional().isISO8601().toDate(),
    projectPost
  );
router
  .route('/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    projectGet
  )
  .put(
    // passport.authenticate('jwt', { session: false }),
    // param('id').isInt({ gt: 0 }).toInt(),
    // body('name').optional().isString().notEmpty().escape(),
    // body('buildingType').optional().isString().notEmpty().escape(),
    // body('buildingUse').optional().isArray({ min: 1 }),
    // body('buildingUse.*').isString().notEmpty().escape(),
    // body('buildingHeightMeters').optional().isFloat({ gt: 0 }).toFloat(),
    // body('buildingHeightFloors').optional().isInt({ gt: 0 }).toInt(),
    // body('addressId').optional().isInt({ gt: 0 }).toInt(),
    // body('glassFacade').optional().isIn(['yes', 'no', 'unknown']),
    // body('facadeBasis')
    //   .optional()
    //   .isIn([
    //     'renderings',
    //     'construction_photos',
    //     'architectural_specs',
    //     'mixed',
    //     'unknown'
    //   ]),
    // body('status')
    //   .optional()
    //   .isIn([
    //     'planned',
    //     'approved',
    //     'proposed',
    //     'on_hold',
    //     'under_construction'
    //   ]),
    // body('budgetEur').optional().isFloat({ gt: 0 }).toFloat(),
    // body('expectedCompletionWindow').optional().isObject(),
    // body('expectedCompletionWindow.expected')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('expectedCompletionWindow.earliest')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('expectedCompletionWindow.latest')
    //   .optional()
    //   .isString()
    //   .notEmpty()
    //   .escape(),
    // body('location').optional().isObject(),
    // body('location.continent').optional().isString().notEmpty().escape(),
    // body('location.country').optional().isString().notEmpty().escape(),
    // body('location.city').optional().isString().notEmpty().escape(),
    // body('location.metroArea').optional().isString().notEmpty().escape(),
    // body('location.address').optional().isString().notEmpty().escape(),
    // body('location.postcode').optional().isString().notEmpty().escape(),
    // body('projectWebsites').optional().isArray(),
    // body('projectWebsites.*').isString().notEmpty().isURL(),
    projectPut
  )
  .delete(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    projectDelete
  );
export default router;
