# Star Trek: Strange New Worlds - USS Enterprise Game

A 3D space combat game featuring the USS Enterprise NCC-1701 from Star Trek: Strange New Worlds. Built with Three.js and vanilla JavaScript.

![Star Trek Game](https://img.shields.io/badge/Star%20Trek-Strange%20New%20Worlds-blue)

## Features

### Ship Combat
- **3rd Person View** - Follow the Enterprise from behind as you navigate through space
- **Mouse-Based Flight Controls** - Steer the ship by moving your mouse
- **Phaser Banks** - Fire orange phaser beams at enemies (left-click)
- **Photon Torpedoes** - Launch homing cyan torpedoes (right-click)
- **Target Lock System** - Automatically locks onto nearest enemy in your forward arc

### Enemies
- **Klingon Bird of Prey** - Large, slow attack ships with disruptor cannons
- **Romulan Warbirds** - Medium-sized vessels (appear in later waves)

### Ship Systems & Damage
- **Damageable Systems** - Engines, Warp Core, Weapons, Shields, and Sensors can all take damage
- **Performance Degradation** - Damaged systems reduce ship performance
- **Hull Breaches** - Visual damage effects when shields are down
- **Repair System** - Hold R to repair damaged systems (uses energy)

### Crew Voice Lines
Your bridge crew keeps you informed:
- **Spock** - Tactical analysis and damage reports
- **Sulu** - Enemy detection and identification
- **Uhura** - Shield status reports
- **Scotty** - Engineering and system damage warnings
- **Chekov** - Weapons and torpedo reload status

### Missions
- **Border Patrol** - 5 waves, Normal difficulty
- **Rescue Mission** - 7 waves, Hard difficulty
- **Deep Strike** - 10 waves, Expert difficulty
- **Survival Mode** - Endless waves

### Upgrades
Earn credits by destroying enemies and purchase upgrades:
- Reinforced Hull
- Enhanced Shields
- Phaser Overcharge
- Quantum Torpedoes
- Torpedo Bay Expansion
- Impulse Engine Upgrade
- Warp Core Upgrade
- Dilithium Chamber

## Controls

| Key/Input | Action |
|-----------|--------|
| **Mouse** | Steer ship |
| **Left Click** | Fire phasers |
| **Right Click** | Fire torpedoes |
| **W / Arrow Up** | Increase speed |
| **S / Arrow Down** | Decrease speed |
| **Shift** | Engage warp drive |
| **R** | Repair systems (hold) |
| **P** | Toggle autopilot |
| **Scroll Wheel** | Zoom camera |
| **U** | Open upgrades menu |
| **H** | Toggle UI |
| **M** | Toggle sound |
| **Escape** | Close menus |

## How to Play

1. **Open the game** - Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. **Select a mission** - Click on one of the four mission cards on the title screen
3. **Destroy enemies** - Use phasers and torpedoes to destroy Klingon and Romulan ships
4. **Survive waves** - Each wave brings more enemies
5. **Upgrade your ship** - Use earned credits to improve your ship's capabilities
6. **Manage damage** - Repair systems when damaged, watch your hull integrity

## Tips

- **Use autopilot (P)** when you want the ship to automatically track enemies
- **Repair often** - Hold R during lulls in combat to restore systems
- **Watch your torpedoes** - They auto-reload after 30 seconds when empty
- **Shields regenerate** - Stay evasive to let shields recover
- **Target lock** helps phasers and torpedoes hit more accurately

## Technical Details

- **Engine**: Three.js r128
- **Audio**: Web Audio API (procedurally generated sounds)
- **No dependencies**: Runs entirely in the browser
- **No build step**: Just open index.html

## Browser Support

Works best in modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Files

```
StarTrekGame/
├── index.html    # Main HTML file with UI and styles
├── game.js       # Game engine and logic
└── README.md     # This file
```

## License

This is a fan-made project for educational purposes. Star Trek and all related marks are trademarks of Paramount Pictures.

---

*Live long and prosper* 🖖
