# Tiny Pet Game

Tiny Pet Game is a cozy browser game where you take care of a customizable
virtual pet. Feed it, play together, help it rest, discover dreams, and build
a daily care streak.

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

## What I Learned

While building Tiny Pet Game, I practiced:

- Managing several related pieces of state with React hooks
- Creating reusable update functions with TypeScript
- Saving and validating game data in `localStorage`
- Calculating offline progress from timestamps
- Building XP, levels, streaks, rewards, and random events
- Creating UI animations with CSS keyframes and transitions
- Supporting `prefers-reduced-motion` for accessibility
- Designing a responsive interface without a UI library
- Preparing and deploying a Vite application with Vercel

This project helped me understand how small systems can work together to make
a simple interface feel like a complete game.
