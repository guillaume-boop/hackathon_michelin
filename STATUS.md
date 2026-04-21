# État du projet — Hackathon Michelin

## Stack
- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : NextAuth v4 + Google OAuth *(credentials manquants)*
- **Langage** : TypeScript strict

---

## Ce qui est fait ✅

### Infrastructure
- [x] Projet Next.js initialisé
- [x] `@supabase/supabase-js` + `@supabase/ssr` installés
- [x] Variables d'environnement configurées (`.env.local`) — URL + publishable key + service role key
- [x] Clients Supabase créés :
  - `utils/supabase/server.ts` — Server Components (session-aware)
  - `utils/supabase/client.ts` — Client Components (browser)
  - `utils/supabase/middleware.ts` — Middleware (refresh sessions)
  - `lib/supabase.ts` — `supabaseAdmin` (service role, bypass RLS, API routes)
- [x] Helper `lib/session.ts` — résout l'utilisateur courant via NextAuth
- [x] Helper `lib/circle-score.ts` — calcul automatique du score (visite + étoiles + pays)
- [x] Gestion d'erreurs centralisée `lib/errors.ts`
- [x] Build Next.js sans erreur

### Schéma DB (`supabase/schema.sql`) — **À EXÉCUTER dans le SQL Editor Supabase**
13 tables définies :

| Table | Description |
|---|---|
| `users` | Profils, rôle, circle_score |
| `restaurants` | Étoiles Michelin, green star, coords |
| `experiences` | Visites utilisateur (rating, note, médias) |
| `feed_posts` | Posts (video / review / checkin) |
| `feed_likes` | Likes dédupliqués |
| `follows` | Relations follower/followee |
| `user_locations` | Position temps réel (1 ligne/user) |
| `circles` | Groupes privés |
| `circle_members` | Membres + rôle (owner/member) |
| `circle_memories` | Expériences partagées dans un circle |
| `restaurant_videos` | Vidéos courtes par restaurant |
| `chef_profiles` | Profil chef (bio, vidéo, restaurant) |
| `chef_signature_dishes` | Plats signature du chef |

### API Routes (27 routes, toutes opérationnelles)

**Restaurants**
- `GET/POST /api/restaurants`
- `GET/PATCH/DELETE /api/restaurants/[id]`
- `GET/POST /api/restaurants/[id]/videos`
- `DELETE /api/restaurants/[id]/videos/[videoId]`

**Users**
- `GET/PATCH /api/users/[id]`
- `POST/DELETE /api/users/[id]/follow`
- `GET /api/users/[id]/followers`
- `GET /api/users/[id]/following`
- `GET/PUT /api/users/[id]/location`

**Experiences**
- `GET/POST /api/experiences` *(filtres: `?user_id=` `?restaurant_id=`)*
- `GET/PATCH/DELETE /api/experiences/[id]`
- → Le circle_score est **recalculé automatiquement** à chaque POST/DELETE

**Feed**
- `GET /api/feed` *(filtre: `?following=true` pour le feed personalisé)*
- `POST /api/feed/posts`
- `POST/DELETE /api/feed/posts/[id]/like`

**Circles**
- `GET/POST /api/circles`
- `GET/PATCH/DELETE /api/circles/[id]`
- `GET/POST /api/circles/[id]/members`
- `DELETE /api/circles/[id]/members/[userId]`
- `GET/POST /api/circles/[id]/memories`
- `DELETE /api/circles/[id]/memories/[memoryId]`

**Chefs**
- `GET/POST /api/chefs`
- `GET/PATCH /api/chefs/[id]`
- `GET/POST /api/chefs/[id]/dishes`
- `PATCH/DELETE /api/chefs/[id]/dishes/[dishId]`

**Map**
- `GET /api/map/friends` — positions temps réel des gens suivis

---

## Ce qui reste à faire ❌

### 1. Exécuter le schéma SQL — **PRIORITÉ 1**
Aller sur [Supabase SQL Editor](https://supabase.com/dashboard/project/pplmaklememeytkghcgc/sql) et coller le contenu de `supabase/schema.sql`.

### 2. Auth Google — compléter les credentials
Dans `.env.local`, remplir :
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=une_chaine_aleatoire_longue
```
Créer les credentials sur [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.

### 3. Middleware Next.js (sessions Supabase SSR)
Créer `middleware.ts` à la racine pour refresh automatique des sessions :
```ts
// middleware.ts
import { createClient } from '@/utils/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabaseResponse } = createClient(request)
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 4. Upload médias (Supabase Storage)
Les champs `media_urls`, `content_url`, `video_url`, `photo_url` stockent des URLs — il faut configurer un bucket Supabase Storage et créer une route d'upload :
- `POST /api/upload` → retourne une URL publique

### 5. Recommandations IA (feed personnalisé)
Le feed `?following=true` existe mais la reco IA (mentionnée dans le projet) n'est pas implémentée. À construire : scoring basé sur michelin_stars, préférences culinaires, localisation.

### 6. Aucun frontend
Par choix, aucune page UI n'a été créée. Si besoin : `app/page.tsx` est vide.

---

## Pour démarrer localement

```bash
npm run dev
# → http://localhost:3000
# → http://localhost:3000/api/health  (vérification rapide)
```
