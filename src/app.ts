require('dotenv').config();
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

import * as middlewares from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import logger from './utils/logger';

const app = express();
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  accessControlAllowOrigin: '*',
  accessControlAllowCredentials: true
};

app.use(
  pinoHttp({
    logger: logger.raw,
    genReqId(req, res) {
      const incomingRequestId = req.headers['x-request-id'];
      const requestId =
        typeof incomingRequestId === 'string'
          ? incomingRequestId
          : Array.isArray(incomingRequestId)
            ? incomingRequestId[0]
            : randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) return 'silent';
      if (req.url === '/') return 'silent';
      return 'info';
    }
  })
);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄'
  });
});

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
