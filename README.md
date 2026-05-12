# 🏏 IPL Playoff Predictor 2026

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

An advanced, highly interactive, and visually stunning **Real-Time IPL Analytics Platform**. Built with Next.js 16 and Tailwind CSS v4, this platform offers real-time live data syncing, a multi-match simulator with precise NRR tracking, dynamic probability analytics, and an AI-driven Head-to-Head prediction engine.

---

## ✨ Core Features

### 🔴 Real-Time Live Sync & Intelligent API Failover
The entire application is wired up to live, real-world data using the CricAPI.
- **Failover Architecture:** Implements a robust load-balancing array of multiple API keys. If one hits a rate limit, the system silently falls back to the next, guaranteeing 100% uptime.
- **Auto-Completion:** When a match finishes in the real world, it automatically moves from `upcoming` to `completed`.
- **Weather & Rain Support:** The backend intelligently detects "No Result" or abandoned matches, automatically distributing +1 point to both teams while leaving NRR untouched.
- **Dynamic Standings:** The system automatically calculates the winner/loser, assigns `+2` points, calculates wins/losses, and re-sorts the entire Global Points Table instantly.

### 🎲 Monte Carlo Probability Engine
A massive upgrade from static probabilities, the system now runs heavy compute on the backend to forecast the future:
- **10,000 Iterations:** The engine runs a Monte Carlo simulation through the remaining schedule 10,000 times to calculate the precise mathematical odds of each team reaching the Top 4.
- **Live Probabilities:** As real matches complete, the qualification odds update instantly to reflect the new mathematical reality.

### 🤖 AI Head-to-Head Prediction Engine
Deep analytics for upcoming fixtures going beyond just "who has more points":
- **Dynamic Form Adjustment:** Analyzes the exact Win/Loss record of the last 5 games to apply momentum buffs/nerfs.
- **Reality Checks:** Evaluates Venue advantage, Toss impact, and historical Head-to-Head win rates to give a precise percentage-based prediction of who will win tonight's match.

### 🎮 Advanced Multi-Match Simulator
An interactive "What-If" engine that lets you play out the rest of the 2026 season:
- **Accumulation Engine:** Simulate multiple fixtures in a row to see the long-term compounding effects on the Points Table.
- **Precise NRR Calculation:** Choose victory conditions (*"By Runs"* or *"By Wickets"*) and input the exact margin. The simulator uses a real-world proxy formula to dynamically estimate and update the NRR for both teams!
- **Fluid UI:** The Points Table physically reshuffles using Framer Motion layout animations, displaying `TrendingUp` 📈 and `TrendingDown` 📉 indicators as teams climb or fall based on your predictions.

### 💎 Premium Glassmorphism UI
Built with a state-of-the-art "Glassmorphism" design system:
- **Unified Theming:** Custom dark mode with `.glass-card` elements, frosted glass blurs, and neon glowing orbs.
- **Micro-Interactions:** Buttons, rows, and cards scale and pulse gracefully via `framer-motion`.

---

## 🚀 Tech Stack

- **Framework:** Next.js 16.2.4 (App Router, Server API Routes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (PostCSS)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Data Source:** CricAPI (Real-Time Live Cricket Data)

---

## 🛠️ Getting Started

### Prerequisites
Ensure you have Node.js (v20+) installed.

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd ipl-predictor
npm install
```

### 2. Configure API Keys
The application runs perfectly in "Mock Mode" without an API key, but to unlock real-time live fetching, you must configure your CricAPI key. You can provide multiple keys comma-separated in the code for the failover array, but a single key is enough to start:

1. Create a `.env.local` file in the root of the project.
2. Add your key:
```env
NEXT_PUBLIC_CRICAPI_KEY=your_api_key_here
```

### 3. Start the Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

> **Note:** The application utilizes Next.js App Router. If you encounter any Tailwind v4 CSS caching issues during development, simply restart the dev server.

---

## 📁 Project Architecture

- `/src/app`: Contains the main frontend pages (`/analytics`, `/matches`, `/simulator`, `/head-to-head`).
- `/src/app/api`: Server-side API routes handling caching, data mapping, and heavy computations (Monte Carlo).
- `/src/services`: Utility services including `probability.ts` (AI Engine) and `api.ts` (Frontend Fetcher).
- `/src/data/mockData.ts`: The fallback schema containing team metadata, historical data, and the core source of truth.
- `/src/app/globals.css`: Contains the Tailwind v4 custom `@theme` engine and glassmorphism utility classes.

---

## 📄 License
This project is licensed under the MIT License.
