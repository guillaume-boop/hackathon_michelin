// src/index.ts
import express from 'express'
import type { Express, Request, Response } from 'express'
import { RestaurantController } from './resources/restaurants/restaurants.controller.ts'
import { ExceptionsHandler } from './middlewares/exceptions.handler.ts'
import { UnknownRoutesHandler } from './middlewares/unknowRoutes.handler.ts'

const app: Express = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ message: '200: OK' })
})

// Restaurant routes
app.use('/api/restaurants', RestaurantController)

// Middleware for unknown routes (MUST be before ExceptionsHandler)
app.use(UnknownRoutesHandler)

// Middleware for handling exceptions (MUST be last)
app.use(ExceptionsHandler)

app.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`)
})