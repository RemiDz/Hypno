# 🌌 HYPNO - The Cosmic Consciousness Network

A real-time, multiplayer consciousness visualization app where users exist as shapes in an infinite 3D universe. Connect with souls from around the world, express your intentions and emotions through beautiful geometric forms, and form resonance connections that visualize the invisible threads between kindred spirits.

## ✨ Features

### Core Experience
- **Infinite 3D Universe** - Explore a beautiful cosmic void filled with stars
- **Real-time Multiplayer** - See other connected souls as glowing shapes in space
- **10 Unique Intentions** - Transform your shape based on your current intention:
  - Observer (Orbit/Ring) - Watching, learning, being present
  - Peace (Sphere) - Seeking tranquility and calm
  - Love (Heart) - Radiating and seeking love
  - Clarity (Octahedron) - Pursuing truth and understanding
  - Creativity (Star) - Channeling creative energy
  - Transcendence (Spiral) - Rising beyond the ordinary
  - Transformation (Phoenix) - Embracing change and rebirth
  - Healing (Lotus) - Restoring and nurturing
  - Wisdom (Pyramid) - Seeking deeper knowledge
  - Unity (Infinity) - Connecting all as one

### Emotional Expression
- **10 Emotion Effects** - Add particle effects that overlay your shape:
  - Neutral - Balanced, centered
  - Joyful - Golden sparkles radiating outward
  - Sad - Blue particles falling like rain
  - Anxious - Jittery static particles
  - Hopeful - Green particles rising upward
  - Grateful - Warm expanding glow aura
  - Curious - Particles orbiting your shape
  - Peaceful - Gentle wave ripples
  - Energized - Electric arcs and lightning
  - Contemplative - Soft misty aura

### Connection & Community
- **Nicknames & Notes** - Share your name and a personal message
- **Resonance System** - Click on another soul to connect with them
- **Visual Connection Threads** - See beautiful curved lines with flowing particles between connected souls
- **Mutual Resonance** - When two souls both resonate, the connection becomes stronger and more vibrant

### Technical Features
- **60fps Performance** - Smooth animations throughout
- **Mobile Responsive** - Works beautifully on all devices
- **PWA Ready** - Install as an app on your device
- **Real-time Sync** - Firebase-powered instant updates

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for real-time multiplayer

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/RemiDz/Hypno.git
cd Hypno
```

2. Serve the files with any static file server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve

# Using PHP
php -S localhost:8080
```

3. Open `http://localhost:8080` in your browser

### Deployment

The app is designed to be deployed as static files. Simply upload the contents to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Any web server

## 🎮 Controls

### Desktop
- **Left Click + Drag** - Rotate camera around the scene
- **Right Click + Drag** - Pan through space
- **Scroll Wheel** - Zoom in/out
- **Click on Shape** - Select a soul to view their details
- **WASD Keys** - Move through space (coming soon)

### Mobile
- **Single Finger Drag** - Rotate camera
- **Two Finger Drag** - Pan through space
- **Pinch** - Zoom in/out
- **Tap on Shape** - Select a soul

## 🏗️ Project Structure

```
Hypno/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── styles.css          # Main styles
│   ├── menu.css            # Modal and menu styles
│   └── animations.css      # Keyframe animations
├── js/
│   ├── main.js             # App entry point
│   ├── config.js           # Configuration and constants
│   ├── utils.js            # Utility functions
│   ├── scene.js            # Three.js scene management
│   ├── shapes.js           # Shape geometry generators
│   ├── emotions.js         # Emotion particle systems
│   ├── user.js             # User shape representation
│   ├── connections.js      # Resonance connection system
│   ├── firebase.js         # Firebase sync
│   └── ui.js               # UI management
└── assets/
    └── icons/              # PWA icons
```

## 🔧 Technology Stack

- **Three.js** - 3D rendering, shapes, camera controls
- **Firebase Realtime Database** - Live user sync and presence
- **GSAP** - Smooth animations and transitions
- **Vanilla JavaScript** - ES6 modules, no framework needed
- **CSS3** - Glassmorphism, animations, responsive design

## 🎨 Design Philosophy

HYPNO is designed to create a sense of wonder and connection. The cosmic void represents the infinite space of consciousness, where each soul is a unique point of light. The visual design emphasizes:

- **Minimalism** - Clean, unobtrusive UI that doesn't distract from the experience
- **Beauty** - Every element is crafted to be visually pleasing
- **Connection** - Visual emphasis on the threads that bind us together
- **Presence** - Focus on who is here now, not historical data

## 📱 PWA Features

HYPNO can be installed as a Progressive Web App:

1. Visit the site in a supported browser
2. Click "Add to Home Screen" or the install prompt
3. Access HYPNO directly from your device like a native app

## 🔮 Future Roadmap

- [ ] Audio ambiance and sound effects
- [ ] Private resonance messages
- [ ] Constellation patterns for groups
- [ ] VR/AR support
- [ ] User profiles and persistence
- [ ] Guided meditation modes

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

Created with love for the cosmic web of existence.

*"In the cosmic web of existence, every point of consciousness is connected to every other. Here, we make that truth visible."*

---

🌌 **Begin your journey into the void.** 🌌
