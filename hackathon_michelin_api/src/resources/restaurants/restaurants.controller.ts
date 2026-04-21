import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { RestaurantService } from './restaurants.service.ts'
import { NotFoundError, BadRequestError } from '../../utils/Exception.ts'

/**
 * Router Express for Restaurants
 */
const RestaurantController = Router()

/**
 * Service Instance for managing restaurants data
 */
const service = new RestaurantService()

/**
 * Wrapper for handling errors in async routes
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * GET / - Find all restaurants
 */
RestaurantController.get('/', asyncHandler(async (req: Request, res: Response) => {
  const restaurants = service.findAll()
  return res.status(200).json(restaurants)
}))

/**
 * GET /:id - Find a specific restaurant
 */
RestaurantController.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    throw BadRequestError('ID invalide')
  }

  const restaurant = service.findOne(id)

  if (!restaurant) {
    throw NotFoundError('Restaurant introuvable')
  }

  return res.status(200).json(restaurant)
}))

/**
 * POST / - Create a new restaurant
 */
RestaurantController.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, michelin_stars, green_stars, dietary_option, city, country, lat, lng } = req.body

  if (!name || !city || !country) {
    throw BadRequestError('Champs requis: name, city, country')
  }

  const createdRestaurant = service.create({
    name,
    michelin_stars: michelin_stars || 0,
    green_stars: green_stars || false,
    dietary_option: dietary_option || null,
    city,
    country,
    lat: lat || 0,
    lng: lng || 0
  })

  return res.status(201).json(createdRestaurant)
}))

/**
 * PATCH /:id - Update a specific restaurant
 */
RestaurantController.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    throw BadRequestError('ID invalide')
  }

  const updatedRestaurant = service.update(req.body, id)

  return res.status(200).json(updatedRestaurant)
}))

/**
 * DELETE /:id - Delete a specific restaurant
 */
RestaurantController.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    throw BadRequestError('ID invalide')
  }

  service.delete(id)

  return res.status(204).send()
}))

export { RestaurantController }
