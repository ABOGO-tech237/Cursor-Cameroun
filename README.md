# 🇨🇲 Cursor Cameroun — Site Officiel

Plateforme communautaire officielle de Cursor Cameroun





## Table des matières

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Charte graphique](#charte-graphique)
- [Fonctionnalités](#fonctionnalités)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Conformité CDC](#conformité-cdc)
- [Aperçus visuels](#aperçus-visuels)
- [Contribution](#contribution)
- [Auteur](#auteur)

---

## Aperçu

**Cursor Cameroun** est la communauté officielle des développeurs camerounais utilisant [Cursor](https://cursor.sh/) — l'éditeur de code assisté par IA. Ce site centralise les événements, la galerie de projets, la roadmap communautaire et les ressources pour rejoindre la communauté.

> Projet né lors du **Mini Hackathon #1** de Cursor Cameroun.

---

## Stack technique

| Technologie | Version | Usage |
| --- | --- | --- |
| **Next.js** (App Router) | 16.2.5 | Framework fullstack |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 4.x | Styling utilitaire |
| **next-intl** | 4.x | Internationalisation FR/EN |
| **Framer Motion** | 12.x | Animations |
| **React Leaflet** | 5.x | Carte interactive Cameroun |
| **React Hook Form** + **Zod** | — | Formulaires et validation |
| **Resend** | — | Envoi d'emails transactionnels |

---

## Charte graphique

La palette est **Noir / Blanc / Gris uniquement**, conforme au cahier des charges officiel.

Les tokens CSS sont définis dans [src/app/globals.css](src/app/globals.css).

- Thème **sombre par défaut**
- Thème clair disponible via le sélecteur intégré

---

## Fonctionnalités

- [x] Pages principales : Home, Events, Gallery, Roadmap, Community
- [x] Navigation responsive avec CTA, sélecteur de langue et de thème
- [x] Internationalisation FR / EN (`next-intl`, messages centralisés)
- [x] Galerie avec filtre événement/date, lightbox et lazy-loading
- [x] Carte Cameroun interactive (Leaflet)
- [x] Gestion d'états d'événements : `upcoming`, `ongoing`, `past`
- [x] SEO : sitemap dynamique + robots.txt
- [x] Metadata optimisée sur toutes les pages principales
- [x] Intégration des liens officiels (WhatsApp / GitHub org / LinkedIn)
- [x] Migration images WebP/AVIF (en cours sur certaines sources)
- [x] Carte Cameroun — enrichissement "10 régions" à finaliser

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/cursor-cameroun/cursor-cameroun.git
cd cursor-cameroun

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

### Commandes disponibles

```bash
npm run dev      # Serveur de développement (hot reload)
npm run build    # Build de production
npm run start    # Lancer le build de production
npm run lint     # Vérification du code (ESLint)
npm test         # Tests unitaires (schéma, échappement, débit, envoi)
```

---

## Variables d'environnement

Copier `.env.example` en `.env`. Le fichier `.env` ne se commite pas. `.env.example` ne contient aucune valeur réelle.

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | Clé API [Resend](https://resend.com). Vide : l'envoi est simulé **uniquement** avec `npm run dev`. En production, l'absence de clé répond `503`. |
| `RESEND_FROM` | Expéditeur vérifié chez Resend, par exemple `Cursor Cameroun <contact@example.com>`. Obligatoire dès qu'une clé est définie. Remplace l'ancien expéditeur codé en dur. |
| `CONTACT_EMAIL` | Destinataire des messages du formulaire. Le `replyTo` reste l'adresse de la personne qui écrit. |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site, utilisée par le sitemap et `robots.txt`. |
| `AUTH_SECRET` | Secret de signature des sessions admin (`src/lib/auth.ts`). |
| `ADMIN_PASSWORD` | Mot de passe du tableau de bord. Sert aussi de repli si `AUTH_SECRET` est vide. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé site Cloudflare Turnstile (widget **Invisible**). |
| `TURNSTILE_SECRET_KEY` | Secret serveur Turnstile. La vérification n'est active que si **les deux** clés sont définies. Une seule des deux est une erreur de configuration (`503`). |
| `DATABASE_URL` | Postgres des événements. Le formulaire de contact ne s'en sert pas, mais le client est importé au démarrage : sans cette variable, `next build` s'arrête. |

### Formulaire de contact

`POST /api/send` valide les champs avec le schéma Zod partagé (`src/lib/schemas/contact.ts`), échappe le HTML du mail, et applique une garde réutilisable (`src/lib/security/form-guard.ts`) : honeypot, limite de débit, Turnstile.

La limite est de **5 envois / 10 minutes / adresse IP / instance**, en mémoire. En serverless (Vercel), chaque instance a son propre compteur : la limite repart à zéro au cold start et n'est pas globale. Le proxy (`src/proxy.ts`) exclut `/api` et ne porte pas ce compteur. Un store partagé (Postgres) serait nécessaire pour une limite ferme entre instances.

Le widget Turnstile doit être créé en mode Invisible dans Cloudflare. La page `/privacy` renvoie vers l'addendum Turnstile, exigé pour ce mode. Elle contient des mentions **À confirmer** (responsable du traitement, durée de conservation, contact pour la suppression) à valider avant mise en production.

---

## Structure du projet

```text
cursor-cameroun/
├── src/
│   ├── app/              # Routes App Router (layouts, pages, API)
│   ├── components/       # Composants réutilisables
│   ├── data/             # Données statiques (events, links…)
│   └── lib/              # Schémas, e-mail, garde anti-spam, auth
├── messages/             # Traductions FR / EN
├── public/               # Assets statiques (images, brand, gallery)
├── scripts/              # Scripts utilitaires
├── AGENT.md              # Règles d'usage Cursor (hackathon)
├── .cursorrules          # Règles projet Cursor AI
└── next.config.ts        # Configuration Next.js
```

---

## Conformité CDC

Conformité au Cahier des Charges officiel (v2.0) :

| Exigence | Statut |
| --- | --- |
| Pages obligatoires (Home, Events, Gallery, Roadmap, Community) | ✅ |
| Navigation responsive + CTA rejoindre | ✅ |
| i18n FR/EN | ✅ |
| Thème sombre par défaut + thème clair | ✅ |
| Sitemap + robots.txt | ✅ |
| Metadata SEO sur les pages principales | ✅ |
| Lazy-loading images | ✅ |
| Migration WebP/AVIF (toutes sources) | 🔄 |
| Carte Cameroun interactive | ✅ |
| Enrichissement carte (10 régions) | 🔄 |

---

## Aperçus visuels

### Édition du AGENT.md avec Cursor

![Agent MD](public/gallery/AGENT.png)

### Session de mise à jour du README

![README](public/gallery/README.png)

### Session de travail collaboratif

![Session de Travail](public/gallery/WORK.png)

---

## Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le dépôt
2. Créer une branche : `git checkout -b feat/ma-feature`
3. Committer les changements : `git commit -m "feat: description de la feature"`
4. Pousser la branche : `git push origin feat/ma-feature`
5. Ouvrir une **Pull Request** vers `main`

Merci de respecter la convention de commit [Conventional Commits](https://www.conventionalcommits.org/).

---

## Auteur

**Azangue Leonel** — Contributeur principal

[![GitHub](https://img.shields.io/badge/GitHub-Delmat237-181717?style=flat-square&logo=github)](https://github.com/Delmat237)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-leonel--azangue-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/leonel-azangue)
[![Email](https://img.shields.io/badge/Email-azangueleonel9@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:azangueleonel9@gmail.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-%2B237%2069%20477%203472-25D366?style=flat-square&logo=whatsapp)](https://wa.me/237694773472)

---

Fait avec ❤️ au Cameroun · Propulsé par [Cursor](https://cursor.sh/) & [Next.js](https://nextjs.org/)
