(function () {
    'use strict';

    var THREE_URL = 'https://unpkg.com/three@0.165.0/build/three.module.js';
    var canvas = document.getElementById('sail-canvas');

    if (!canvas) {
        return;
    }

    var hud = {
        hp: document.querySelector('[data-hud="hp"]'),
        sail: document.querySelector('[data-hud="sail"]'),
        wind: document.querySelector('[data-hud="wind"]'),
        cargo: document.querySelector('[data-hud="cargo"]'),
        gold: document.querySelector('[data-hud="gold"]'),
        enemies: document.querySelector('[data-hud="enemies"]'),
        reload: document.querySelector('[data-hud="reload"]'),
        dock: document.querySelector('[data-hud="dock"]'),
        upgrade: document.querySelector('[data-hud="upgrade"]'),
        message: document.querySelector('[data-sail-message]'),
        pauseCard: document.querySelector('[data-sail-pause-card]'),
        pauseButton: document.querySelector('[data-sail-pause]'),
        resetButton: document.querySelector('[data-sail-reset]'),
        loading: document.querySelector('[data-sail-loading]'),
        minimap: document.querySelector('[data-sail-minimap]'),
        dockPanel: document.querySelector('[data-dock-panel]'),
        dockClose: document.querySelector('[data-dock-close]'),
        dockSell: document.querySelector('[data-dock-sell]'),
        dockUpgradeButtons: document.querySelectorAll('[data-dock-upgrade]'),
        dockName: document.querySelector('[data-dock="name"]'),
        dockCargo: document.querySelector('[data-dock="cargo"]'),
        dockCargoValue: document.querySelector('[data-dock="cargoValue"]'),
        dockGold: document.querySelector('[data-dock="gold"]'),
        dockHint: document.querySelector('[data-dock="hint"]')
    };

    var DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';
    var TAU = Math.PI * 2;
    var FIXED_DT = 1 / 60;
    var SEA_LIMIT = 3200;
    var SEA_SOFT_LIMIT = 2850;
    var SEA_HARD_LIMIT = 3450;
    var WATER_SIZE = 7600;
    var GRAVITY = 160;
    var PROJECTILE_MAX_LIFE = 3.2;
    var BROADSIDE_HALF_ARC = 0.82;
    var AIM_DOT_COUNT = 30;
    var AIM_MAX_FLIGHT_TIME = 3.0;
    var AIM_MAX_RANGE = 720;
    var WAKE_POINT_COUNT = 34;
    var WAKE_LIFE = 3.2;
    var SAIL_STAGE_STEP = 1 / 3;
    var PLAYER_RADIUS = 24;
    var ENEMY_RADIUS = 23;
    var DOCK_INTERACT_RADIUS = 72;
    var ISLAND_SHORE_BUFFER = 230;
    var SHALLOW_WATER_WIDTH = 160;
    var WATER_SEGMENTS = 144;
    var ISLAND_TOTAL_COUNT = 16;
    var TRADING_ISLAND_COUNT = 4;
    var WILD_ISLAND_COUNT = ISLAND_TOTAL_COUNT - TRADING_ISLAND_COUNT;
    var ISLAND_MIN_GAP = 460;
    var ISLAND_DOCK_NEAR_GAP = 680;
    var TRADING_ISLAND_MIN_GAP = 980;
    var ISLAND_PLACEMENT_ATTEMPTS = 180;
    var ENEMY_SHORE_CLEARANCE = 360;
    var ENEMY_ZONE_COUNT = 5;
    var ENEMY_ZONE_RADIUS = 420;
    var THREE = null;
    var renderer = null;
    var scene = null;
    var camera = null;
    var raycaster = null;
    var groundPlane = null;
    var worldGroup = null;
    var waterMesh = null;
    var waterPositions = null;
    var waterBasePositions = null;
    var aimDots = null;
    var aimDotMatrix = null;
    var aimMarker = null;
    var windArrow = null;
    var minimapContext = null;
    var clockStarted = false;
    var lastFrameTime = 0;
    var accumulator = 0;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function smoothstep(edge0, edge1, value) {
        var t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
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

    function length2(x, z) {
        return Math.sqrt(x * x + z * z);
    }

    function dist2(a, b) {
        var dx = a.x - b.x;
        var dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
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
        var names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        var normalized = (angle % TAU + TAU) % TAU;
        var index = Math.round(normalized / (TAU / 8)) % 8;
        return names[index];
    }

    function forwardX(heading) {
        return Math.sin(heading);
    }

    function forwardZ(heading) {
        return Math.cos(heading);
    }

    function makeShip(x, z, heading, isPlayer) {
        return {
            x: x,
            z: z,
            y: 0,
            vx: 0,
            vz: 0,
            heading: heading,
            sail: isPlayer ? 0.55 : 0.78,
            sailAngle: 0,
            hp: isPlayer ? 100 : 78,
            maxHp: isPlayer ? 100 : 78,
            cargo: 0,
            cargoValue: 0,
            cargoCapacity: isPlayer ? 6 : 2,
            gold: 0,
            kills: 0,
            hitFlash: 0,
            sinkTimer: 0,
            fireCooldown: 0,
            fireHintCooldown: 0,
            wakeTimer: 0,
            wakePoints: [],
            wakeLine: null,
            healthBar: null,
            aiTimer: 0,
            aiState: 'patrol',
            targetX: x,
            targetZ: z,
            patrolIndex: 0,
            isPlayer: isPlayer,
            mesh: null,
            dockRing: null,
            debugRing: null,
            damage: isPlayer ? 35 : 18,
            cannonCooldownMul: 1,
            sailPowerMul: 1
        };
    }

    function isPointClearOfIslandList(x, z, islands, clearance) {
        var i;
        var island;

        for (i = 0; i < islands.length; i += 1) {
            island = islands[i];
            if (length2(x - island.x, z - island.z) < island.r + clearance) {
                return false;
            }
        }
        return true;
    }

    function islandPlacementGap(isDock, otherIsDock) {
        if (isDock && otherIsDock) {
            return TRADING_ISLAND_MIN_GAP;
        }
        if (isDock || otherIsDock) {
            return ISLAND_DOCK_NEAR_GAP;
        }
        return ISLAND_MIN_GAP;
    }

    function scoreIslandPlacement(x, z, radius, isDock, islands) {
        var edgeDistance = SEA_SOFT_LIMIT - 180 - length2(x, z) - radius;
        var score = edgeDistance;
        var i;
        var island;
        var requiredDistance;
        var clearance;

        if (edgeDistance < 0) {
            return edgeDistance;
        }

        for (i = 0; i < islands.length; i += 1) {
            island = islands[i];
            requiredDistance = radius + island.r + islandPlacementGap(isDock, island.dock);
            clearance = length2(x - island.x, z - island.z) - requiredDistance;
            score = Math.min(score, clearance);
        }

        return score;
    }

    function makeIslandPlacementZones(rng) {
        var zones = [];
        var rotation = randRange(rng, 0, TAU);
        var i;

        for (i = 0; i < TRADING_ISLAND_COUNT; i += 1) {
            zones.push({
                dock: true,
                angle: rotation + i * TAU / TRADING_ISLAND_COUNT,
                minRadius: 1450,
                maxRadius: 2580,
                angleJitter: 0.22,
                minIslandRadius: 58,
                maxIslandRadius: 94
            });
        }

        for (i = 0; i < WILD_ISLAND_COUNT; i += 1) {
            zones.push({
                dock: false,
                angle: rotation + (i + 0.5) * TAU / WILD_ISLAND_COUNT,
                minRadius: i % 3 === 0 ? 620 : 1040,
                maxRadius: i % 3 === 0 ? 1850 : 2760,
                angleJitter: 0.26,
                minIslandRadius: i % 4 === 0 ? 32 : (i % 4 === 1 ? 52 : (i % 4 === 2 ? 76 : 42)),
                maxIslandRadius: i % 4 === 0 ? 54 : (i % 4 === 1 ? 90 : (i % 4 === 2 ? 128 : 72))
            });
        }

        return zones;
    }

    function makeIslandCandidate(rng, zone, attempt) {
        var spread = zone.angleJitter + Math.min(0.34, attempt * 0.004);
        var angle = zone.angle + randRange(rng, -spread, spread);
        var radiusBias = attempt % 3 === 0 ? rng() * rng() : rng();
        var mapRadius = lerp(zone.minRadius, zone.maxRadius, radiusBias);

        return {
            x: Math.sin(angle) * mapRadius,
            z: Math.cos(angle) * mapRadius
        };
    }

    function placeIslandInZone(rng, zone, islands, radius) {
        var attempt;
        var candidate;
        var score;
        var best = null;
        var bestScore = -Infinity;

        for (attempt = 0; attempt < ISLAND_PLACEMENT_ATTEMPTS; attempt += 1) {
            candidate = makeIslandCandidate(rng, zone, attempt);
            score = scoreIslandPlacement(candidate.x, candidate.z, radius, zone.dock, islands);

            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }

            if (score >= 0) {
                return candidate;
            }
        }

        return best;
    }

    function pickWildIslandShape(index, rng) {
        var shapes = ['round', 'oval', 'long', 'bay', 'crescent', 'cove'];
        var offset = Math.floor(rng() * shapes.length);
        return shapes[(index + offset) % shapes.length];
    }

    function makeIslandShapeData(shape, rng) {
        return {
            shape: shape,
            shapeRotation: randRange(rng, 0, TAU),
            shapeSeedA: randRange(rng, 0, TAU),
            shapeSeedB: randRange(rng, 0, TAU),
            shapeSeedC: randRange(rng, 0, TAU)
        };
    }

    function islandShapeFactor(island, angle) {
        var shape = island.shape || 'round';
        var a = wrapAngle(angle);
        var wave = 0.035 * Math.sin(a * 3 + (island.shapeSeedA || 0)) + 0.025 * Math.sin(a * 7 + (island.shapeSeedB || 0));
        var factor = 0.92 + wave;
        var xScale;
        var zScale;
        var ellipse;
        var bite;
        var bayAngle = island.shapeSeedC || 0;

        if (shape === 'trade') {
            return 1.0;
        }

        if (shape === 'oval') {
            xScale = 1.0;
            zScale = 0.66;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            factor *= ellipse;
        } else if (shape === 'long') {
            xScale = 1.0;
            zScale = 0.43;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            factor *= ellipse;
        } else if (shape === 'bay') {
            bite = smoothstep(0.10, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= 1.0 - bite * 0.36;
        } else if (shape === 'crescent') {
            xScale = 1.0;
            zScale = 0.76;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            bite = smoothstep(-0.10, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= ellipse * (1.0 - bite * 0.52);
        } else if (shape === 'cove') {
            bite = smoothstep(0.00, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= 0.88 + 0.10 * Math.sin(a + (island.shapeSeedA || 0));
            factor *= 1.0 - bite * 0.44;
            factor *= 0.82 + 0.18 * smoothstep(-0.60, 1.0, Math.sin(a));
        }

        return clamp(factor, 0.28, 1.0);
    }

    function makeIslandProfilePoints(island, radiusMul, count) {
        var points = [];
        var i;
        var a;
        var localAngle;
        var factor;
        var radius;
        var rotation = island.shapeRotation || 0;

        for (i = 0; i < count; i += 1) {
            localAngle = i / count * TAU;
            a = localAngle + rotation;
            factor = islandShapeFactor(island, localAngle);
            radius = island.r * radiusMul * factor;
            points.push({
                x: Math.sin(a) * radius,
                z: Math.cos(a) * radius
            });
        }

        return points;
    }

    function createIslandPrismGeometry(points, bottomY, topY, bottomScale, topScale) {
        var geometry = new THREE.BufferGeometry();
        var vertices = [];
        var indices = [];
        var count = points.length;
        var topCenterIndex = 0;
        var bottomCenterIndex = 1;
        var topStart = 2;
        var bottomStart = topStart + count;
        var i;
        var next;
        var point;

        vertices.push(0, topY, 0);
        vertices.push(0, bottomY, 0);

        for (i = 0; i < count; i += 1) {
            point = points[i];
            vertices.push(point.x * topScale, topY, point.z * topScale);
        }

        for (i = 0; i < count; i += 1) {
            point = points[i];
            vertices.push(point.x * bottomScale, bottomY, point.z * bottomScale);
        }

        for (i = 0; i < count; i += 1) {
            next = (i + 1) % count;
            indices.push(topCenterIndex, topStart + i, topStart + next);
            indices.push(bottomCenterIndex, bottomStart + next, bottomStart + i);
            indices.push(topStart + i, bottomStart + i, bottomStart + next);
            indices.push(topStart + i, bottomStart + next, topStart + next);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    function randomPointInsideIsland(island, rng, radiusMul) {
        var angle = randRange(rng, 0, TAU);
        var localAngle = wrapAngle(angle - (island.shapeRotation || 0));
        var maxRadius = island.r * radiusMul * islandShapeFactor(island, localAngle);
        var radius = Math.sqrt(rng()) * maxRadius;
        return {
            x: Math.sin(angle) * radius,
            z: Math.cos(angle) * radius
        };
    }

    function islandLocalAngleAtPoint(island, x, z) {
        return wrapAngle(Math.atan2(x - island.x, z - island.z) - (island.shapeRotation || 0));
    }

    function islandCoastRadiusAtLocalAngle(island, localAngle) {
        return island.r * islandShapeFactor(island, localAngle);
    }

    function islandCoastRadiusAtPoint(island, x, z) {
        return islandCoastRadiusAtLocalAngle(island, islandLocalAngleAtPoint(island, x, z));
    }

    function islandNavigationRadiusAtPoint(island, x, z) {
        return islandCoastRadiusAtPoint(island, x, z) + ISLAND_SHORE_BUFFER;
    }

    function getIslandNavigationBufferAt(x, z) {
        var i;
        var island;
        var bufferRadius;
        var distance;

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            distance = length2(x - island.x, z - island.z);
            bufferRadius = islandNavigationRadiusAtPoint(island, x, z);
            if (distance <= bufferRadius) {
                return {
                    island: island,
                    distance: distance,
                    navigationRadius: bufferRadius
                };
            }
        }
        return null;
    }

    function makeEnemyZone(rng, islands, index) {
        var attempt;
        var angle;
        var radius;
        var x;
        var z;

        for (attempt = 0; attempt < 80; attempt += 1) {
            angle = randRange(rng, 0, TAU);
            radius = randRange(rng, 980, SEA_SOFT_LIMIT - 360);
            x = Math.sin(angle) * radius;
            z = Math.cos(angle) * radius;
            if (isPointClearOfIslandList(x, z, islands, ENEMY_SHORE_CLEARANCE + ENEMY_ZONE_RADIUS * 0.35)) {
                return {
                    x: x,
                    z: z,
                    r: ENEMY_ZONE_RADIUS + randRange(rng, -70, 80),
                    debugRing: null,
                    index: index
                };
            }
        }

        angle = (index / Math.max(1, ENEMY_ZONE_COUNT)) * TAU + 0.35;
        radius = SEA_SOFT_LIMIT * 0.62;
        return {
            x: Math.sin(angle) * radius,
            z: Math.cos(angle) * radius,
            r: ENEMY_ZONE_RADIUS,
            debugRing: null,
            index: index
        };
    }

    function randomPointInEnemyZone(rng, zone, islands) {
        var attempt;
        var angle;
        var radius;
        var x;
        var z;

        for (attempt = 0; attempt < 60; attempt += 1) {
            angle = randRange(rng, 0, TAU);
            radius = Math.sqrt(rng()) * zone.r;
            x = zone.x + Math.sin(angle) * radius;
            z = zone.z + Math.cos(angle) * radius;
            if (length2(x, z) < SEA_SOFT_LIMIT - 180 && isPointClearOfIslandList(x, z, islands, ENEMY_SHORE_CLEARANCE)) {
                return { x: x, z: z };
            }
        }

        return { x: zone.x, z: zone.z };
    }

    function makeInitialState() {
        var seed = seedFromUrl();
        var rng = makeRng(seed);
        var islands = [];
        var enemies = [];
        var enemyZones = [];
        var islandZones = makeIslandPlacementZones(rng);
        var i;
        var zone;
        var spawn;
        var islandRadius;
        var placement;
        var enemy;
        var tradeIndex = 1;
        var wildIndex = 1;

        islands.push({
            x: -110,
            z: -80,
            r: 86,
            dock: true,
            shape: 'trade',
            shapeRotation: 0,
            shapeSeedA: 0,
            shapeSeedB: 0,
            shapeSeedC: 0,
            name: 'Harbor',
            mesh: null,
            dockRing: null,
            debugRing: null
        });

        for (i = 0; i < islandZones.length; i += 1) {
            zone = islandZones[i];
            islandRadius = randRange(rng, zone.minIslandRadius, zone.maxIslandRadius);
            placement = placeIslandInZone(rng, zone, islands, islandRadius);
            islands.push(Object.assign({
                x: placement.x,
                z: placement.z,
                r: islandRadius,
                dock: zone.dock,
                name: zone.dock ? 'Trade Pier ' + tradeIndex++ : 'Wild Island ' + wildIndex++,
                mesh: null,
                dockRing: null,
                    debugRing: null
            }, makeIslandShapeData(zone.dock ? 'trade' : pickWildIslandShape(wildIndex, rng), rng)));
        }

        for (i = 0; i < ENEMY_ZONE_COUNT; i += 1) {
            enemyZones.push(makeEnemyZone(rng, islands, i));
        }

        for (i = 0; i < 7; i += 1) {
            zone = enemyZones[i % enemyZones.length];
            spawn = randomPointInEnemyZone(rng, zone, islands);
            enemy = makeShip(spawn.x, spawn.z, randRange(rng, 0, TAU), false);
            enemy.zoneX = zone.x;
            enemy.zoneZ = zone.z;
            enemy.zoneRadius = zone.r;
            enemy.zoneIndex = zone.index;
            enemy.targetX = spawn.x;
            enemy.targetZ = spawn.z;
            enemies.push(enemy);
        }

        return {
            seed: seed,
            rng: rng,
            time: 0,
            paused: false,
            gameOver: false,
            routeClear: false,
            docked: false,
            nearDock: false,
            activeDockIndex: -1,
            dockPanelOpen: false,
            dockTimer: 0,
            sellCooldown: 0,
            player: makeShip(-250, -190, 0.35, true),
            enemies: enemies,
            enemyZones: enemyZones,
            islands: islands,
            crates: [],
            projectiles: [],
            splashes: [],
            windAngle: randRange(rng, 0, TAU),
            windTargetAngle: randRange(rng, 0, TAU),
            windSpeed: randRange(rng, 0.78, 1.08),
            windTimer: 5,
            cameraTargetX: 0,
            cameraTargetZ: 0,
            cameraOrbit: Math.PI * 0.25,
            mouseNdcX: 0,
            mouseNdcY: 0,
            mouseWorldX: 0,
            mouseWorldZ: 0,
            mouseInside: false,
            messageText: 'W/S sail stages. A/D rudder. Q/E camera. Mouse aim. LMB or Space fire. F docks at piers.',
            messageTimer: 0,
            input: {
                left: false,
                right: false,
                camLeft: false,
                camRight: false,
                fire: false,
                dock: false
            }
        };
    }

    var state = makeInitialState();

    function setMessage(text, seconds) {
        state.messageText = text;
        state.messageTimer = seconds || 3;
        if (hud.message) {
            hud.message.textContent = text;
        }
    }

    function makeMaterial(color, roughness, metalness) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness,
            flatShading: true
        });
    }

    var materials = null;

    function initMaterials() {
        materials = {
            water: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.82,
                metalness: 0.03,
                flatShading: true,
                vertexColors: true
            }),
            hullPlayer: makeMaterial(0x7a4a2e, 0.86, 0.02),
            hullEnemy: makeMaterial(0x5a2530, 0.88, 0.02),
            deck: makeMaterial(0xc58b52, 0.78, 0.02),
            mast: makeMaterial(0x3a2418, 0.82, 0.02),
            sailPlayer: makeMaterial(0xf1ead8, 0.70, 0.0),
            sailEnemy: makeMaterial(0xd8b9a8, 0.78, 0.0),
            cannon: makeMaterial(0x191b1f, 0.55, 0.18),
            cannonball: makeMaterial(0x101113, 0.48, 0.42),
            sand: makeMaterial(0xb58d4d, 0.90, 0.0),
            grass: makeMaterial(0x4e8c50, 0.92, 0.0),
            palm: makeMaterial(0x5d3c21, 0.90, 0.0),
            leaf: makeMaterial(0x2f7f54, 0.92, 0.0),
            crate: makeMaterial(0xb57231, 0.88, 0.0),
            dock: makeMaterial(0x6b472a, 0.88, 0.0),
            dockZone: new THREE.MeshBasicMaterial({ color: 0xe0b565, wireframe: true, transparent: true, opacity: 0.50 }),
            fogBoundary: new THREE.MeshBasicMaterial({ color: 0x061019, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false }),
            debugGreen: new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.45 }),
            debugRed: new THREE.MeshBasicMaterial({ color: 0xff6c5f, wireframe: true, transparent: true, opacity: 0.40 }),
            wind: new THREE.LineBasicMaterial({ color: 0x63a6ff, transparent: true, opacity: 0.44 }),
            wake: new THREE.LineBasicMaterial({ color: 0xd8f5ff, transparent: true, opacity: 0.38 }),
            hpBack: new THREE.MeshBasicMaterial({ color: 0x120e12, transparent: true, opacity: 0.82 }),
            hpFill: new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.92 }),
            aimGood: new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.88 }),
            aimBad: new THREE.MeshBasicMaterial({ color: 0xff6c5f, transparent: true, opacity: 0.84 }),
            aimMarkerGood: new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.58 }),
            aimMarkerBad: new THREE.MeshBasicMaterial({ color: 0xff6c5f, wireframe: true, transparent: true, opacity: 0.58 })
        };

        materials.hullPlayer.side = THREE.DoubleSide;
        materials.hullEnemy.side = THREE.DoubleSide;
        materials.sailPlayer.side = THREE.DoubleSide;
        materials.sailEnemy.side = THREE.DoubleSide;
    }

    function islandShallowWaterWidth(island) {
        return clamp(island.r * 0.9, 76, SHALLOW_WATER_WIDTH);
    }

    function computeWaterColorAt(worldX, worldZ) {
        var color = new THREE.Color(0x1d5a78);
        var deep = new THREE.Color(0x061725);
        var shallow = new THREE.Color(0x58c6bd);
        var deepFactor = smoothstep(SEA_SOFT_LIMIT * 0.55, SEA_HARD_LIMIT, length2(worldX, worldZ));
        var shallowFactor = 0;
        var i;
        var island;
        var distanceToCenter;
        var distanceFromCoast;
        var shallowWidth;

        color.lerp(deep, deepFactor * 0.88);

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            distanceToCenter = length2(worldX - island.x, worldZ - island.z);
            distanceFromCoast = distanceToCenter - islandCoastRadiusAtPoint(island, worldX, worldZ);
            shallowWidth = islandShallowWaterWidth(island);
            shallowFactor = Math.max(shallowFactor, 1 - smoothstep(8, shallowWidth, distanceFromCoast));
        }

        color.lerp(shallow, clamp(shallowFactor * 0.78, 0, 0.78));
        return color;
    }

    function createWater() {
        var geometry = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_SEGMENTS, WATER_SEGMENTS);
        var mesh = new THREE.Mesh(geometry, materials.water);
        var colors = [];
        var position = geometry.attributes.position;
        var color;
        var i;
        var x;
        var z;

        for (i = 0; i < position.count; i += 1) {
            x = position.getX(i);
            z = -position.getY(i);
            color = computeWaterColorAt(x, z);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        mesh.rotation.x = -Math.PI * 0.5;
        mesh.position.y = -2;
        mesh.receiveShadow = false;
        waterPositions = geometry.attributes.position;
        waterBasePositions = new Float32Array(waterPositions.array.length);
        waterBasePositions.set(waterPositions.array);
        scene.add(mesh);
        waterMesh = mesh;
    }

    function updateWater(time) {
        if (!waterPositions || !waterBasePositions) {
            return;
        }

        var arr = waterPositions.array;
        var base = waterBasePositions;
        var i;
        var x;
        var y;
        var wave;

        for (i = 0; i < arr.length; i += 3) {
            x = base[i];
            y = base[i + 1];
            wave = Math.sin(x * 0.010 + time * 1.25) * 3.0;
            wave += Math.cos(y * 0.012 - time * 1.05) * 2.2;
            wave += Math.sin((x + y) * 0.006 + time * 0.85) * 1.4;
            arr[i + 2] = wave;
        }

        waterPositions.needsUpdate = true;
        waterMesh.geometry.computeVertexNormals();
    }

    function createHullGeometry() {
        var geometry = new THREE.BufferGeometry();
        var vertices = [
            -15, 14, -34,
            15, 14, -34,
            -16, 14, 8,
            16, 14, 8,
            0, 14, 44,
            -13, 5, -34,
            13, 5, -34,
            -15, 4, 8,
            15, 4, 8,
            0, 5, 40,
            0, -2, -28,
            0, -3, 8,
            0, 1, 37
        ];
        var indices = [
            0, 2, 3, 0, 3, 1,
            2, 4, 3,
            0, 5, 7, 0, 7, 2,
            2, 7, 9, 2, 9, 4,
            1, 3, 8, 1, 8, 6,
            3, 4, 9, 3, 9, 8,
            0, 1, 6, 0, 6, 5,
            5, 10, 11, 5, 11, 7,
            7, 11, 12, 7, 12, 9,
            6, 8, 11, 6, 11, 10,
            8, 9, 12, 8, 12, 11,
            4, 12, 9,
            4, 3, 12,
            4, 12, 2
        ];

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    function createShipMesh(isPlayer) {
        var group = new THREE.Group();
        var hullMat = isPlayer ? materials.hullPlayer : materials.hullEnemy;
        var sailMat = isPlayer ? materials.sailPlayer : materials.sailEnemy;
        var hull = new THREE.Mesh(createHullGeometry(), hullMat);
        var deck = new THREE.Mesh(new THREE.BoxGeometry(21, 4, 34), materials.deck);
        var sternBlock = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 12), hullMat);
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 58, 8), materials.mast);
        var sailPivot = new THREE.Group();
        var boom = new THREE.Mesh(new THREE.BoxGeometry(33, 2.2, 2.2), materials.mast);
        var sail = new THREE.Mesh(new THREE.BoxGeometry(30, 36, 1.1, 1, 4, 1), sailMat);
        var cannonL = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 5), materials.cannon);
        var cannonR = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 5), materials.cannon);

        hull.position.y = 6;
        deck.position.set(0, 20, -6);
        sternBlock.position.set(0, 13, -35);
        mast.position.set(0, 42, 0);
        sailPivot.position.set(0, 43, 1);
        boom.position.set(0, -5, 0);
        sail.position.set(0, 8, 0.35);
        sail.userData.isSail = true;
        cannonL.position.set(-17, 19, 2);
        cannonR.position.set(17, 19, 2);

        sailPivot.add(boom);
        sailPivot.add(sail);
        group.add(hull);
        group.add(deck);
        group.add(sternBlock);
        group.add(mast);
        group.add(sailPivot);
        group.add(cannonL);
        group.add(cannonR);
        group.userData.sailMesh = sail;
        group.userData.sailPivot = sailPivot;
        group.userData.boomMesh = boom;
        group.userData.hullMesh = hull;
        group.scale.setScalar(isPlayer ? 1.0 : 0.95);
        return group;
    }

    function createIslandMesh(island, rng) {
        var group = new THREE.Group();
        var base;
        var grass;
        var palmCount = island.dock ? 4 : clamp(Math.round(island.r / 30), 1, 4);
        var i;
        var palmPoint;

        if (island.dock) {
            base = new THREE.Mesh(new THREE.CylinderGeometry(island.r, island.r * 1.12, 18, 13), materials.sand);
            grass = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 0.72, island.r * 0.84, 8, 11), materials.grass);
            base.position.y = 3;
            grass.position.y = 16;
        } else {
            base = new THREE.Mesh(createIslandPrismGeometry(makeIslandProfilePoints(island, 1.0, 32), -5, 12, 1.04, 0.98), materials.sand);
            grass = new THREE.Mesh(createIslandPrismGeometry(makeIslandProfilePoints(island, 0.68, 32), 12, 21, 1.02, 0.94), materials.grass);
        }

        group.add(base);
        group.add(grass);

        for (i = 0; i < palmCount; i += 1) {
            palmPoint = island.dock ? {
                x: randRange(rng, -island.r * 0.42, island.r * 0.42),
                z: randRange(rng, -island.r * 0.42, island.r * 0.42)
            } : randomPointInsideIsland(island, rng, 0.46);
            group.add(createPalm(palmPoint.x, palmPoint.z, rng));
        }

        if (island.dock) {
            var dock = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 95), materials.dock);
            dock.position.set(0, 8, island.r + 34);
            group.add(dock);

            island.dockX = island.x;
            island.dockZ = island.z + island.r + 34;
            island.dockRing = createDebugRing(DOCK_INTERACT_RADIUS, materials.dockZone);
            island.dockRing.position.set(island.dockX, 1.4, island.dockZ);
            worldGroup.add(island.dockRing);
        } else {
            island.dockX = island.x;
            island.dockZ = island.z;
            island.dockRing = null;
        }

        group.position.set(island.x, 0, island.z);
        island.mesh = group;
        worldGroup.add(group);

        if (DEBUG_ENABLED) {
            island.debugRing = createDebugRing(island.r, materials.debugGreen);
            island.debugRing.position.set(island.x, 1, island.z);
            worldGroup.add(island.debugRing);
        }
    }

    function createPalm(x, z, rng) {
        var group = new THREE.Group();
        var trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 34, 7), materials.palm);
        var leafA = new THREE.Mesh(new THREE.ConeGeometry(13, 28, 6), materials.leaf);
        var leafB = new THREE.Mesh(new THREE.ConeGeometry(11, 24, 6), materials.leaf);
        var leafC = new THREE.Mesh(new THREE.ConeGeometry(10, 22, 6), materials.leaf);

        trunk.position.y = 24;
        trunk.rotation.z = randRange(rng, -0.10, 0.10);
        leafA.position.y = 46;
        leafB.position.y = 45;
        leafC.position.y = 44;
        leafA.rotation.z = 0.55;
        leafB.rotation.z = -0.45;
        leafB.rotation.y = 1.7;
        leafC.rotation.z = 0.25;
        leafC.rotation.y = -1.6;

        group.add(trunk);
        group.add(leafA);
        group.add(leafB);
        group.add(leafC);
        group.position.set(x, 0, z);
        return group;
    }

    function createProjectileMesh() {
        return new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), materials.cannonball);
    }

    function createCrateMesh() {
        var group = new THREE.Group();
        var box = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), materials.crate);
        var bandA = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 3), materials.dock);
        var bandB = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 20), materials.dock);
        box.position.y = 8;
        bandA.position.y = 8.5;
        bandB.position.y = 8.6;
        group.add(box);
        group.add(bandA);
        group.add(bandB);
        return group;
    }

    function createDebugRing(radius, material) {
        var mat = material && material.clone ? material.clone() : material;
        var ring = new THREE.Mesh(new THREE.RingGeometry(radius - 1.5, radius + 1.5, 64), mat);
        ring.rotation.x = -Math.PI * 0.5;
        return ring;
    }

    function createWakeLine() {
        var geometry = new THREE.BufferGeometry();
        var values = new Float32Array(WAKE_POINT_COUNT * 3);
        var material = materials.wake.clone();
        var i;

        for (i = 0; i < values.length; i += 3) {
            values[i] = 0;
            values[i + 1] = -1000;
            values[i + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(values, 3));
        return new THREE.Line(geometry, material);
    }

    function createHealthBar() {
        var group = new THREE.Group();
        var back = new THREE.Mesh(new THREE.PlaneGeometry(42, 6), materials.hpBack.clone());
        var fill = new THREE.Mesh(new THREE.PlaneGeometry(38, 3.5), materials.hpFill.clone());

        back.position.z = -0.01;
        fill.position.z = 0;
        fill.userData.fullWidth = 38;
        group.add(back);
        group.add(fill);
        group.userData.fill = fill;
        return group;
    }

    function attachShipHelpers(ship) {
        ship.wakeLine = createWakeLine();
        ship.healthBar = createHealthBar();
        worldGroup.add(ship.wakeLine);
        worldGroup.add(ship.healthBar);
    }

    function createAimObjects() {
        var dotGeometry = new THREE.SphereGeometry(3.2, 8, 6);
        var windGeometry;

        aimDots = new THREE.InstancedMesh(dotGeometry, materials.aimGood, AIM_DOT_COUNT);
        aimDots.frustumCulled = false;
        aimDotMatrix = new THREE.Matrix4();
        worldGroup.add(aimDots);

        aimMarker = new THREE.Mesh(new THREE.RingGeometry(13, 16, 32), materials.aimMarkerGood);
        aimMarker.rotation.x = -Math.PI * 0.5;
        aimMarker.position.y = 1;
        worldGroup.add(aimMarker);

        windGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        windArrow = new THREE.Line(windGeometry, materials.wind);
        windArrow.frustumCulled = false;
        windArrow.visible = DEBUG_ENABLED;
        worldGroup.add(windArrow);
    }

    function clearWorldGroup() {
        if (!worldGroup) {
            return;
        }

        while (worldGroup.children.length > 0) {
            worldGroup.remove(worldGroup.children[0]);
        }
    }

    function createFogBoundary() {
        var ring = new THREE.Mesh(new THREE.RingGeometry(SEA_SOFT_LIMIT, SEA_HARD_LIMIT, 160), materials.fogBoundary);
        ring.rotation.x = -Math.PI * 0.5;
        ring.position.y = 0.35;
        ring.renderOrder = 1;
        worldGroup.add(ring);
    }

    function createEnemyZoneRings() {
        var i;
        var zone;
        var ring;

        if (!DEBUG_ENABLED) {
            return;
        }

        for (i = 0; i < state.enemyZones.length; i += 1) {
            zone = state.enemyZones[i];
            ring = createDebugRing(zone.r, materials.debugRed);
            ring.position.set(zone.x, 0.9, zone.z);
            zone.debugRing = ring;
            worldGroup.add(ring);
        }
    }

    function buildWorld() {
        var i;
        var rng = makeRng(state.seed ^ 0x9E3779B9);

        clearWorldGroup();
        createFogBoundary();

        for (i = 0; i < state.islands.length; i += 1) {
            createIslandMesh(state.islands[i], rng);
        }

        createEnemyZoneRings();

        state.player.mesh = createShipMesh(true);
        attachShipHelpers(state.player);
        state.player.debugRing = DEBUG_ENABLED ? createDebugRing(PLAYER_RADIUS, materials.debugGreen) : null;
        worldGroup.add(state.player.mesh);
        if (state.player.debugRing) {
            worldGroup.add(state.player.debugRing);
        }

        for (i = 0; i < state.enemies.length; i += 1) {
            state.enemies[i].mesh = createShipMesh(false);
            attachShipHelpers(state.enemies[i]);
            state.enemies[i].debugRing = DEBUG_ENABLED ? createDebugRing(ENEMY_RADIUS, materials.debugRed) : null;
            worldGroup.add(state.enemies[i].mesh);
            if (state.enemies[i].debugRing) {
                worldGroup.add(state.enemies[i].debugRing);
            }
        }

        createAimObjects();
    }

    function initThree() {
        initMaterials();

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x061019, 1);
        renderer.shadowMap.enabled = false;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x061019);
        scene.fog = new THREE.Fog(0x061019, SEA_SOFT_LIMIT * 0.62, SEA_HARD_LIMIT * 1.12);

        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
        raycaster = new THREE.Raycaster();
        groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        var ambient = new THREE.AmbientLight(0xa8c4e8, 1.8);
        var sun = new THREE.DirectionalLight(0xfff2d4, 2.6);
        sun.position.set(340, 600, 260);
        scene.add(ambient);
        scene.add(sun);

        worldGroup = new THREE.Group();
        scene.add(worldGroup);

        if (hud.minimap && hud.minimap.getContext) {
            minimapContext = hud.minimap.getContext('2d');
        }

        createWater();
        buildWorld();
        resize();
        syncMeshes();

        if (hud.loading) {
            hud.loading.hidden = true;
        }
    }

    function resize() {
        var rect = canvas.getBoundingClientRect();
        var width = Math.max(320, rect.width);
        var height = Math.max(320, rect.height);
        var aspect = width / height;
        var viewSize = 720;
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.left = -viewSize * aspect * 0.5;
        camera.right = viewSize * aspect * 0.5;
        camera.top = viewSize * 0.5;
        camera.bottom = -viewSize * 0.5;
        camera.updateProjectionMatrix();
    }

    function updateMouseWorld(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var x = ((clientX - rect.left) / rect.width) * 2 - 1;
        var y = -(((clientY - rect.top) / rect.height) * 2 - 1);
        var hit = new THREE.Vector3();

        state.mouseNdcX = x;
        state.mouseNdcY = y;
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
            state.mouseWorldX = hit.x;
            state.mouseWorldZ = hit.z;
            state.mouseInside = true;
        }
    }

    function updateCamera(dt) {
        var p = state.player;
        var distance = 740;
        var height = 520;
        var orbitInput = 0;

        if (state.input.camLeft) {
            orbitInput -= 1;
        }
        if (state.input.camRight) {
            orbitInput += 1;
        }
        state.cameraOrbit += orbitInput * dt * 1.15;

        state.cameraTargetX = lerp(state.cameraTargetX, p.x, 1 - Math.pow(0.001, dt));
        state.cameraTargetZ = lerp(state.cameraTargetZ, p.z, 1 - Math.pow(0.001, dt));

        camera.position.set(
            state.cameraTargetX + Math.sin(state.cameraOrbit) * distance,
            height,
            state.cameraTargetZ + Math.cos(state.cameraOrbit) * distance
        );
        camera.lookAt(state.cameraTargetX, 0, state.cameraTargetZ);
    }

    function updateWind(dt) {
        state.windTimer -= dt;
        if (state.windTimer <= 0) {
            state.windTargetAngle = randRange(state.rng, 0, TAU);
            state.windSpeed = randRange(state.rng, 0.74, 1.16);
            state.windTimer = randRange(state.rng, 7, 12);
        }
        state.windAngle += wrapAngle(state.windTargetAngle - state.windAngle) * dt * 0.18;
    }

    function addWakePoint(ship, dt) {
        var speed = length2(ship.vx, ship.vz);
        var fx;
        var fz;
        var i;

        if (ship.hp <= 0 || speed < 12) {
            return;
        }

        ship.wakeTimer -= dt;
        if (ship.wakeTimer <= 0) {
            fx = forwardX(ship.heading);
            fz = forwardZ(ship.heading);
            ship.wakePoints.unshift({
                x: ship.x - fx * 32,
                z: ship.z - fz * 32,
                age: 0
            });
            if (ship.wakePoints.length > WAKE_POINT_COUNT) {
                ship.wakePoints.length = WAKE_POINT_COUNT;
            }
            ship.wakeTimer = 0.10;
        }

        for (i = ship.wakePoints.length - 1; i >= 0; i -= 1) {
            ship.wakePoints[i].age += dt;
            if (ship.wakePoints[i].age > WAKE_LIFE) {
                ship.wakePoints.splice(i, 1);
            }
        }
    }

    function resolveIslandCollision(ship) {
        var radius = ship.isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS;
        var i;
        var island;
        var dx;
        var dz;
        var d;
        var nx;
        var nz;
        var minDist;
        var push;
        var into;

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            dx = ship.x - island.x;
            dz = ship.z - island.z;
            d = length2(dx, dz);
            minDist = island.r + radius * 0.72;
            if (d < minDist) {
                if (d < 0.001) {
                    nx = 1;
                    nz = 0;
                } else {
                    nx = dx / d;
                    nz = dz / d;
                }
                push = minDist - d;
                ship.x += nx * push;
                ship.z += nz * push;
                into = ship.vx * nx + ship.vz * nz;
                if (into < 0) {
                    ship.vx -= into * nx * 1.25;
                    ship.vz -= into * nz * 1.25;
                }
                ship.vx *= 0.72;
                ship.vz *= 0.72;
            }
        }
    }

    function resolveSeaBoundary(ship, dt) {
        var d = length2(ship.x, ship.z);
        var nx;
        var nz;
        var fogFactor;
        var outward;

        if (d <= SEA_SOFT_LIMIT) {
            return;
        }

        if (d < 0.001) {
            nx = 1;
            nz = 0;
        } else {
            nx = ship.x / d;
            nz = ship.z / d;
        }

        fogFactor = clamp((d - SEA_SOFT_LIMIT) / (SEA_HARD_LIMIT - SEA_SOFT_LIMIT), 0, 1);
        outward = ship.vx * nx + ship.vz * nz;

        if (outward > 0) {
            ship.vx -= nx * outward * (0.42 + fogFactor * 0.72);
            ship.vz -= nz * outward * (0.42 + fogFactor * 0.72);
        }

        ship.vx -= nx * fogFactor * 42 * dt;
        ship.vz -= nz * fogFactor * 42 * dt;

        if (d > SEA_HARD_LIMIT) {
            ship.x = nx * SEA_HARD_LIMIT;
            ship.z = nz * SEA_HARD_LIMIT;
            ship.vx *= 0.28;
            ship.vz *= 0.28;
        }

        if (ship.isPlayer && fogFactor > 0.40 && state.messageTimer <= 0) {
            setMessage('Heavy fog blocks the open sea.', 2.0);
        }
    }

    function updateShipPhysics(ship, rudder, sailDelta, dt) {
        var fx;
        var fz;
        var wx;
        var wz;
        var windDot;
        var beamFactor;
        var tailFactor;
        var headFactor;
        var sailEfficiency;
        var thrust;
        var crossWind;
        var speed;
        var turnPower;
        var damping;
        var relativeWind;
        var targetSailAngle;
        var smoothing;

        if (ship.hp <= 0) {
            ship.sinkTimer += dt;
            ship.vx *= Math.pow(0.96, dt * 60);
            ship.vz *= Math.pow(0.96, dt * 60);
            ship.x += ship.vx * dt;
            ship.z += ship.vz * dt;
            return;
        }

        ship.sail = clamp(ship.sail + sailDelta * dt * 0.82, 0, 1);
        fx = forwardX(ship.heading);
        fz = forwardZ(ship.heading);
        wx = Math.sin(state.windAngle);
        wz = Math.cos(state.windAngle);
        windDot = fx * wx + fz * wz;
        relativeWind = wrapAngle(state.windAngle - ship.heading);
        targetSailAngle = clamp(-relativeWind * 0.56, -0.98, 0.98);
        smoothing = 1 - Math.pow(0.001, dt);
        ship.sailAngle = lerp(ship.sailAngle, targetSailAngle, smoothing);

        beamFactor = Math.sqrt(Math.max(0, 1 - windDot * windDot));
        tailFactor = Math.max(0, windDot);
        headFactor = Math.max(0, -windDot);
        sailEfficiency = 0.30 + beamFactor * 0.58 + tailFactor * 0.42 + headFactor * 0.16;
        sailEfficiency = clamp(sailEfficiency, 0.34, 1.22);
        thrust = sailEfficiency * ship.sail * state.windSpeed * 82 * ship.sailPowerMul;
        crossWind = beamFactor * state.windSpeed * ship.sail * 4.2;

        ship.vx += fx * thrust * dt;
        ship.vz += fz * thrust * dt;
        ship.vx += wx * crossWind * dt;
        ship.vz += wz * crossWind * dt;

        speed = length2(ship.vx, ship.vz);
        turnPower = (0.44 + clamp(speed / 120, 0, 0.78)) * (0.36 + ship.sail * 0.82);
        ship.heading += rudder * turnPower * dt;

        damping = Math.pow(0.989, dt * 60);
        ship.vx *= damping;
        ship.vz *= damping;
        ship.x += ship.vx * dt;
        ship.z += ship.vz * dt;
        resolveIslandCollision(ship);
        addWakePoint(ship, dt);

        resolveSeaBoundary(ship, dt);

        if (ship.fireCooldown > 0) {
            ship.fireCooldown -= dt;
        }
        if (ship.fireHintCooldown > 0) {
            ship.fireHintCooldown -= dt;
        }
        if (ship.hitFlash > 0) {
            ship.hitFlash -= dt;
        }
    }

    function setPlayerSailStage(delta) {
        var p = state.player;
        var currentStage = Math.round(p.sail / SAIL_STAGE_STEP);
        var nextStage = clamp(currentStage + delta, 0, 3);
        p.sail = nextStage * SAIL_STAGE_STEP;
        if (state.messageTimer <= 0.15) {
            setMessage('Sail set to ' + Math.round(p.sail * 100) + '%.', 0.9);
        }
    }

    function updatePlayer(dt) {
        var rudder = 0;

        if (state.input.left) {
            rudder += 1;
        }
        if (state.input.right) {
            rudder -= 1;
        }

        updateShipPhysics(state.player, rudder, 0, dt);

        if (state.input.fire) {
            fireFromShip(state.player, state.mouseWorldX, state.mouseWorldZ);
            state.input.fire = false;
        }
    }

    function pickEnemyPatrolTarget(enemy) {
        var zone = {
            x: enemy.zoneX,
            z: enemy.zoneZ,
            r: enemy.zoneRadius
        };
        var point = randomPointInEnemyZone(state.rng, zone, state.islands);
        enemy.targetX = point.x;
        enemy.targetZ = point.z;
        enemy.aiTimer = randRange(state.rng, 3.2, 6.2);
    }

    function steerEnemyAwayFromIslandBuffer(enemy, buffer) {
        var dx = enemy.x - buffer.island.x;
        var dz = enemy.z - buffer.island.z;
        var d = Math.max(1, length2(dx, dz));
        var escapeRadius = buffer.navigationRadius + 140;

        enemy.targetX = buffer.island.x + dx / d * escapeRadius;
        enemy.targetZ = buffer.island.z + dz / d * escapeRadius;
        enemy.targetX = lerp(enemy.targetX, enemy.zoneX, 0.22);
        enemy.targetZ = lerp(enemy.targetZ, enemy.zoneZ, 0.22);
        enemy.aiTimer = 1.4;
    }

    function updateEnemies(dt) {
        var i;
        for (i = 0; i < state.enemies.length; i += 1) {
            updateEnemy(state.enemies[i], dt);
        }
    }

    function updateEnemy(enemy, dt) {
        var player = state.player;
        var distanceToPlayer = dist2(enemy, player);
        var desiredX = enemy.targetX;
        var desiredZ = enemy.targetZ;
        var dx;
        var dz;
        var desiredHeading;
        var desiredHeadingOverride = null;
        var turnError;
        var rudder;
        var sailDelta;
        var enemyBuffer;
        var zoneDistance;

        if (enemy.hp <= 0) {
            updateShipPhysics(enemy, 0, -1, dt);
            return;
        }

        enemy.aiTimer -= dt;
        enemyBuffer = getIslandNavigationBufferAt(enemy.x, enemy.z);
        zoneDistance = length2(enemy.x - enemy.zoneX, enemy.z - enemy.zoneZ);

        if (zoneDistance > enemy.zoneRadius * 1.45) {
            enemy.aiState = 'patrol';
            desiredX = enemy.zoneX;
            desiredZ = enemy.zoneZ;
        } else if (enemy.hp < enemy.maxHp * 0.28) {
            enemy.aiState = 'retreat';
            desiredX = enemy.zoneX;
            desiredZ = enemy.zoneZ;
        } else if (distanceToPlayer < 260) {
            enemy.aiState = 'attack';
            desiredHeadingOverride = chooseBroadsideHeading(enemy, player);
            desiredX = enemy.x + Math.sin(desiredHeadingOverride) * 160;
            desiredZ = enemy.z + Math.cos(desiredHeadingOverride) * 160;
            if (distanceToPlayer < 150) {
                desiredX += (enemy.x - player.x) * 0.45;
                desiredZ += (enemy.z - player.z) * 0.45;
            }
            if (enemy.fireCooldown <= 0) {
                fireFromShip(enemy, player.x + player.vx * 0.9, player.z + player.vz * 0.9);
            }
        } else if (distanceToPlayer < 720 && zoneDistance < enemy.zoneRadius * 1.15) {
            enemy.aiState = 'chase';
            desiredX = player.x + player.vx * 1.2;
            desiredZ = player.z + player.vz * 1.2;
        } else {
            enemy.aiState = 'patrol';
            if (enemy.aiTimer <= 0 || length2(enemy.targetX - enemy.x, enemy.targetZ - enemy.z) < 90) {
                pickEnemyPatrolTarget(enemy);
            }
            desiredX = enemy.targetX;
            desiredZ = enemy.targetZ;
            if (enemyBuffer) {
                steerEnemyAwayFromIslandBuffer(enemy, enemyBuffer);
                desiredX = enemy.targetX;
                desiredZ = enemy.targetZ;
            }
        }

        dx = desiredX - enemy.x;
        dz = desiredZ - enemy.z;
        desiredHeading = desiredHeadingOverride === null ? Math.atan2(dx, dz) : desiredHeadingOverride;
        turnError = wrapAngle(desiredHeading - enemy.heading);
        rudder = clamp(turnError * 1.75, -1, 1);
        sailDelta = enemy.sail < 0.84 ? 0.5 : 0;

        updateShipPhysics(enemy, rudder, sailDelta, dt);
    }

    function getBroadsideInfo(ship, targetX, targetZ) {
        var toX = targetX - ship.x;
        var toZ = targetZ - ship.z;
        var len = length2(toX, toZ);
        var fx;
        var fz;
        var rightX;
        var rightZ;
        var dirX;
        var dirZ;
        var side;
        var sideDot;
        var forwardDot;
        var minSideDot;

        if (len < 1) {
            len = 1;
        }

        dirX = toX / len;
        dirZ = toZ / len;
        fx = forwardX(ship.heading);
        fz = forwardZ(ship.heading);
        rightX = fz;
        rightZ = -fx;
        sideDot = dirX * rightX + dirZ * rightZ;
        forwardDot = dirX * fx + dirZ * fz;
        side = sideDot >= 0 ? 1 : -1;
        minSideDot = Math.cos(BROADSIDE_HALF_ARC);

        return {
            dirX: dirX,
            dirZ: dirZ,
            rightX: rightX,
            rightZ: rightZ,
            forwardDot: forwardDot,
            sideDot: sideDot,
            side: side,
            inArc: Math.abs(sideDot) >= minSideDot,
            len: len
        };
    }

    function getPlayerAimStatus() {
        var p = state.player;
        var shot = getShotPlan(p, state.mouseWorldX, state.mouseWorldZ);
        return {
            info: shot.info,
            shot: shot,
            canFire: shot.info.inArc && shot.rangeOk && p.fireCooldown <= 0 && p.hp > 0 && !state.gameOver,
            inArc: shot.info.inArc,
            reloading: p.fireCooldown > 0
        };
    }

    function chooseBroadsideHeading(ship, target) {
        var toTarget = Math.atan2(target.x - ship.x, target.z - ship.z);
        var leftHeading = toTarget + Math.PI * 0.5;
        var rightHeading = toTarget - Math.PI * 0.5;
        var leftError = Math.abs(wrapAngle(leftHeading - ship.heading));
        var rightError = Math.abs(wrapAngle(rightHeading - ship.heading));
        return leftError < rightError ? leftHeading : rightHeading;
    }

    function getShotPlan(ship, targetX, targetZ) {
        var info = getBroadsideInfo(ship, targetX, targetZ);
        var startX = ship.x + info.rightX * info.side * 21 + forwardX(ship.heading) * 5;
        var startY = 20;
        var startZ = ship.z + info.rightZ * info.side * 21 + forwardZ(ship.heading) * 5;
        var dx = targetX - startX;
        var dz = targetZ - startZ;
        var rawDist = Math.max(1, length2(dx, dz));
        var rangeScale = rawDist > AIM_MAX_RANGE ? AIM_MAX_RANGE / rawDist : 1;
        var endX = startX + dx * rangeScale;
        var endZ = startZ + dz * rangeScale;
        var dist = Math.max(1, length2(endX - startX, endZ - startZ));
        var flightTime = clamp(0.50 + dist / 230, 0.68, AIM_MAX_FLIGHT_TIME);
        var targetY = 1.5;
        var vx = (endX - startX) / flightTime + ship.vx * 0.12;
        var vz = (endZ - startZ) / flightTime + ship.vz * 0.12;
        var vy = (targetY - startY + 0.5 * GRAVITY * flightTime * flightTime) / flightTime;

        return {
            info: info,
            startX: startX,
            startY: startY,
            startZ: startZ,
            endX: endX,
            endZ: endZ,
            vx: vx,
            vy: clamp(vy, 48, 245),
            vz: vz,
            flightTime: flightTime,
            rangeOk: rawDist <= AIM_MAX_RANGE
        };
    }

    function fireFromShip(ship, targetX, targetZ) {
        var shot;
        var projectile;
        var mesh;
        var cooldown;

        if (ship.fireCooldown > 0 || ship.hp <= 0 || state.gameOver) {
            return false;
        }

        shot = getShotPlan(ship, targetX, targetZ);
        if (!shot.info.inArc) {
            if (ship.isPlayer && ship.fireHintCooldown <= 0) {
                setMessage('Target outside broadside arc. Turn the ship side-on before firing.', 1.8);
                ship.fireHintCooldown = 0.8;
            }
            return false;
        }
        if (!shot.rangeOk) {
            if (ship.isPlayer && ship.fireHintCooldown <= 0) {
                setMessage('Target is out of cannon range.', 1.6);
                ship.fireHintCooldown = 0.8;
            }
            return false;
        }

        mesh = createProjectileMesh();
        projectile = {
            owner: ship.isPlayer ? 'player' : 'enemy',
            damage: ship.damage,
            x: shot.startX,
            y: shot.startY,
            z: shot.startZ,
            vx: shot.vx,
            vy: shot.vy,
            vz: shot.vz,
            life: PROJECTILE_MAX_LIFE,
            mesh: mesh,
            active: true
        };

        worldGroup.add(mesh);
        state.projectiles.push(projectile);
        cooldown = ship.isPlayer ? 0.58 * ship.cannonCooldownMul : 1.15;
        ship.fireCooldown = cooldown;
        return true;
    }

    function updateProjectiles(dt) {
        var i;
        var p;
        var hit;

        for (i = state.projectiles.length - 1; i >= 0; i -= 1) {
            p = state.projectiles[i];
            if (!p.active) {
                continue;
            }

            p.life -= dt;
            p.vy -= GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;

            hit = false;
            if (p.owner === 'player') {
                hit = checkProjectileAgainstEnemies(p);
            } else {
                hit = checkProjectileAgainstPlayer(p);
            }

            if (!hit) {
                hit = checkProjectileAgainstIslands(p);
            }

            if (p.y <= 0) {
                makeSplash(p.x, p.z);
                hit = true;
            }

            if (p.life <= 0) {
                hit = true;
            }

            if (hit) {
                p.active = false;
                worldGroup.remove(p.mesh);
                state.projectiles.splice(i, 1);
            }
        }
    }

    function checkProjectileAgainstPlayer(p) {
        var player = state.player;
        if (player.hp <= 0 || p.y > 28) {
            return false;
        }
        if (length2(p.x - player.x, p.z - player.z) <= PLAYER_RADIUS) {
            applyDamage(player, p.damage);
            setMessage('Hit taken. Hit taken. Keep moving and turn for a better broadside.', 2.2);
            return true;
        }
        return false;
    }

    function checkProjectileAgainstIslands(p) {
        var i;
        var island;

        if (p.y > 36) {
            return false;
        }

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            if (length2(p.x - island.x, p.z - island.z) <= island.r * 0.95) {
                makeSplash(p.x, p.z);
                return true;
            }
        }
        return false;
    }

    function checkProjectileAgainstEnemies(p) {
        var i;
        var enemy;
        for (i = 0; i < state.enemies.length; i += 1) {
            enemy = state.enemies[i];
            if (enemy.hp <= 0 || p.y > 28) {
                continue;
            }

            if (length2(p.x - enemy.x, p.z - enemy.z) <= ENEMY_RADIUS) {
                applyDamage(enemy, p.damage);
                if (enemy.hp <= 0) {
                    sinkEnemy(enemy);
                }
                return true;
            }
        }
        return false;
    }

    function applyDamage(ship, amount) {
        ship.hp = Math.max(0, ship.hp - amount);
        ship.hitFlash = 0.22;
        if (ship.isPlayer && ship.hp <= 0) {
            state.gameOver = true;
            setMessage('Ship lost. Press New run to restart.', 10);
        }
    }

    function sinkEnemy(enemy) {
        var crateCount = 2 + Math.floor(state.rng() * 3);
        var i;
        state.player.kills += 1;
        enemy.sinkTimer = 0.01;
        setMessage('Enemy ship disabled. Cargo crates in the water.', 2.4);

        for (i = 0; i < crateCount; i += 1) {
            spawnCrate(
                enemy.x + randRange(state.rng, -42, 42),
                enemy.z + randRange(state.rng, -42, 42),
                24 + Math.floor(randRange(state.rng, 0, 42))
            );
        }
    }

    function spawnCrate(x, z, value) {
        var mesh = createCrateMesh();
        var crate = {
            x: x,
            z: z,
            value: value,
            mesh: mesh,
            bob: randRange(state.rng, 0, TAU),
            active: true
        };
        mesh.position.set(x, 8, z);
        worldGroup.add(mesh);
        state.crates.push(crate);
    }

    function updateCrates(dt) {
        var i;
        var crate;
        var p = state.player;

        for (i = state.crates.length - 1; i >= 0; i -= 1) {
            crate = state.crates[i];
            crate.bob += dt * 1.8;
            if (dist2(crate, p) < 44 && p.cargo < p.cargoCapacity) {
                p.cargo += 1;
                p.cargoValue += crate.value;
                worldGroup.remove(crate.mesh);
                state.crates.splice(i, 1);
                setMessage('Cargo recovered. Dock at a pier with F to sell it.', 2.0);
            }
        }
    }

    function makeSplash(x, z) {
        var ring = createDebugRing(10, materials.debugGreen);
        var splash = {
            x: x,
            z: z,
            life: 0.55,
            mesh: ring
        };
        ring.position.set(x, 1.3, z);
        ring.scale.setScalar(0.25);
        worldGroup.add(ring);
        state.splashes.push(splash);
    }

    function updateSplashes(dt) {
        var i;
        var splash;
        var t;

        for (i = state.splashes.length - 1; i >= 0; i -= 1) {
            splash = state.splashes[i];
            splash.life -= dt;
            t = 1 - clamp(splash.life / 0.55, 0, 1);
            splash.mesh.scale.setScalar(0.25 + t * 2.6);
            if (splash.mesh.material) {
                splash.mesh.material.opacity = Math.max(0, 0.45 * (1 - t));
            }
            if (splash.life <= 0) {
                worldGroup.remove(splash.mesh);
                state.splashes.splice(i, 1);
            }
        }
    }

    function updateDock(dt) {
        var p = state.player;
        var nearDock = false;
        var activeDockIndex = -1;
        var i;
        var island;
        var dx;
        var dz;

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            if (!island.dock) {
                continue;
            }

            dx = p.x - island.dockX;
            dz = p.z - island.dockZ;
            if (length2(dx, dz) <= DOCK_INTERACT_RADIUS) {
                nearDock = true;
                activeDockIndex = i;
                break;
            }
        }

        state.nearDock = nearDock;
        state.activeDockIndex = activeDockIndex;
        state.dockTimer = Math.max(0, state.dockTimer - dt);
        state.docked = state.dockTimer > 0 || state.dockPanelOpen;
        state.sellCooldown = Math.max(0, state.sellCooldown - dt);

        if (!state.nearDock && !state.dockPanelOpen) {
            state.docked = false;
        }

        if (state.input.dock) {
            dockAtPier();
            state.input.dock = false;
        }
    }

    function dockAtPier() {
        var island;

        if (!state.nearDock || state.activeDockIndex < 0) {
            setMessage('Move into the pier zone, then press F to dock.', 1.8);
            return;
        }

        island = state.islands[state.activeDockIndex];
        state.dockTimer = 999;
        state.docked = true;
        state.dockPanelOpen = true;
        setMessage('Docked at ' + island.name + '. Choose a service in the harbor menu.', 2.2);
        syncDockPanel();
    }

    function closeDockPanel() {
        state.dockPanelOpen = false;
        state.dockTimer = 0;
        state.docked = false;
        syncDockPanel();
    }

    function upgradeCost(type) {
        if (type === 'hull') {
            return 70 + (state.player.maxHp - 100) * 3;
        }
        if (type === 'sail') {
            return 90 + Math.round((state.player.sailPowerMul - 1) * 260);
        }
        return 110 + Math.round((1 - state.player.cannonCooldownMul) * 280);
    }

    function sellCargoAtDock() {
        var p = state.player;
        var value = p.cargoValue;

        if (!state.dockPanelOpen) {
            setMessage('Dock first, then sell cargo.', 1.6);
            return;
        }
        if (p.cargo <= 0 || value <= 0) {
            setMessage('No cargo to sell.', 1.5);
            syncDockPanel();
            return;
        }

        p.gold += value;
        p.cargo = 0;
        p.cargoValue = 0;
        setMessage('Cargo sold for ' + value + ' gold.', 2.2);
        syncDockPanel();
    }

    function buyUpgrade(slot) {
        var p = state.player;
        var cost;

        if ((!state.nearDock && !state.docked && !state.dockPanelOpen) || state.gameOver) {
            setMessage('Dock at a pier before buying upgrades.', 1.7);
            return;
        }

        if (slot === 1) {
            cost = upgradeCost('hull');
            if (p.gold < cost) {
                setMessage('Need ' + cost + ' gold for hull upgrade.', 1.7);
                syncDockPanel();
                return;
            }
            p.gold -= cost;
            p.maxHp += 20;
            p.hp = p.maxHp;
            p.cargoCapacity += 2;
            setMessage('Hull upgraded. HP and cargo capacity increased.', 2.3);
        } else if (slot === 2) {
            cost = upgradeCost('sail');
            if (p.gold < cost) {
                setMessage('Need ' + cost + ' gold for sail upgrade.', 1.7);
                syncDockPanel();
                return;
            }
            p.gold -= cost;
            p.sailPowerMul += 0.14;
            setMessage('Sail upgraded. Wind handling improved.', 2.3);
        } else if (slot === 3) {
            cost = upgradeCost('cannon');
            if (p.gold < cost) {
                setMessage('Need ' + cost + ' gold for cannon upgrade.', 1.7);
                syncDockPanel();
                return;
            }
            p.gold -= cost;
            p.damage += 10;
            p.cannonCooldownMul = Math.max(0.55, p.cannonCooldownMul - 0.08);
            setMessage('Cannon upgraded. Damage and reload improved.', 2.3);
        }
        syncDockPanel();
    }

    function syncDockPanel() {
        var p = state.player;
        var island = state.activeDockIndex >= 0 ? state.islands[state.activeDockIndex] : null;
        var hullCost = upgradeCost('hull');
        var sailCost = upgradeCost('sail');
        var cannonCost = upgradeCost('cannon');
        var buttons;
        var i;
        var slot;
        var cost;
        var label;

        if (hud.upgrade) {
            hud.upgrade.textContent = hullCost + '/' + sailCost + '/' + cannonCost;
        }
        if (!hud.dockPanel) {
            return;
        }

        hud.dockPanel.hidden = !state.dockPanelOpen;
        hud.dockPanel.classList.toggle('is-visible', state.dockPanelOpen);
        hud.dockPanel.setAttribute('aria-hidden', state.dockPanelOpen ? 'false' : 'true');

        if (hud.dockName) {
            hud.dockName.textContent = island ? island.name : 'Pier';
        }
        if (hud.dockCargo) {
            hud.dockCargo.textContent = p.cargo + '/' + p.cargoCapacity;
        }
        if (hud.dockCargoValue) {
            hud.dockCargoValue.textContent = p.cargoValue + ' gold';
        }
        if (hud.dockGold) {
            hud.dockGold.textContent = String(p.gold);
        }
        if (hud.dockHint) {
            hud.dockHint.textContent = state.messageTimer > 0 ? state.messageText : 'Sell cargo here, then buy upgrades. Esc or Close leaves the dock menu.';
        }
        if (hud.dockSell) {
            hud.dockSell.disabled = p.cargo <= 0;
            hud.dockSell.textContent = p.cargo > 0 ? 'Sell cargo - ' + p.cargoValue + ' gold' : 'Sell cargo - empty hold';
        }

        buttons = hud.dockUpgradeButtons || [];
        for (i = 0; i < buttons.length; i += 1) {
            slot = Number(buttons[i].getAttribute('data-dock-upgrade'));
            if (slot === 1) {
                cost = hullCost;
                label = 'Hull upgrade - ' + cost + ' gold (+20 HP, +2 cargo)';
            } else if (slot === 2) {
                cost = sailCost;
                label = 'Sail upgrade - ' + cost + ' gold (+wind power)';
            } else {
                cost = cannonCost;
                label = 'Cannon upgrade - ' + cost + ' gold (+damage, reload)';
            }
            buttons[i].textContent = label;
            buttons[i].disabled = p.gold < cost;
        }
    }

    function updateGame(dt) {
        if (state.paused || state.gameOver) {
            return;
        }

        if (state.dockPanelOpen) {
            state.messageTimer = Math.max(0, state.messageTimer - dt);
            return;
        }

        state.time += dt;
        state.messageTimer = Math.max(0, state.messageTimer - dt);
        updateWind(dt);
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateCrates(dt);
        updateSplashes(dt);
        updateDock(dt);
        updateRouteClear();
    }

    function updateRouteClear() {
        var alive = state.enemies.filter(function (enemy) {
            return enemy.hp > 0;
        }).length;

        if (!state.routeClear && alive === 0) {
            state.routeClear = true;
            setMessage('Route clear. Harbor traffic is open.', 8);
        }
    }

    function syncWakeLine(ship) {
        var line = ship.wakeLine;
        var attr;
        var point;
        var lastX = ship.x;
        var lastZ = ship.z;
        var i;

        if (!line) {
            return;
        }

        attr = line.geometry.attributes.position;
        for (i = 0; i < WAKE_POINT_COUNT; i += 1) {
            point = ship.wakePoints[i];
            if (point) {
                lastX = point.x;
                lastZ = point.z;
                attr.setXYZ(i, point.x, 1.1 + Math.sin(state.time * 2 + i) * 0.4, point.z);
            } else {
                attr.setXYZ(i, lastX, -1000, lastZ);
            }
        }
        attr.needsUpdate = true;
        line.visible = ship.wakePoints.length > 1 && ship.hp > 0;
    }

    function syncHealthBar(ship) {
        var bar = ship.healthBar;
        var fill;
        var ratio;
        var fullWidth;

        if (!bar) {
            return;
        }

        bar.position.set(ship.x, ship.hp > 0 ? 78 : -1000, ship.z);
        bar.visible = ship.hp > 0;
        bar.lookAt(camera.position);
        fill = bar.userData.fill;
        if (fill) {
            ratio = clamp(ship.hp / ship.maxHp, 0, 1);
            fullWidth = fill.userData.fullWidth || 38;
            fill.scale.x = ratio;
            fill.position.x = -(fullWidth * (1 - ratio)) * 0.5;
        }
    }

    function syncShipMesh(ship) {
        var mesh = ship.mesh;
        var sailMesh;
        var sailCurve;

        if (!mesh) {
            return;
        }

        mesh.position.set(ship.x, ship.hp > 0 ? 0 : -Math.min(24, ship.sinkTimer * 12), ship.z);
        mesh.rotation.y = ship.heading;
        mesh.rotation.z = ship.hp > 0 ? Math.sin(state.time * 2.5 + ship.x * 0.01) * 0.018 : ship.sinkTimer * 0.18;
        mesh.rotation.x = ship.hp > 0 ? Math.cos(state.time * 2.0 + ship.z * 0.01) * 0.015 : -ship.sinkTimer * 0.10;

        sailMesh = mesh.userData.sailMesh;
        if (sailMesh) {
            sailCurve = 0.62 + ship.sail * 0.38;
            sailMesh.scale.set(sailCurve, 1, 1);
            sailMesh.rotation.z = Math.sin(state.time * 2.2 + ship.x * 0.01) * 0.035;
        }
        if (mesh.userData.sailPivot) {
            mesh.userData.sailPivot.rotation.y = ship.sailAngle;
        }

        if (ship.debugRing) {
            ship.debugRing.position.set(ship.x, 1.1, ship.z);
            ship.debugRing.visible = DEBUG_ENABLED && ship.hp > 0;
        }

        syncWakeLine(ship);
        syncHealthBar(ship);
    }

    function syncMeshes() {
        var i;
        var p;
        var crate;
        var t;
        var simX;
        var simY;
        var simZ;
        var vx;
        var vy;
        var vz;
        var windAttr;
        var player;
        var aimStatus;

        syncShipMesh(state.player);
        for (i = 0; i < state.enemies.length; i += 1) {
            syncShipMesh(state.enemies[i]);
        }

        for (i = 0; i < state.projectiles.length; i += 1) {
            p = state.projectiles[i];
            p.mesh.position.set(p.x, p.y, p.z);
        }

        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            crate.mesh.position.set(crate.x, 7 + Math.sin(crate.bob) * 3.2, crate.z);
            crate.mesh.rotation.y += 0.01;
        }

        player = state.player;
        aimStatus = getPlayerAimStatus();
        aimDots.material = aimStatus.canFire ? materials.aimGood : materials.aimBad;
        aimDots.visible = state.mouseInside && player.hp > 0;
        aimMarker.material = aimStatus.canFire ? materials.aimMarkerGood : materials.aimMarkerBad;
        aimMarker.visible = state.mouseInside && player.hp > 0;
        aimMarker.position.set(aimStatus.shot.endX, 1.2, aimStatus.shot.endZ);
        vx = aimStatus.shot.vx;
        vy = aimStatus.shot.vy;
        vz = aimStatus.shot.vz;
        simX = aimStatus.shot.startX;
        simY = aimStatus.shot.startY;
        simZ = aimStatus.shot.startZ;

        for (i = 0; i < AIM_DOT_COUNT; i += 1) {
            t = (i / Math.max(1, AIM_DOT_COUNT - 1)) * aimStatus.shot.flightTime;
            var dotX = simX + vx * t;
            var dotY = Math.max(1.5, simY + vy * t - GRAVITY * t * t * 0.5);
            var dotZ = simZ + vz * t;
            var dotScale = 0.62 + i / AIM_DOT_COUNT * 0.42;
            aimDotMatrix.makeScale(dotScale, dotScale, dotScale);
            aimDotMatrix.setPosition(dotX, dotY, dotZ);
            aimDots.setMatrixAt(i, aimDotMatrix);
        }
        aimDots.instanceMatrix.needsUpdate = true;

        if (windArrow) {
            windArrow.visible = DEBUG_ENABLED;
            if (DEBUG_ENABLED) {
                windAttr = windArrow.geometry.attributes.position;
                windAttr.setXYZ(0, player.x, 70, player.z);
                windAttr.setXYZ(1, player.x + Math.sin(state.windAngle) * 140, 70, player.z + Math.cos(state.windAngle) * 140);
                windAttr.needsUpdate = true;
            }
        }
    }

    function mapToMini(value) {
        return 90 + (value / SEA_HARD_LIMIT) * 78;
    }

    function drawMinimap() {
        var ctx = minimapContext;
        var i;
        var island;
        var enemy;
        var crate;
        var p = state.player;
        var x;
        var y;

        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, 180, 180);
        ctx.fillStyle = 'rgba(5, 16, 24, 0.84)';
        ctx.fillRect(0, 0, 180, 180);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeRect(0.5, 0.5, 179, 179);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(90, 0);
        ctx.lineTo(90, 180);
        ctx.moveTo(0, 90);
        ctx.lineTo(180, 90);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.beginPath();
        ctx.arc(90, 90, (SEA_SOFT_LIMIT / SEA_HARD_LIMIT) * 78, 0, TAU);
        ctx.stroke();

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            x = mapToMini(island.x);
            y = mapToMini(island.z);
            ctx.fillStyle = island.dock ? 'rgba(255, 209, 102, 0.85)' : 'rgba(83, 158, 90, 0.70)';
            ctx.beginPath();
            ctx.arc(x, y, clamp(island.r / 24, 2.5, 5.5), 0, TAU);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(181, 114, 49, 0.85)';
        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            ctx.fillRect(mapToMini(crate.x) - 1.5, mapToMini(crate.z) - 1.5, 3, 3);
        }

        ctx.fillStyle = 'rgba(255, 108, 95, 0.95)';
        for (i = 0; i < state.enemies.length; i += 1) {
            enemy = state.enemies[i];
            if (enemy.hp <= 0) {
                continue;
            }
            ctx.beginPath();
            ctx.arc(mapToMini(enemy.x), mapToMini(enemy.z), 3, 0, TAU);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(mapToMini(p.x), mapToMini(p.z));
        ctx.rotate(-p.heading);
        ctx.fillStyle = 'rgba(50, 209, 160, 1)';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function updateHud() {
        var p = state.player;
        var aliveEnemies = state.enemies.filter(function (enemy) {
            return enemy.hp > 0;
        }).length;
        var speed = Math.round(length2(p.vx, p.vz));
        var debugText;

        if (hud.hp) {
            hud.hp.textContent = pad(p.hp, 3) + '/' + pad(p.maxHp, 3);
        }
        if (hud.sail) {
            hud.sail.textContent = pad(p.sail * 100, 2) + '%';
        }
        if (hud.wind) {
            hud.wind.textContent = angleName(state.windAngle) + ' ' + Math.round(state.windSpeed * 100) + '%';
        }
        if (hud.cargo) {
            hud.cargo.textContent = p.cargo + '/' + p.cargoCapacity;
        }
        if (hud.gold) {
            hud.gold.textContent = pad(p.gold, 3);
        }
        if (hud.enemies) {
            hud.enemies.textContent = pad(aliveEnemies, 2);
        }
        if (hud.reload) {
            hud.reload.textContent = p.fireCooldown <= 0 ? 'READY' : pad((1 - p.fireCooldown / (0.58 * p.cannonCooldownMul)) * 100, 2) + '%';
        }
        if (hud.dock) {
            hud.dock.textContent = state.dockPanelOpen ? 'SHOP' : (state.nearDock ? 'PRESS F' : (state.docked ? 'DOCKED' : 'NO'));
        }

        if (hud.message) {
            if (DEBUG_ENABLED) {
                debugText = 'DEBUG seed=' + state.seed + ' speed=' + speed + ' proj=' + state.projectiles.length + ' crates=' + state.crates.length;
                debugText += ' ai=' + state.enemies.map(function (enemy) { return enemy.aiState; }).join(',');
                hud.message.textContent = state.messageTimer > 0 ? state.messageText + ' | ' + debugText : debugText;
            } else {
                hud.message.textContent = state.messageTimer > 0 ? state.messageText : (state.nearDock ? 'Press F to open the pier services menu.' : 'W/S sail stages. A/D rudder. Q/E camera. Mouse aim. LMB or Space fire. Dock at a pier with F.');
            }
        }

        drawMinimap();
        syncDockPanel();

        if (hud.pauseCard) {
            hud.pauseCard.hidden = !state.paused;
            hud.pauseCard.classList.toggle('is-visible', state.paused);
            hud.pauseCard.setAttribute('aria-hidden', state.paused ? 'false' : 'true');
        }
        if (hud.pauseButton) {
            hud.pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
            hud.pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
        }
    }

    function renderFrame(now) {
        var dt;

        if (!clockStarted) {
            clockStarted = true;
            lastFrameTime = now;
        }

        dt = Math.min(0.05, (now - lastFrameTime) / 1000);
        lastFrameTime = now;
        accumulator += dt;

        while (accumulator >= FIXED_DT) {
            updateGame(FIXED_DT);
            accumulator -= FIXED_DT;
        }

        updateCamera(dt);
        updateWater(state.time);
        syncMeshes();
        updateHud();
        renderer.render(scene, camera);
        window.requestAnimationFrame(renderFrame);
    }

    function resetGame() {
        state = makeInitialState();
        accumulator = 0;
        clockStarted = false;
        buildWorld();
        syncMeshes();
        syncDockPanel();
        setMessage('New run. Catch the wind, fire broadside, and press F inside a pier zone to dock.', 4);
    }

    function togglePause() {
        state.paused = !state.paused;
        updateHud();
    }

    function onKeyDown(event) {
        if (event.repeat && event.code !== 'Space') {
            return;
        }

        if (state.dockPanelOpen) {
            if (event.code === 'Escape' || event.code === 'KeyF') {
                closeDockPanel();
                event.preventDefault();
            } else if (event.code === 'Digit1') {
                buyUpgrade(1);
                event.preventDefault();
            } else if (event.code === 'Digit2') {
                buyUpgrade(2);
                event.preventDefault();
            } else if (event.code === 'Digit3') {
                buyUpgrade(3);
                event.preventDefault();
            }
            return;
        }

        if (event.code === 'KeyW') {
            setPlayerSailStage(1);
            event.preventDefault();
        } else if (event.code === 'KeyS') {
            setPlayerSailStage(-1);
            event.preventDefault();
        } else if (event.code === 'KeyA') {
            state.input.left = true;
        } else if (event.code === 'KeyD') {
            state.input.right = true;
        } else if (event.code === 'KeyQ') {
            state.input.camLeft = true;
        } else if (event.code === 'KeyE') {
            state.input.camRight = true;
        } else if (event.code === 'Space') {
            state.input.fire = true;
            event.preventDefault();
        } else if (event.code === 'KeyF') {
            state.input.dock = true;
            event.preventDefault();
        } else if (event.code === 'KeyP') {
            togglePause();
        } else if (event.code === 'Digit1') {
            buyUpgrade(1);
        } else if (event.code === 'Digit2') {
            buyUpgrade(2);
        } else if (event.code === 'Digit3') {
            buyUpgrade(3);
        }
    }

    function onKeyUp(event) {
        if (event.code === 'KeyA') {
            state.input.left = false;
        } else if (event.code === 'KeyD') {
            state.input.right = false;
        } else if (event.code === 'KeyQ') {
            state.input.camLeft = false;
        } else if (event.code === 'KeyE') {
            state.input.camRight = false;
        } else if (event.code === 'KeyF') {
            state.input.dock = false;
        }
    }

    function installEvents() {
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('mousemove', function (event) {
            updateMouseWorld(event.clientX, event.clientY);
        });
        canvas.addEventListener('mouseenter', function (event) {
            updateMouseWorld(event.clientX, event.clientY);
            state.mouseInside = true;
        });
        canvas.addEventListener('mouseleave', function () {
            state.mouseInside = false;
        });
        canvas.addEventListener('mousedown', function (event) {
            if (state.dockPanelOpen) {
                event.preventDefault();
                return;
            }
            if (event.button === 0) {
                updateMouseWorld(event.clientX, event.clientY);
                state.input.fire = true;
                event.preventDefault();
            }
        });
        canvas.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });

        if (hud.pauseButton) {
            hud.pauseButton.addEventListener('click', togglePause);
        }
        if (hud.resetButton) {
            hud.resetButton.addEventListener('click', resetGame);
        }
        if (hud.dockClose) {
            hud.dockClose.addEventListener('click', closeDockPanel);
        }
        if (hud.dockSell) {
            hud.dockSell.addEventListener('click', sellCargoAtDock);
        }
        if (hud.dockUpgradeButtons) {
            hud.dockUpgradeButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    buyUpgrade(Number(button.getAttribute('data-dock-upgrade')));
                });
            });
        }
    }

    async function boot() {
        try {
            THREE = await import(THREE_URL);
            initThree();
            installEvents();
            setMessage('Sail and Fire loaded. W/S switch sail stages, A/D rudder, Q/E camera, LMB broadside fire.', 5);
            window.requestAnimationFrame(renderFrame);
        } catch (error) {
            if (hud.loading) {
                hud.loading.hidden = false;
                hud.loading.innerHTML = '<strong>WebGL load failed</strong><span>Check network access to Three.js CDN</span>';
            }
            if (hud.message) {
                hud.message.textContent = 'Failed to load Three.js. Check network access or browser WebGL support.';
            }
            console.error(error);
        }
    }

    boot();
}());
