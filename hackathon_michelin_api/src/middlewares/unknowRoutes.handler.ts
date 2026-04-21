import type { Request, Response } from 'express'
import { NotFoundError } from '../utils/Exception.ts'

/**
 * Middleware pour les routes inconnues
 * Retourne une erreur 404
 */
export const UnknownRoutesHandler = (req: Request, res: Response) => {
  const error = NotFoundError(`La route ${req.method} ${req.originalUrl} n'existe pas`)
  res.status(error.status).json(error)
}