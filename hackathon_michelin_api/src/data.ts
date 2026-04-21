import type { Restaurant } from '../types/Restaurant.ts'
import type { User } from '../types/User.ts'
import type { ChefProfile } from '../types/ChefProfile.ts'
import type { ChefSignatureDish } from '../types/ChefSignatureDish.ts'
import type { Circle } from '../types/Circle.ts'
import type { CircleMember } from '../types/CircleMember.ts'
import type { CircleMemory } from '../types/CircleMemory.ts'
import type { Experience } from '../types/Experience.ts'
import type { FeedPost } from '../types/FeedPost.ts'
import type { Follow } from '../types/Follow.ts'
import type { UserLocation } from '../types/UserLocation.ts'
import type { RestaurantVideo } from '../types/RestaurantVideo.ts'

// ========== RESTAURANTS ==========
export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Le Bernardin',
    michelin_stars: 3,
    green_stars: true,
    dietary_option: 'vegan',
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'La Maison de la Truffade',
    michelin_stars: 2,
    green_stars: false,
    dietary_option: 'veggie',
    city: 'Lyon',
    country: 'France',
    lat: 45.7640,
    lng: 4.8357,
    created_at: '2024-02-20T14:45:00Z'
  },
  {
    id: '3',
    name: 'Chez Pierre',
    michelin_stars: 1,
    green_stars: true,
    dietary_option: null,
    city: 'Marseille',
    country: 'France',
    lat: 43.2965,
    lng: 5.3698,
    created_at: '2024-03-10T09:15:00Z'
  }
]

// ========== USERS ==========
export const users: User[] = [
  {
    id: 'user_1',
    username: 'foodlover_paris',
    email: 'foodlover@paris.fr',
    avatar_url: 'https://api.example.com/avatars/user_1.jpg',
    role: 'user',
    circle_score: 250,
    created_at: '2023-06-15T10:00:00Z'
  },
  {
    id: 'user_2',
    username: 'jean_chef',
    email: 'jean@chef.fr',
    avatar_url: 'https://api.example.com/avatars/user_2.jpg',
    role: 'chef',
    circle_score: 500,
    created_at: '2023-05-20T14:30:00Z'
  },
  {
    id: 'user_3',
    username: 'admin_michelin',
    email: 'admin@michelin.fr',
    avatar_url: null,
    role: 'admin',
    circle_score: 1000,
    created_at: '2023-01-01T00:00:00Z'
  }
]

// ========== CHEF PROFILES ==========
export const chefProfiles: ChefProfile[] = [
  {
    id: 'chef_1',
    user_id: 'user_2',
    restaurant_id: '1',
    bio: 'Chef de cuisine français avec 20 ans d\'expérience',
    video_url: 'https://youtube.com/watch?v=chef_video_1',
    created_at: '2023-05-20T14:30:00Z'
  },
  {
    id: 'chef_2',
    user_id: 'user_4',
    restaurant_id: '2',
    bio: 'Créateur de la cuisine moderne française',
    video_url: null,
    created_at: '2023-07-10T11:15:00Z'
  }
]

// ========== CHEF SIGNATURE DISHES ==========
export const chefSignatureDishes: ChefSignatureDish[] = [
  {
    id: 'dish_1',
    chef_profile_id: 'chef_1',
    name: 'Turbot rôti à la sauce champagne',
    description: 'Turbot sauvage avec réduction de champagne',
    photo_url: 'https://api.example.com/dishes/dish_1.jpg',
    order: 1
  },
  {
    id: 'dish_2',
    chef_profile_id: 'chef_1',
    name: 'Homard bleu breton',
    description: null,
    photo_url: 'https://api.example.com/dishes/dish_2.jpg',
    order: 2
  }
]

// ========== CIRCLES ==========
export const circles: Circle[] = [
  {
    id: 'circle_1',
    name: 'Les Gourmands de Paris',
    owner_id: 'user_1',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'circle_2',
    name: 'Michelin Enthusiasts',
    owner_id: 'user_2',
    created_at: '2024-01-10T15:30:00Z'
  }
]

// ========== CIRCLE MEMBERS ==========
export const circleMembers: CircleMember[] = [
  {
    circle_id: 'circle_1',
    user_id: 'user_1',
    role: 'owner'
  },
  {
    circle_id: 'circle_1',
    user_id: 'user_2',
    role: 'member'
  },
  {
    circle_id: 'circle_2',
    user_id: 'user_2',
    role: 'owner'
  }
]

// ========== CIRCLE MEMORIES ==========
export const circleMemories: CircleMemory[] = [
  {
    id: 'memory_1',
    circle_id: 'circle_1',
    experience_id: 'exp_1',
    added_at: '2024-02-15T10:00:00Z'
  },
  {
    id: 'memory_2',
    circle_id: 'circle_1',
    experience_id: 'exp_2',
    added_at: '2024-02-20T14:00:00Z'
  }
]

// ========== EXPERIENCES ==========
export const experiences: Experience[] = [
  {
    id: 'exp_1',
    user_id: 'user_1',
    restaurant_id: '1',
    rating: 5,
    note: 'Magnifique expérience culinaire!',
    media_urls: ['https://api.example.com/media/exp1_1.jpg', 'https://api.example.com/media/exp1_2.jpg'],
    visited_at: '2024-02-10T19:30:00Z'
  },
  {
    id: 'exp_2',
    user_id: 'user_2',
    restaurant_id: '2',
    rating: 4,
    note: null,
    media_urls: [],
    visited_at: '2024-02-15T20:00:00Z'
  },
  {
    id: 'exp_3',
    user_id: 'user_1',
    restaurant_id: '3',
    rating: 3,
    note: 'Bon mais peut mieux faire',
    media_urls: ['https://api.example.com/media/exp3_1.jpg'],
    visited_at: '2024-03-01T12:30:00Z'
  }
]

// ========== FEED POSTS ==========
export const feedPosts: FeedPost[] = [
  {
    id: 'post_1',
    user_id: 'user_1',
    restaurant_id: '1',
    type: 'review',
    content_url: 'https://api.example.com/reviews/post_1.jpg',
    likes_count: 42,
    created_at: '2024-02-10T19:30:00Z'
  },
  {
    id: 'post_2',
    user_id: 'user_2',
    restaurant_id: '2',
    type: 'video',
    content_url: 'https://youtube.com/watch?v=food_video',
    likes_count: 156,
    created_at: '2024-02-15T20:00:00Z'
  },
  {
    id: 'post_3',
    user_id: 'user_1',
    restaurant_id: '3',
    type: 'checkin',
    content_url: null,
    likes_count: 8,
    created_at: '2024-03-01T12:30:00Z'
  }
]

// ========== FOLLOWS ==========
export const follows: Follow[] = [
  {
    follower_id: 'user_1',
    followee_id: 'user_2',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    follower_id: 'user_2',
    followee_id: 'user_1',
    created_at: '2024-01-20T15:00:00Z'
  },
  {
    follower_id: 'user_1',
    followee_id: 'user_3',
    created_at: '2024-02-01T12:00:00Z'
  }
]

// ========== USER LOCATIONS ==========
export const userLocations: UserLocation[] = [
  {
    user_id: 'user_1',
    lat: 48.8566,
    lng: 2.3522,
    updated_at: '2024-03-20T10:15:00Z'
  },
  {
    user_id: 'user_2',
    lat: 45.7640,
    lng: 4.8357,
    updated_at: '2024-03-20T09:30:00Z'
  }
]

// ========== RESTAURANT VIDEOS ==========
export const restaurantVideos: RestaurantVideo[] = [
  {
    id: 'video_1',
    restaurant_id: '1',
    url: 'https://youtube.com/watch?v=restaurant1_video',
    title: 'Visite du restaurant Le Bernardin',
    order: 1,
    created_at: '2024-02-01T10:00:00Z'
  },
  {
    id: 'video_2',
    restaurant_id: '1',
    url: 'https://youtube.com/watch?v=restaurant1_video2',
    title: null,
    order: 2,
    created_at: '2024-02-05T14:00:00Z'
  },
  {
    id: 'video_3',
    restaurant_id: '2',
    url: 'https://youtube.com/watch?v=restaurant2_video',
    title: 'Préparation du plat signature',
    order: 1,
    created_at: '2024-02-10T11:00:00Z'
  }
]
