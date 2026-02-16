import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';

import projectRoute from './routes/projectRoute';
import companiesRoute from './routes/companiesRoute';
import automationRoute from './routes/automationRoute';
import metroAreaRoute from './routes/metroAreaRoute';
import cityRoute from './routes/cityRoute';
import buildingUseRoute from './routes/buildingUseRoute';
import countryRoute from './routes/countryRoute';
import buildingTypeRoute from './routes/buildingTypeRoute';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/emojis', emojis);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/metro-areas', metroAreaRoute);
router.use('/projects', projectRoute);
router.use('/companies', companiesRoute);
router.use('/automation', automationRoute);
router.use('/cities', cityRoute);
router.use('/building-uses', buildingUseRoute);
router.use('/countries', countryRoute);
router.use('/building-types', buildingTypeRoute);

export default router;
