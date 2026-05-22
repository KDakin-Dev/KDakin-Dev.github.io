# KDakin-Dev.github.io

Portfolio site with playable browser prototypes.

## Playable pages

- `index.html` - main portfolio page.
- `sail_game.html` - Sail & Fire playable isometric 3D WebGL prototype.

## Sail & Fire controls

- W / S - raise or lower sail.
- A / D - rudder.
- Q / E - orbit camera.
- Mouse - aim.
- Left mouse button or Space - broadside fire.
- 1 / 2 / 3 - buy upgrades while docked.
- P - pause.

Use `sail_game.html?debug=1` to show debug rings, AI state, vectors, and runtime counters.

## Sail & Fire current scope

- Isometric OrthographicCamera WebGL scene.
- Procedural low-poly ships, islands, docks, crates, and water.
- Broadside-only cannon fire with visible aim arc feedback.
- Wake trails, floating HP bars, tactical minimap, and island collision.
- Enemy FSM: patrol, chase, attack, retreat.
