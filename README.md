# Tiny Pet Game

A small browser game built with React, TypeScript, and Vite. Feed your pet,
play together, and let it sleep while keeping an eye on hunger, energy, and
happiness.

## Features

- Three pet stats from 0 to 100
- Feed, Play, and Sleep actions
- Four facial expressions based on the pet's current condition
- Custom pet name
- Pet type, color, and accessory customization
- XP levels with progress to the next level
- Small random events that can affect pet stats
- Gentle stat changes over time, including while the game is closed
- Daily care streaks and one XP reward per day
- A local mood journal with recent care, reward, and event history
- Automatic saving in `localStorage`
- Reset button
- Responsive design for desktop and mobile

## Run locally

You need Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local address shown by Vite in your browser.

## Production build

```bash
npm run build
npm run preview
```

## Live Demo

https://tiny-pet-game.vercel.app/
