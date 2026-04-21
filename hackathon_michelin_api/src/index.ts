// src/index.ts
import express from 'express';
import type { Express, Request, Response } from 'express';
import { ExceptionsHandler } from './middlewares/exceptions.handler.ts'
import { UnknownRoutesHandler } from './middlewares/unknowRoutes.handler.ts'


const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

// Routes list
app.get('/health/', (req: Request, res: Response) => {
  res.json({ message: '200: OK' });
});

// Middleware for unknown routes
app.use(UnknownRoutesHandler);

// Middleware for handling exceptions
app.use(ExceptionsHandler);