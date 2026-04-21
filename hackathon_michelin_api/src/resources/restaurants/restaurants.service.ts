import type { Restaurant } from '../../../types/Restaurant'
import { restaurants as initialRestaurants } from '../../data'
import { NotFoundError, BadRequestError } from '../../utils/Exception'

export class RestaurantService {
  /**
   * Copie locale des restaurants pour pouvoir modifier, supprimer etc
   */
  private restaurants: Restaurant[] = structuredClone(initialRestaurants)

  /**
   * Trouve tous les restaurants
   */
  findAll(): Restaurant[] {
    return this.restaurants
  }

  /**
   * Trouve un restaurant en particulier par ID
   * @param id - ID unique du restaurant
   */
  findOne(id: string): Restaurant | undefined {
    return this.restaurants.find(restaurant => restaurant.id === id)
  }

  /**
   * Crée un nouveau restaurant
   * @param restaurantData - Données du restaurant (sans l'id)
   */
  create(restaurantData: Omit<Restaurant, 'id' | 'created_at'>): Restaurant {
    const newRestaurant: Restaurant = {
      ...restaurantData,
      id: `rest_${Date.now()}`,
      created_at: new Date().toISOString()
    }

    this.restaurants.push(newRestaurant)
    return newRestaurant
  }

  /**
   * Met à jour un restaurant en particulier
   * @param restaurantData - Données partielles du restaurant à mettre à jour
   * @param id - ID unique du restaurant
   */
  update(restaurantData: Partial<Omit<Restaurant, 'id' | 'created_at'>>, id: string): Restaurant {
    const index = this.restaurants.findIndex(restaurant => restaurant.id === id)

    if (index === -1) {
      throw NotFoundError('Restaurant introuvable')
    }

    this.restaurants[index] = { ...this.restaurants[index], ...restaurantData }
    return this.restaurants[index]
  }

  /**
   * Supprime un restaurant
   * @param id - ID unique du restaurant
   */
  delete(id: string): void {
    const index = this.restaurants.findIndex(restaurant => restaurant.id === id)

    if (index === -1) {
      throw NotFoundError('Restaurant introuvable')
    }

    this.restaurants.splice(index, 1)
  }
}
