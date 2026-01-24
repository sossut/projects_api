import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';
import searchAreaRoute from './routes/searchAreaRoute';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/emojis', emojis);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/search-areas', searchAreaRoute);

export default router;
