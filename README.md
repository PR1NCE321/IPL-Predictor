# 🏏 IPL Playoff Predictor 2026

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

An advanced, highly interactive, and visually stunning **Real-Time IPL Analytics Platform**. Built with Next.js 16 and Tailwind CSS v4, this platform offers real-time live data syncing, a multi-match simulator with precise NRR tracking, and dynamic probability analytics.

---

## ✨ Core Features

### 🔴 Real-Time API Integration (CricAPI)
The entire application is wired up to live, real-world data using the CricAPI.
- **Auto-Completion:** When a match finishes in the real world, it automatically moves from `upcoming` to `completed`.
- **Dynamic Standings:** The system automatically calculates the winner/loser, assigns `+2` points, calculates wins/losses, and re-sorts the entire Global Points Table instantly.
- **Live Probabilities:** Upon match completion, the winner automatically gains `+8%` qualification probability, while the loser drops by `-8%`.

### 🧠 Smart Caching Engine
To protect your free API limits (100 hits/day), the app features a sophisticated dual-layer caching system:
1. **Memory Cache:** Enables lightning-fast navigation between pages with zero API hits.
2. **LocalStorage Cache:** Persists across hard browser refreshes.
3. **Auto-Expiration:** Data lives for exactly **60 minutes** before automatically purging itself to fetch the latest real-time scores again.

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

- **Framework:** Next.js 16.2.4 (App Router, Turbopack)
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

### 2. Configure API Key
The application runs perfectly in "Mock Mode" without an API key, but to unlock real-time live fetching, you must configure your CricAPI key:

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

> **Note:** The application utilizes Next.js App Router and Turbopack. If you encounter any Tailwind v4 CSS caching issues during development, simply restart the dev server.

---

## 📁 Project Architecture

- `/src/app`: Contains the 4 main pages (`/analytics`, `/matches`, `/simulator`, `/teams`).
- `/src/services/api.ts`: The central nervous system for data fetching, caching, and local-data merging.
- `/src/data/mockData.ts`: The fallback schema containing team metadata, historical probability data, and fallback schedules.
- `/src/app/globals.css`: Contains the Tailwind v4 custom `@theme` engine and glassmorphism utility classes.

---

## 📄 License
This project is licensed under the MIT License.
