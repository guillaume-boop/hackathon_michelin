#  Michelin Guide — Application de découverte culinaire

##  Objectif du projet

Notre projet vise à moderniser l’expérience du :contentReference[oaicite:0]{index=0} en l’adaptant aux usages actuels des jeunes (18–35 ans).

Aujourd’hui, la découverte de restaurants ne passe plus par la recherche, mais par le **scroll et la recommandation sociale**.

Notre solution transforme Michelin :
- d’un outil de recherche
- en une expérience de découverte immersive, sociale et mobile-first

---




##  Positionnement : Mobile First

Nous avons fait le choix du **mobile-first** car :

- les usages (TikTok, Instagram, WhatsApp) sont mobiles
- notre UX repose sur le scroll vertical et la vidéo
- la découverte food se fait principalement sur smartphone

> Le desktop n’a pas été priorisé pour ce MVP, mais l’architecture permet une adaptation future.

> 👉 [Accéder à l’application Michelin Swipe](https://hackathon-michelin.vercel.app/)

---

##  Fonctionnalités principales

### 1. Feed vidéo immersif
- scroll vertical infini (type TikTok)
- découverte de restaurants via vidéos courtes
- interaction rapide : like, save, share

 remplace la recherche classique

---

### 2. Recherche avancée
Filtres disponibles :
-  étoiles Michelin
-  budget
-  localisation

👉 permet une recherche rapide et ciblée

---

### 3. Communauté
- système de follow (utilisateurs & chefs)
- visibilité des abonnés / abonnements
- découverte sociale

---

### 4. Authentification
- obligatoire pour interagir
- gestion des :
  - likes
  - favoris
  - avis
  - profil

---

### 5. Page restaurant
Contenu :
- chef associé
- points forts
- plats proposés
- avis utilisateurs
- bouton “Réserver” (redirige vers site externe)

---

### 6. Profil utilisateur
- informations personnelles
- restaurants likés / enregistrés
- score basé sur l’activité

---

### 7. Carte interactive
- visualisation des restaurants
- boutons :
  - voir restaurant
  - laisser un avis

---

### 8. Système d’avis
- notation jusqu’à 3 étoiles Michelin
- ajout de :
  - photo
  - commentaire

---

##  Vision produit

> “On ne cherche plus un restaurant, on tombe dessus.”

Notre application repose sur 3 piliers :
- **Découverte** (scroll & vidéo)
- **Social** (communauté & partage)
- **Décision** (avis, carte, réservation)

---

##  Stack technique

### Frontend & Backend
- Next.js (fullstack)

### Authentification
- NextAuth

### Base de données
- Supabase

### Styling
- Tailwind CSS

### Hébergement
- Vercel

👉 Cette stack nous permet un développement rapide, scalable et adapté à un MVP.

---

## 🧪 Démo conseillée

1. Connexion utilisateur
2. Scroll du feed vidéo
3. Accès à une fiche restaurant
4. Ajout d’un like / save
5. Consultation de la map
6. Ajout d’un avis

---

##  Différenciation

| Approche classique | Notre approche |
|------------------|--------------|
| Recherche | Découverte |
| Texte | Vidéo |
| Individuel | Social |
| Statique | Dynamique |

---

## 🚀 Perspectives

- ajout d’une IA de recommandation
- intégration WhatsApp (assistant conversationnel)
- système de réservation intégré
- version desktop

---

##  Conclusion

Notre projet propose une nouvelle manière de découvrir la gastronomie :

👉 plus immersive  
👉 plus sociale  
👉 plus adaptée aux usages modernes  

Avec une base technique solide et une vision produit claire.