(function () {
    'use strict';

    var canvas = document.getElementById('sail-canvas');
    if (!canvas) {
        return;
    }

    var ctx = canvas.getContext('2d', { alpha: false });
    var hud = {
        hp: document.querySelector('[data-hud="hp"]'),
        sail: document.querySelector('[data-hud="sail"]'),
        wind: document.querySelector('[data-hud="wind"]'),
        cargo: document.querySelector('[data-hud="cargo"]'),
        gold: document.querySelector('[data-hud="gold"]'),
        enemies: document.querySelector('[data-hud="enemies"]'),
        message: document.querySelector('[data-sail-message]'),
        pauseCard: document.querySelector('[data-sail-pause-card]'),
        pauseButton: document.querySelector('[data-sail-pause]'),
        resetButton: document.querySelector('[data-sail-reset]')
    };

    var TAU = Math.PI * 2;
    var FIXED_DT = 1 / 60;
    var PROJECTILE_SPEED = 250;
    var PROJECTILE_LIFE = 1.85;
    var PLAYER_RADIUS = 20;
    var ENEMY_RADIUS = 20;
    var ISLAND_DOCK_RADIUS = 104;
    var MAX_PROJECTILES = 80;
    var MAX_PARTICLES = 180;
    var DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function wrapAngle(angle) {
        while (angle > Math.PI) {
            angle -= TAU;
        }
        while (angle < -Math.PI) {
            angle += TAU;
        }
        return angle;
    }

    function dist(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function length(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    function pad(value, count) {
        return String(Math.max(0, Math.floor(value))).padStart(count, '0');
    }

    function makeRng(seed) {
        var value = seed >>> 0;
        return function () {
            value += 0x6D2B79F5;
            var t = value;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function seedFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var raw = params.get('seed') || '42';
        var numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            return numeric >>> 0;
        }
        var hash = 2166136261;
        for (var i = 0; i < raw.length; i += 1) {
            hash ^= raw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function randRange(rng, min, max) {
        return min + (max - min) * rng();
    }

    function angleName(angle) {
        var names = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
        var normalized = (angle % TAU + TAU) % TAU;
        var index = Math.round(normalized / (TAU / 8)) % 8;
        return names[index];
    }

    function makeShip(x, y, heading, isPlayer) {
        return {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            heading: heading,
            sail: isPlayer ? 0.55 : 0.78,
            hp: isPlayer ? 100 : 72,
            maxHp: isPlayer ? 100 : 72,
            fireCooldown: 0,
            hitFlash: 0,
            sinkTimer: 0,
            isPlayer: isPlayer,
            aiTimer: 0,
            aiState: 'patrol',
            targetX: x,
            targetY: y,
            gold: 0,
            cargo: 0,
            kills: 0
        };
    }

    function makeInitialState() {
        var seed = seedFromUrl();
        var rng = makeRng(seed);
        var islands = [];
        islands.push({ x: 0, y: 0, r: 74, dock: true, name: 'Harbor' });
        for (var i = 0; i < 5; i += 1) {
            var angle = randRange(rng, 0, TAU);
            var radius = randRange(rng, 360, 880);
            islands.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                r: randRange(rng, 42, 86),
                dock: i % 2 === 0,
                name: 'Island ' + (i + 1)
            });
        }

        var enemies = [];
        for (var e = 0; e < 4; e += 1) {
            var enemyAngle = randRange(rng, 0, TAU);
            var enemyRadius = randRange(rng, 450, 920);
            enemies.push(makeShip(Math.cos(enemyAngle) * enemyRadius, Math.sin(enemyAngle) * enemyRadius, randRange(rng, 0, TAU), false));
        }

        return {
            seed: seed,
            rng: rng,
            time: 0,
            running: true,
            paused: false,
            gameOver: false,
            width: 1,
            height: 1,
            dpr: 1,
            lastFrameTime: 0,
            accumulator: 0,
            cameraX: 0,
            cameraY: 0,
            player: makeShip(-125, -40, 0.15, true),
            enemies: enemies,
            islands: islands,
            crates: [],
            projectiles: [],
            particles: [],
            windAngle: randRange(rng, 0, TAU),
            windSpeed: randRange(rng, 0.78, 1.05),
            windTargetAngle: randRange(rng, 0, TAU),
            windTimer: 4,
            messageTimer: 0,
            messageText: 'W/S sail. A/D rudder. Mouse to aim. Click or Space to fire.',
            input: {
                sailUp: false,
                sailDown: false,
                left: false,
                right: false,
                fire: false
            },
            mouse: {
                x: 0,
                y: 0,
                worldX: 0,
                worldY: 0,
                inside: false
            },
            lastRenderTime: 0
        };
    }

    var state = makeInitialState();

    function setMessage(text, seconds) {
        state.messageText = text;
        state.messageTimer = seconds || 3.0;
        if (hud.message) {
            hud.message.textContent = text;
        }
    }

    function resize() {
        var rect = canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        state.width = Math.max(320, rect.width);
        state.height = Math.max(320, rect.height);
        state.dpr = dpr;
        canvas.width = Math.floor(state.width * dpr);
        canvas.height = Math.floor(state.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function screenToWorld(x, y) {
        return {
            x: state.cameraX + x - state.width * 0.5,
            y: state.cameraY + y - state.height * 0.5
        };
    }

    function worldToScreen(x, y) {
        return {
            x: x - state.cameraX + state.width * 0.5,
            y: y - state.cameraY + state.height * 0.5
        };
    }

    function addParticle(x, y, vx, vy, life, size, color) {
        if (state.particles.length >= MAX_PARTICLES) {
            state.particles.shift();
        }
        state.particles.push({ x: x, y: y, vx: vx, vy: vy, life: life, maxLife: life, size: size, color: color });
    }

    function addProjectile(owner, x, y, vx, vy) {
        if (state.projectiles.length >= MAX_PROJECTILES) {
            state.projectiles.shift();
        }
        state.projectiles.push({ owner: owner, x: x, y: y, vx: vx, vy: vy, life: PROJECTILE_LIFE, active: true });
    }

    function fireFromShip(ship, targetX, targetY) {
        if (ship.fireCooldown > 0 || ship.hp <= 0) {
            return false;
        }
        var toX = targetX - ship.x;
        var toY = targetY - ship.y;
        var len = length(toX, toY);
        if (len < 1) {
            return false;
        }
        var dirX = toX / len;
        var dirY = toY / len;
        var forwardX = Math.cos(ship.heading);
        var forwardY = Math.sin(ship.heading);
        var rightX = -forwardY;
        var rightY = forwardX;
        var side = (dirX * rightX + dirY * rightY) >= 0 ? 1 : -1;
        var muzzleX = ship.x + rightX * side * 22 + forwardX * 7;
        var muzzleY = ship.y + rightY * side * 22 + forwardY * 7;
        var baseSpeedX = ship.vx * 0.34;
        var baseSpeedY = ship.vy * 0.34;
        addProjectile(ship.isPlayer ? 'player' : 'enemy', muzzleX, muzzleY, dirX * PROJECTILE_SPEED + baseSpeedX, dirY * PROJECTILE_SPEED + baseSpeedY);
        ship.fireCooldown = ship.isPlayer ? 0.58 : 1.18;
        for (var i = 0; i < 8; i += 1) {
            addParticle(muzzleX, muzzleY, dirX * randRange(state.rng, 25, 70) + randRange(state.rng, -22, 22), dirY * randRange(state.rng, 25, 70) + randRange(state.rng, -22, 22), randRange(state.rng, 0.24, 0.46), randRange(state.rng, 2, 5), 'rgba(230, 238, 245, 0.70)');
        }
        return true;
    }

    function applyShipPhysics(ship, dt, rudderInput, desiredSail) {
        if (ship.hp <= 0) {
            ship.vx *= Math.pow(0.992, dt * 60);
            ship.vy *= Math.pow(0.992, dt * 60);
            ship.sinkTimer += dt;
            return;
        }

        ship.sail = clamp(lerp(ship.sail, desiredSail, 0.055), 0, 1);
        var forwardX = Math.cos(ship.heading);
        var forwardY = Math.sin(ship.heading);
        var windX = Math.cos(state.windAngle);
        var windY = Math.sin(state.windAngle);
        var downwind = Math.max(0, forwardX * windX + forwardY * windY);
        var crosswind = Math.abs(forwardX * windY - forwardY * windX);
        var sailForce = (downwind * 46 + crosswind * 14) * state.windSpeed * ship.sail;
        ship.vx += forwardX * sailForce * dt;
        ship.vy += forwardY * sailForce * dt;

        var speed = length(ship.vx, ship.vy);
        var steerPower = (0.58 + clamp(speed / 115, 0, 1) * 1.18) * (0.30 + ship.sail * 0.70);
        ship.heading = wrapAngle(ship.heading + rudderInput * steerPower * dt);

        var drag = Math.pow(0.988 - ship.sail * 0.004, dt * 60);
        ship.vx *= drag;
        ship.vy *= drag;

        var lateralX = -forwardY;
        var lateralY = forwardX;
        var lateralSpeed = ship.vx * lateralX + ship.vy * lateralY;
        ship.vx -= lateralX * lateralSpeed * 0.020;
        ship.vy -= lateralY * lateralSpeed * 0.020;

        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;
        ship.fireCooldown = Math.max(0, ship.fireCooldown - dt);
        ship.hitFlash = Math.max(0, ship.hitFlash - dt * 4.0);

        if (speed > 18 && state.time % 0.09 < dt) {
            addParticle(ship.x - forwardX * 22, ship.y - forwardY * 22, -forwardX * randRange(state.rng, 8, 20), -forwardY * randRange(state.rng, 8, 20), randRange(state.rng, 0.55, 0.95), randRange(state.rng, 2, 6), 'rgba(180, 226, 255, 0.30)');
        }
    }

    function solveIslandCollision(ship) {
        for (var i = 0; i < state.islands.length; i += 1) {
            var island = state.islands[i];
            var dx = ship.x - island.x;
            var dy = ship.y - island.y;
            var radius = island.r + (ship.isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS) + 5;
            var d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d < radius) {
                var nx = dx / d;
                var ny = dy / d;
                var push = radius - d;
                ship.x += nx * push;
                ship.y += ny * push;
                var into = ship.vx * nx + ship.vy * ny;
                if (into < 0) {
                    ship.vx -= nx * into * 1.35;
                    ship.vy -= ny * into * 1.35;
                }
            }
        }
    }

    function updateWind(dt) {
        state.windTimer -= dt;
        if (state.windTimer <= 0) {
            state.windTimer = randRange(state.rng, 6, 12);
            state.windTargetAngle = state.windAngle + randRange(state.rng, -1.15, 1.15);
            state.windSpeed = randRange(state.rng, 0.72, 1.12);
        }
        state.windAngle = wrapAngle(lerp(state.windAngle, state.windTargetAngle, 0.006));
    }

    function updateEnemies(dt) {
        var player = state.player;
        for (var i = 0; i < state.enemies.length; i += 1) {
            var enemy = state.enemies[i];
            if (enemy.hp <= 0) {
                applyShipPhysics(enemy, dt, 0, 0);
                continue;
            }

            var dx = player.x - enemy.x;
            var dy = player.y - enemy.y;
            var d = Math.sqrt(dx * dx + dy * dy) || 1;
            var desiredAngle = Math.atan2(dy, dx);
            var toPlayer = wrapAngle(desiredAngle - enemy.heading);
            var rudder = clamp(toPlayer * 1.6, -1, 1);
            var desiredSail = d > 240 ? 0.88 : 0.40;
            if (d < 145) {
                desiredSail = 0.15;
                rudder *= -0.4;
            }
            applyShipPhysics(enemy, dt, rudder, desiredSail);
            solveIslandCollision(enemy);

            if (d < 470 && player.hp > 0) {
                var lead = clamp(d / PROJECTILE_SPEED, 0.25, 1.55);
                var aimX = player.x + player.vx * lead + randRange(state.rng, -22, 22);
                var aimY = player.y + player.vy * lead + randRange(state.rng, -22, 22);
                fireFromShip(enemy, aimX, aimY);
            }
        }
    }

    function spawnCrates(enemy) {
        var count = 2 + Math.floor(state.rng() * 3);
        for (var i = 0; i < count; i += 1) {
            var a = randRange(state.rng, 0, TAU);
            var r = randRange(state.rng, 10, 48);
            state.crates.push({
                x: enemy.x + Math.cos(a) * r,
                y: enemy.y + Math.sin(a) * r,
                vx: Math.cos(a) * randRange(state.rng, 5, 22),
                vy: Math.sin(a) * randRange(state.rng, 5, 22),
                value: 18 + Math.floor(state.rng() * 26),
                bob: randRange(state.rng, 0, TAU),
                collected: false
            });
        }
    }

    function damageShip(ship, amount) {
        ship.hp = Math.max(0, ship.hp - amount);
        ship.hitFlash = 1;
        for (var i = 0; i < 12; i += 1) {
            addParticle(ship.x, ship.y, randRange(state.rng, -72, 72), randRange(state.rng, -72, 72), randRange(state.rng, 0.32, 0.78), randRange(state.rng, 2, 6), 'rgba(255, 209, 102, 0.62)');
        }
    }

    function updateProjectiles(dt) {
        for (var i = state.projectiles.length - 1; i >= 0; i -= 1) {
            var p = state.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= Math.pow(0.998, dt * 60);
            p.vy *= Math.pow(0.998, dt * 60);
            p.life -= dt;

            if (state.time % 0.04 < dt) {
                addParticle(p.x, p.y, 0, 0, 0.22, 2.2, 'rgba(255, 255, 255, 0.28)');
            }

            var hit = false;
            if (p.owner === 'player') {
                for (var e = 0; e < state.enemies.length; e += 1) {
                    var enemy = state.enemies[e];
                    if (enemy.hp > 0 && length(p.x - enemy.x, p.y - enemy.y) < ENEMY_RADIUS + 5) {
                        damageShip(enemy, 26);
                        if (enemy.hp <= 0) {
                            state.player.kills += 1;
                            spawnCrates(enemy);
                            setMessage('Enemy ship sunk. Collect floating cargo.', 3.2);
                        }
                        hit = true;
                        break;
                    }
                }
            } else if (state.player.hp > 0 && length(p.x - state.player.x, p.y - state.player.y) < PLAYER_RADIUS + 5) {
                damageShip(state.player, 16);
                setMessage('Hull hit. Keep distance or use the wind angle.', 2.5);
                hit = true;
            }

            if (!hit) {
                for (var s = 0; s < state.islands.length; s += 1) {
                    var island = state.islands[s];
                    if (length(p.x - island.x, p.y - island.y) < island.r) {
                        hit = true;
                        break;
                    }
                }
            }

            if (hit || p.life <= 0) {
                for (var fx = 0; fx < 7; fx += 1) {
                    addParticle(p.x, p.y, randRange(state.rng, -36, 36), randRange(state.rng, -36, 36), randRange(state.rng, 0.18, 0.45), randRange(state.rng, 2, 5), 'rgba(218, 237, 255, 0.50)');
                }
                state.projectiles.splice(i, 1);
            }
        }
    }

    function updateCrates(dt) {
        var player = state.player;
        for (var i = state.crates.length - 1; i >= 0; i -= 1) {
            var crate = state.crates[i];
            crate.x += crate.vx * dt;
            crate.y += crate.vy * dt;
            crate.vx *= Math.pow(0.986, dt * 60);
            crate.vy *= Math.pow(0.986, dt * 60);
            crate.bob += dt * 2.2;
            if (length(crate.x - player.x, crate.y - player.y) < 34) {
                player.cargo += 1;
                player.gold += Math.floor(crate.value * 0.25);
                state.crates.splice(i, 1);
                setMessage('Cargo recovered. Dock near a marked island to sell it.', 3.0);
            }
        }
    }

    function updateDocking() {
        var player = state.player;
        for (var i = 0; i < state.islands.length; i += 1) {
            var island = state.islands[i];
            if (!island.dock) {
                continue;
            }
            var d = length(player.x - island.x, player.y - island.y);
            if (d < island.r + ISLAND_DOCK_RADIUS && player.cargo > 0) {
                var sold = player.cargo;
                player.gold += sold * 32;
                player.cargo = 0;
                player.hp = Math.min(player.maxHp, player.hp + 12);
                setMessage('Docked at ' + island.name + '. Cargo sold and hull repaired.', 3.4);
                break;
            }
        }
    }

    function updateParticles(dt) {
        for (var i = state.particles.length - 1; i >= 0; i -= 1) {
            var p = state.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= Math.pow(0.986, dt * 60);
            p.vy *= Math.pow(0.986, dt * 60);
            p.life -= dt;
            if (p.life <= 0) {
                state.particles.splice(i, 1);
            }
        }
    }

    function respawnWaveIfNeeded() {
        var alive = 0;
        for (var i = 0; i < state.enemies.length; i += 1) {
            if (state.enemies[i].hp > 0) {
                alive += 1;
            }
        }
        if (alive > 0 || state.gameOver) {
            return;
        }
        if (state.player.kills > 0 && state.player.kills % 4 === 0) {
            setMessage('Sea route cleared. New patrols spotted beyond the islands.', 4.0);
        }
        state.enemies.length = 0;
        for (var e = 0; e < 4; e += 1) {
            var a = randRange(state.rng, 0, TAU);
            var r = randRange(state.rng, 620, 980);
            state.enemies.push(makeShip(state.player.x + Math.cos(a) * r, state.player.y + Math.sin(a) * r, randRange(state.rng, 0, TAU), false));
        }
    }

    function step(dt) {
        state.time += dt;
        updateWind(dt);

        var player = state.player;
        if (state.input.sailUp) {
            player.sail = clamp(player.sail + dt * 0.95, 0, 1);
        }
        if (state.input.sailDown) {
            player.sail = clamp(player.sail - dt * 1.15, 0, 1);
        }
        var rudder = 0;
        if (state.input.left) {
            rudder -= 1;
        }
        if (state.input.right) {
            rudder += 1;
        }
        applyShipPhysics(player, dt, rudder, player.sail);
        solveIslandCollision(player);
        if (state.input.fire) {
            fireFromShip(player, state.mouse.worldX, state.mouse.worldY);
            state.input.fire = false;
        }

        updateEnemies(dt);
        updateProjectiles(dt);
        updateCrates(dt);
        updateDocking();
        updateParticles(dt);
        respawnWaveIfNeeded();

        state.cameraX = lerp(state.cameraX, player.x, 0.06);
        state.cameraY = lerp(state.cameraY, player.y, 0.06);

        if (state.messageTimer > 0) {
            state.messageTimer -= dt;
        } else if (hud.message && hud.message.textContent !== state.messageText) {
            hud.message.textContent = state.messageText;
        }

        if (player.hp <= 0 && !state.gameOver) {
            state.gameOver = true;
            setMessage('Ship lost. Press New run to restart.', 999);
        }
    }

    function drawWater() {
        var w = state.width;
        var h = state.height;
        var grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, '#0a2534');
        grd.addColorStop(0.55, '#071923');
        grd.addColorStop(1, '#041018');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = 'rgba(118, 189, 238, 0.14)';
        ctx.lineWidth = 1;
        var spacing = 54;
        var offsetX = ((-state.cameraX * 0.25 + state.time * 10) % spacing + spacing) % spacing;
        var offsetY = ((-state.cameraY * 0.25 + state.time * 6) % spacing + spacing) % spacing;
        for (var x = -spacing + offsetX; x < w + spacing; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.sin(state.time + x * 0.01) * 18, h);
            ctx.stroke();
        }
        for (var y = -spacing + offsetY; y < h + spacing; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y + Math.cos(state.time + y * 0.01) * 18);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawIsland(island) {
        var p = worldToScreen(island.x, island.y);
        var wave = Math.sin(state.time * 1.3 + island.x * 0.01) * 3;
        ctx.save();
        ctx.translate(p.x, p.y + wave);
        ctx.fillStyle = island.dock ? 'rgba(160, 132, 74, 1)' : 'rgba(118, 111, 72, 1)';
        ctx.strokeStyle = 'rgba(255, 231, 170, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, island.r * 1.22, island.r * 0.78, 0.18, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(45, 88, 54, 0.92)';
        ctx.beginPath();
        ctx.ellipse(-island.r * 0.24, -island.r * 0.14, island.r * 0.34, island.r * 0.18, -0.4, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(island.r * 0.26, island.r * 0.12, island.r * 0.26, island.r * 0.14, 0.25, 0, TAU);
        ctx.fill();

        if (island.dock) {
            ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, island.r + ISLAND_DOCK_RADIUS, 0, TAU);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 209, 102, 0.92)';
            ctx.fillRect(island.r * 0.62, -5, 58, 10);
        }

        if (DEBUG_ENABLED) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, island.r, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawShip(ship) {
        var p = worldToScreen(ship.x, ship.y);
        var isPlayer = ship.isPlayer;
        var sink = ship.hp <= 0 ? clamp(ship.sinkTimer / 3.0, 0, 1) : 0;
        ctx.save();
        ctx.translate(p.x, p.y + sink * 18);
        ctx.rotate(ship.heading);
        ctx.globalAlpha = 1 - sink * 0.75;

        var hull = isPlayer ? '#d7eaff' : '#ffb1a7';
        if (ship.hitFlash > 0) {
            hull = '#ffffff';
        }
        ctx.fillStyle = hull;
        ctx.strokeStyle = isPlayer ? 'rgba(99, 166, 255, 0.78)' : 'rgba(255, 108, 95, 0.78)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(8, -13);
        ctx.lineTo(-24, -10);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-24, 10);
        ctx.lineTo(8, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isPlayer ? 'rgba(99, 166, 255, 0.82)' : 'rgba(255, 108, 95, 0.82)';
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.lineTo(12 + ship.sail * 10, 0);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(10, 18, 26, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-2, -15);
        ctx.lineTo(-2, 15);
        ctx.stroke();

        ctx.restore();

        if (!isPlayer && ship.hp > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.fillRect(p.x - 25, p.y - 34, 50, 5);
            ctx.fillStyle = 'rgba(255, 108, 95, 0.86)';
            ctx.fillRect(p.x - 25, p.y - 34, 50 * clamp(ship.hp / ship.maxHp, 0, 1), 5);
        }

        if (DEBUG_ENABLED && ship.hp > 0) {
            ctx.save();
            ctx.strokeStyle = isPlayer ? 'rgba(99, 166, 255, 0.55)' : 'rgba(255, 108, 95, 0.48)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS, 0, TAU);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(ship.heading) * 54, p.y + Math.sin(ship.heading) * 54);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawProjectiles() {
        ctx.save();
        for (var i = 0; i < state.projectiles.length; i += 1) {
            var p = state.projectiles[i];
            var s = worldToScreen(p.x, p.y);
            ctx.fillStyle = p.owner === 'player' ? 'rgba(255, 238, 190, 0.95)' : 'rgba(255, 130, 112, 0.95)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, 4, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawCrates() {
        ctx.save();
        for (var i = 0; i < state.crates.length; i += 1) {
            var c = state.crates[i];
            var p = worldToScreen(c.x, c.y + Math.sin(c.bob) * 3);
            ctx.translate(p.x, p.y);
            ctx.rotate(0.22 + Math.sin(c.bob) * 0.08);
            ctx.fillStyle = 'rgba(190, 132, 68, 0.94)';
            ctx.strokeStyle = 'rgba(255, 231, 170, 0.38)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeRect(-8, -8, 16, 16);
            ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        }
        ctx.restore();
    }

    function drawParticles() {
        ctx.save();
        for (var i = 0; i < state.particles.length; i += 1) {
            var p = state.particles[i];
            var s = worldToScreen(p.x, p.y);
            var alpha = clamp(p.life / p.maxLife, 0, 1);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, p.size * (0.75 + (1 - alpha) * 0.85), 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawAim() {
        if (!state.mouse.inside || state.player.hp <= 0) {
            return;
        }
        var player = state.player;
        var p = worldToScreen(player.x, player.y);
        ctx.save();
        ctx.strokeStyle = player.fireCooldown > 0 ? 'rgba(143, 165, 184, 0.32)' : 'rgba(50, 209, 160, 0.62)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(state.mouse.x, state.mouse.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(50, 209, 160, 0.72)';
        ctx.beginPath();
        ctx.arc(state.mouse.x, state.mouse.y, 5, 0, TAU);
        ctx.fill();
        ctx.restore();
    }

    function drawWind() {
        var x = state.width - 88;
        var y = 94;
        var wx = Math.cos(state.windAngle);
        var wy = Math.sin(state.windAngle);
        ctx.save();
        ctx.strokeStyle = 'rgba(99, 166, 255, 0.76)';
        ctx.fillStyle = 'rgba(99, 166, 255, 0.76)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 34, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - wx * 23, y - wy * 23);
        ctx.lineTo(x + wx * 23, y + wy * 23);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + wx * 29, y + wy * 29);
        ctx.lineTo(x + wx * 17 - wy * 7, y + wy * 17 + wx * 7);
        ctx.lineTo(x + wx * 17 + wy * 7, y + wy * 17 - wx * 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawDebugText() {
        if (!DEBUG_ENABLED) {
            return;
        }
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(16, 96, 286, 104);
        ctx.fillStyle = 'rgba(237, 246, 255, 0.84)';
        ctx.font = '12px monospace';
        ctx.fillText('seed: ' + state.seed, 28, 120);
        ctx.fillText('projectiles: ' + state.projectiles.length, 28, 140);
        ctx.fillText('particles: ' + state.particles.length, 28, 160);
        ctx.fillText('crates: ' + state.crates.length, 28, 180);
        ctx.restore();
    }

    function render() {
        drawWater();

        var items = [];
        for (var i = 0; i < state.islands.length; i += 1) {
            items.push({ type: 'island', y: state.islands[i].y, value: state.islands[i] });
        }
        for (var e = 0; e < state.enemies.length; e += 1) {
            items.push({ type: 'ship', y: state.enemies[e].y, value: state.enemies[e] });
        }
        items.push({ type: 'ship', y: state.player.y, value: state.player });
        items.sort(function (a, b) { return a.y - b.y; });
        for (var item = 0; item < items.length; item += 1) {
            if (items[item].type === 'island') {
                drawIsland(items[item].value);
            } else {
                drawShip(items[item].value);
            }
        }

        drawCrates();
        drawProjectiles();
        drawParticles();
        drawAim();
        drawWind();
        drawDebugText();
    }

    function updateHud() {
        var alive = 0;
        for (var i = 0; i < state.enemies.length; i += 1) {
            if (state.enemies[i].hp > 0) {
                alive += 1;
            }
        }
        if (hud.hp) {
            hud.hp.textContent = pad(state.player.hp, 3);
        }
        if (hud.sail) {
            hud.sail.textContent = pad(state.player.sail * 100, 2);
        }
        if (hud.wind) {
            hud.wind.textContent = angleName(state.windAngle);
        }
        if (hud.cargo) {
            hud.cargo.textContent = pad(state.player.cargo, 3);
        }
        if (hud.gold) {
            hud.gold.textContent = pad(state.player.gold, 3);
        }
        if (hud.enemies) {
            hud.enemies.textContent = pad(alive, 2);
        }
        if (hud.pauseCard) {
            hud.pauseCard.hidden = !state.paused;
        }
        if (hud.pauseButton) {
            hud.pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
        }
    }

    function frame(time) {
        var minFrameMs = 1000 / 60;
        if (state.lastRenderTime && time - state.lastRenderTime < minFrameMs) {
            window.requestAnimationFrame(frame);
            return;
        }
        state.lastRenderTime = time;

        if (!state.lastFrameTime) {
            state.lastFrameTime = time;
        }
        var dt = clamp((time - state.lastFrameTime) / 1000, 0, 0.10);
        state.lastFrameTime = time;
        if (!state.paused) {
            state.accumulator += dt;
            var steps = 0;
            while (state.accumulator >= FIXED_DT && steps < 5) {
                step(FIXED_DT);
                state.accumulator -= FIXED_DT;
                steps += 1;
            }
        }
        updateHud();
        render();
        window.requestAnimationFrame(frame);
    }

    function updateMouse(event) {
        var rect = canvas.getBoundingClientRect();
        state.mouse.x = event.clientX - rect.left;
        state.mouse.y = event.clientY - rect.top;
        var world = screenToWorld(state.mouse.x, state.mouse.y);
        state.mouse.worldX = world.x;
        state.mouse.worldY = world.y;
        state.mouse.inside = true;
    }

    function setPaused(value) {
        state.paused = value;
        updateHud();
    }

    function resetGame() {
        var oldPaused = state.paused;
        state = makeInitialState();
        state.paused = oldPaused && false;
        resize();
        setMessage('New run started. Use the wind and keep your broadside ready.', 3.2);
    }

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', updateMouse);
    canvas.addEventListener('mouseenter', function (event) {
        updateMouse(event);
        state.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', function () {
        state.mouse.inside = false;
    });
    canvas.addEventListener('mousedown', function (event) {
        updateMouse(event);
        state.input.fire = true;
    });

    window.addEventListener('keydown', function (event) {
        var key = event.key.toLowerCase();
        if (key === 'w') {
            state.input.sailUp = true;
        } else if (key === 's') {
            state.input.sailDown = true;
        } else if (key === 'a') {
            state.input.left = true;
        } else if (key === 'd') {
            state.input.right = true;
        } else if (key === ' ' || key === 'spacebar') {
            state.input.fire = true;
            event.preventDefault();
        } else if (key === 'p') {
            setPaused(!state.paused);
        }
    });

    window.addEventListener('keyup', function (event) {
        var key = event.key.toLowerCase();
        if (key === 'w') {
            state.input.sailUp = false;
        } else if (key === 's') {
            state.input.sailDown = false;
        } else if (key === 'a') {
            state.input.left = false;
        } else if (key === 'd') {
            state.input.right = false;
        }
    });

    if (hud.pauseButton) {
        hud.pauseButton.addEventListener('click', function () {
            setPaused(!state.paused);
        });
    }
    if (hud.resetButton) {
        hud.resetButton.addEventListener('click', resetGame);
    }

    resize();
    setMessage('W/S sail. A/D rudder. Mouse to aim. Click or Space to fire.', 4.0);
    window.requestAnimationFrame(frame);
})();
