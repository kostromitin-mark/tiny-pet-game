# Tiny Pet Game

Tiny Pet Game is a browser-based mini game built with React, TypeScript, and Vite.

The player takes care of a pet by feeding it, playing with it, putting it to sleep, earning XP, discovering dreams, and viewing a history of events.

The project includes animations, localStorage persistence, random events, Pet Mood Journal, Dream Album, and deployment with Vercel.

## Live Demo

[Play Tiny Pet Game](https://tiny-pet-game.vercel.app/)

## Main Features

- Three pet stats: hunger, energy, and happiness
- Feed, Play, and Sleep actions
- XP progression and pet levels
- Random events that affect the pet's stats
- Gentle time-based stat changes, including while the game is closed
- Daily care streak and daily XP rewards
- Pet Mood Journal with recent activity history
- Random Pet Dreams after sleeping
- Dream Album for discovered dreams
- Animated pet reactions and action feedback
- Pet name, type, color, and accessory customization
- Persistent progress using `localStorage`
- Responsive layout for desktop and mobile

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Browser `localStorage`
- Vercel

The project has no backend and does not use external APIs.

## Run Locally

You need a recent version of Node.js installed.

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL shown in the terminal.

## Build for Production

Create an optimized production build:

```bash
npm run build
```

You can preview the production build locally with:

```bash
npm run preview
```

## Technical Implementation

The project includes:

- React state-based UI
- TypeScript data models for pet stats, progression, customization, journal entries, and dreams
- Persistent browser state using `localStorage`
- Time-based stat changes, including offline progress
- XP, levels, streaks, rewards, and random events
- CSS animations and responsive layout
- `prefers-reduced-motion` support
- Vite production build
- Vercel deployment
