import type { NextFunction, Request, Response } from 'express'
import type { ApiException } from '../../types/Exception.ts'
import { ServerError } from '../utils/Exception.ts'

/**
 * Middleware global de gestion des erreurs
 * Capture toutes les erreurs et les retourne en JSON structuré
 *
 * @param err - L'erreur capturée
 * @param req - La requête initiale
 * @param res - L'objet de réponse
 * @param next - Passer au middleware suivant
 *
 * @see https://expressjs.com/en/guide/error-handling.html
 */
export const ExceptionsHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Si les headers ont déjà été envoyés, passer l'erreur à Express
  if (res.headersSent) {
    return next(err)
  }

  // Si c'est une ApiException (notre format d'erreur)
  if (err.code && err.status) {
    const apiError: ApiException = {
      code: err.code,
      message: err.message,
      status: err.status
    }
    return res.status(err.status).json(apiError)
  }

  // Erreurs Express / Node.js non gérées
  console.error('Erreur non gérée:', err)
  const serverError = ServerError('Une erreur interne s\'est produite')
  return res.status(serverError.status).json(serverError)
}