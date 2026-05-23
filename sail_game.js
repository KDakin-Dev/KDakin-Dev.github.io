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
        seaFogVignette: document.querySelector('[data-sea-fog-vignette]'),
        bottomSail: document.querySelector('[data-bottom-sail]'),
        bottomSailStages: document.querySelectorAll('[data-sail-stage]'),
        bottomLeftCard: document.querySelector('[data-bottom-left-card]'),
        bottomLeftRing: document.querySelector('[data-bottom-left-ring]'),
        bottomLeftText: document.querySelector('[data-bottom-left-text]'),
        bottomRightCard: document.querySelector('[data-bottom-right-card]'),
        bottomRightRing: document.querySelector('[data-bottom-right-ring]'),
        bottomRightText: document.querySelector('[data-bottom-right-text]'),
        dockPanel: document.querySelector('[data-dock-panel]'),
        dockClose: document.querySelector('[data-dock-close]'),
        dockSell: document.querySelector('[data-dock-sell]'),
        dockRepair: document.querySelector('[data-dock-repair]'),
        dockUpgradeButtons: document.querySelectorAll('[data-dock-upgrade]'),
        dockName: document.querySelector('[data-dock="name"]'),
        dockCargo: document.querySelector('[data-dock="cargo"]'),
        dockCargoValue: document.querySelector('[data-dock="cargoValue"]'),
        dockGold: document.querySelector('[data-dock="gold"]'),
        dockHint: document.querySelector('[data-dock="hint"]'),
        resultOverlay: document.querySelector('[data-result-overlay]'),
        resultTitle: document.querySelector('[data-result-title]'),
        resultText: document.querySelector('[data-result-text]'),
        resultRestart: document.querySelector('[data-result-restart]')
    };

    var DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';
    var TAU = Math.PI * 2;
    var FIXED_DT = 1 / 60;
    var MAX_RENDER_ALPHA = 1;
    var SEA_SAFE_LIMIT = 2080;
    var SEA_TIER2_LIMIT = 2920;
    var SEA_TIER3_LIMIT = 3760;
    var SEA_FOG_LIMIT = 4360;
    var SEA_DANGER_LIMIT = SEA_TIER2_LIMIT;
    var SEA_LIMIT = SEA_FOG_LIMIT;
    var SEA_SOFT_LIMIT = SEA_SAFE_LIMIT;
    var SEA_HARD_LIMIT = SEA_FOG_LIMIT;
    var WATER_SIZE = 10240;
    var WATER_OVERLAY_Y = 10;
    var WATER_TRAIL_Y = 6.8;
    var WATER_DEBUG_Y = 11;
    var GRAVITY = 160;
    var PROJECTILE_MAX_LIFE = 3.2;
    var BROADSIDE_HALF_ARC = 0.82;
    var AIM_DOT_COUNT = 30;
    var AIM_DOT_MIN_COUNT = 3;
    var AIM_DOT_SPACING = 42;
    var AIM_MAX_FLIGHT_TIME = 3.0;
    var AIM_MAX_RANGE = 520;
    var AIM_ZONE_INNER_RANGE = 42;
    var AIM_ZONE_SEGMENTS = 40;
    var AIM_ZONE_ALPHA_IDLE = 0.115;
    var AIM_ZONE_ALPHA_ACTIVE = 0.225;
    var AIM_ZONE_ALPHA_BAD = 0.205;
    var AIM_ZONE_ALPHA_COOLDOWN = 0.135;
    var AIM_ZONE_EDGE_ALPHA_MIN = 0.48;
    var AIM_ZONE_RADIUS_ALPHA_MIN = 0.42;
    var PLAYER_CANNON_RELOAD_BASE = 0.75;
    var ENEMY_CANNON_RELOAD_BASE = 1.15;
    var REPAIR_COST_PER_HP = 1;
    var GUARDED_LOOT_TIER1_COUNT = 5;
    var GUARDED_LOOT_TIER2_COUNT = 7;
    var GUARDED_LOOT_TIER3_COUNT = 3;
    var ENEMY_ATTACK_RANGE = 286;
    var ENEMY_CHASE_RANGE = 792;
    var WIND_RIBBON_COUNT = 18;
    var WIND_RIBBON_POINTS = 9;
    var WIND_RIBBON_LENGTH = 145;
    var WIND_RIBBON_WIDTH = 3.2;
    var WIND_RIBBON_Y = 38;
    var WIND_RIBBON_SCREEN_X = 500;
    var WIND_RIBBON_SCREEN_Z = 350;
    var WIND_RIBBON_LIFE_MIN = 1.35;
    var WIND_RIBBON_LIFE_MAX = 2.55;
    var WIND_RIBBON_CYCLE_MIN = 6.4;
    var WIND_RIBBON_CYCLE_MAX = 10.2;
    var CANNON_SMOKE_LIFE = 0.58;
    var CANNON_SMOKE_MAX = 44;
    var CANNON_RECOIL_TIME = 0.34;
    var WAKE_CURVE_SAMPLES = 96;
    var WAKE_MIN_SPEED = 8;
    var WAKE_FULL_SPEED = 150;
    var WAKE_SAMPLE_DISTANCE_SLOW = 7.4;
    var WAKE_SAMPLE_DISTANCE_FAST = 5.2;
    var WAKE_EMITTER_SIDE_OFFSET = 20;
    var WAKE_EMITTER_FORWARD_OFFSET = 30;
    var WAKE_INNER_WIDTH = 0.45;
    var SAIL_STAGE_STEP = 1 / 3;
    var PLAYER_RADIUS = 24;
    var ENEMY_RADIUS = 23;
    var DOCK_INTERACT_RADIUS = 72;
    var ISLAND_SHORE_BUFFER = 230;
    var SHALLOW_WATER_WIDTH = 208;
    var WATER_SEGMENTS = 180;
    var ISLAND_TOTAL_COUNT = 10;
    var TRADING_ISLAND_COUNT = 1;
    var WILD_ISLAND_COUNT = ISLAND_TOTAL_COUNT - TRADING_ISLAND_COUNT;
    var ISLAND_MIN_GAP = 460;
    var ISLAND_DOCK_NEAR_GAP = 760;
    var TRADING_ISLAND_MIN_GAP = 1300;
    var ISLAND_PLACEMENT_ATTEMPTS = 180;
    var ENEMY_SHORE_CLEARANCE = 360;
    var ENEMY_TIER1_ZONE_COUNT = 5;
    var ENEMY_TIER2_ZONE_COUNT = 4;
    var ENEMY_TIER3_ZONE_COUNT = 1;
    var ENEMY_TIER1_SHIP_COUNT = 7;
    var ENEMY_TIER2_SHIP_COUNT = 10;
    var ENEMY_TIER3_ESCORTS_PER_ZONE = 2;
    var ENEMY_TIER3_BOSSES_PER_ZONE = 1;
    var ENEMY_TIER1_ZONE_RADIUS = 360;
    var ENEMY_TIER2_ZONE_RADIUS = 500;
    var ENEMY_TIER3_ZONE_RADIUS = 620;
    var ENEMY_TIER2_HP_MUL = 1.55;
    var ENEMY_TIER2_DAMAGE_MUL = 1.35;
    var ENEMY_TIER2_RELOAD_MUL = 0.82;
    var ENEMY_TIER2_SAIL_POWER_MUL = 1.07;
    var ENEMY_TIER2_SCALE = 1.12;
    var ENEMY_TIER3_HP_MUL = 3.84;
    var ENEMY_TIER3_DAMAGE_MUL = 1.75;
    var ENEMY_TIER3_RELOAD_MUL = 0.72;
    var ENEMY_TIER3_SAIL_POWER_MUL = 1.03;
    var ENEMY_TIER3_SCALE = 1.70;
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
    var aimZoneLeft = null;
    var aimZoneRight = null;
    var windArrow = null;
    var windRibbonMesh = null;
    var minimapContext = null;
    var MINIMAP_SIZE = 220;
    var MINIMAP_CENTER = MINIMAP_SIZE * 0.5;
    var MINIMAP_WORLD_RADIUS = 98;
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

    function lerpAngle(a, b, t) {
        return a + wrapAngle(b - a) * t;
    }

    function rememberShipTransform(ship) {
        ship.prevX = ship.x;
        ship.prevZ = ship.z;
        ship.prevHeading = ship.heading;
        ship.prevSailAngle = ship.sailAngle;
        ship.prevSinkTimer = ship.sinkTimer;
    }

    function sampleShipTransform(ship, alpha) {
        var t = clamp(alpha, 0, MAX_RENDER_ALPHA);

        if (typeof ship.prevX !== 'number' || typeof ship.prevZ !== 'number') {
            rememberShipTransform(ship);
        }

        return {
            x: lerp(ship.prevX, ship.x, t),
            z: lerp(ship.prevZ, ship.z, t),
            heading: lerpAngle(ship.prevHeading, ship.heading, t),
            sailAngle: lerpAngle(ship.prevSailAngle, ship.sailAngle, t),
            sinkTimer: lerp(ship.prevSinkTimer, ship.sinkTimer, t)
        };
    }

    function renderSimulationTime(alpha) {
        if (state.paused || state.dockPanelOpen || state.gameOver || state.time <= 0) {
            return state.time;
        }

        return Math.max(0, state.time - FIXED_DT + clamp(alpha, 0, MAX_RENDER_ALPHA) * FIXED_DT);
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
            prevX: x,
            prevZ: z,
            vx: 0,
            vz: 0,
            heading: heading,
            prevHeading: heading,
            sail: isPlayer ? 0.55 : 0.78,
            sailAngle: 0,
            prevSailAngle: 0,
            hp: isPlayer ? 100 : 78,
            maxHp: isPlayer ? 100 : 78,
            cargo: 0,
            cargoValue: 0,
            cargoCapacity: isPlayer ? 6 : 2,
            gold: 0,
            hitFlash: 0,
            sinkTimer: 0,
            prevSinkTimer: 0,
            leftCannonCooldown: 0,
            rightCannonCooldown: 0,
            fireHintCooldown: 0,
            wakeLeft: null,
            wakeRight: null,
            wakeLeftSamples: [],
            wakeRightSamples: [],
            wakeDistance: 0,
            wakePrevX: x,
            wakePrevZ: z,
            wakePrevHeading: heading,
            healthBar: null,
            aiTimer: 0,
            aiState: 'patrol',
            targetX: x,
            targetZ: z,
            isPlayer: isPlayer,
            mesh: null,
            debugRing: null,
            damage: isPlayer ? 32 : 18,
            cannonCooldownMul: 1,
            sailPowerMul: 1,
            zoneTier: isPlayer ? 'player' : 'tier1',
            visualScale: isPlayer ? 1.0 : 0.95,
            collisionRadius: isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS,
            doubleShot: false,
            recoilTimer: 0,
            recoilSide: 0,
            recoilStrength: 0
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
                angle: rotation + i * TAU / Math.max(1, TRADING_ISLAND_COUNT),
                minRadius: 980,
                maxRadius: 1740,
                angleJitter: 0.24,
                minIslandRadius: 64,
                maxIslandRadius: 100
            });
        }

        for (i = 0; i < WILD_ISLAND_COUNT; i += 1) {
            zones.push({
                dock: false,
                angle: rotation + (i + 0.5) * TAU / Math.max(1, WILD_ISLAND_COUNT),
                minRadius: i % 3 === 0 ? 465 : 750,
                maxRadius: i % 3 === 0 ? 1480 : 1780,
                angleJitter: 0.30,
                minIslandRadius: i % 4 === 0 ? 36 : (i % 4 === 1 ? 56 : (i % 4 === 2 ? 78 : 44)),
                maxIslandRadius: i % 4 === 0 ? 60 : (i % 4 === 1 ? 98 : (i % 4 === 2 ? 132 : 78))
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
        var wave = 0.045 * Math.sin(a * 3 + (island.shapeSeedA || 0)) + 0.032 * Math.sin(a * 7 + (island.shapeSeedB || 0));
        var factor = 0.96 + wave;
        var xScale;
        var zScale;
        var ellipse;
        var bite;
        var bayAngle = island.shapeSeedC || 0;

        if (shape === 'trade') {
            return 1.0;
        }

        if (shape === 'oval') {
            xScale = 1.34;
            zScale = 0.70;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            factor *= ellipse;
        } else if (shape === 'long') {
            xScale = 1.78;
            zScale = 0.46;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            factor *= ellipse;
        } else if (shape === 'bay') {
            bite = smoothstep(0.10, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= 1.10 - bite * 0.42;
        } else if (shape === 'crescent') {
            xScale = 1.42;
            zScale = 0.78;
            ellipse = 1 / Math.sqrt((Math.sin(a) * Math.sin(a)) / (xScale * xScale) + (Math.cos(a) * Math.cos(a)) / (zScale * zScale));
            bite = smoothstep(-0.10, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= ellipse * (1.04 - bite * 0.58);
        } else if (shape === 'cove') {
            bite = smoothstep(0.00, 1.0, Math.cos(wrapAngle(a - bayAngle)));
            factor *= 0.98 + 0.14 * Math.sin(a + (island.shapeSeedA || 0));
            factor *= 1.06 - bite * 0.50;
            factor *= 0.84 + 0.24 * smoothstep(-0.60, 1.0, Math.sin(a));
        }

        return clamp(factor, 0.24, 1.82);
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

    function getEnemyZoneCount(tier) {
        if (tier === 'tier3') {
            return ENEMY_TIER3_ZONE_COUNT;
        }
        if (tier === 'tier2') {
            return ENEMY_TIER2_ZONE_COUNT;
        }
        return ENEMY_TIER1_ZONE_COUNT;
    }

    function getEnemyZoneBaseRadius(tier) {
        if (tier === 'tier3') {
            return ENEMY_TIER3_ZONE_RADIUS;
        }
        if (tier === 'tier2') {
            return ENEMY_TIER2_ZONE_RADIUS;
        }
        return ENEMY_TIER1_ZONE_RADIUS;
    }

    function getEnemyZoneMinRadius(tier) {
        if (tier === 'tier3') {
            return SEA_TIER2_LIMIT + 260;
        }
        if (tier === 'tier2') {
            return SEA_SAFE_LIMIT + 240;
        }
        return 620;
    }

    function getEnemyZoneMaxRadius(tier) {
        if (tier === 'tier3') {
            return SEA_TIER3_LIMIT - 300;
        }
        if (tier === 'tier2') {
            return SEA_TIER2_LIMIT - 240;
        }
        return SEA_SAFE_LIMIT - 260;
    }

    function makeEnemyZone(rng, islands, index, tier) {
        var zoneCount = getEnemyZoneCount(tier);
        var baseRadius = getEnemyZoneBaseRadius(tier);
        var minRadius = getEnemyZoneMinRadius(tier);
        var maxRadius = getEnemyZoneMaxRadius(tier);
        var attempt;
        var angle;
        var radius;
        var x;
        var z;

        for (attempt = 0; attempt < 120; attempt += 1) {
            angle = randRange(rng, 0, TAU);
            radius = randRange(rng, minRadius, maxRadius);
            x = Math.sin(angle) * radius;
            z = Math.cos(angle) * radius;
            if (isPointClearOfIslandList(x, z, islands, ENEMY_SHORE_CLEARANCE + baseRadius * 0.30)) {
                return {
                    x: x,
                    z: z,
                    r: baseRadius + randRange(rng, -65, 95),
                    tier: tier
                };
            }
        }

        angle = (index / Math.max(1, zoneCount)) * TAU + (tier === 'tier3' ? 0.92 : (tier === 'tier2' ? 0.58 : 0.25));
        radius = (minRadius + maxRadius) * 0.5;
        return {
            x: Math.sin(angle) * radius,
            z: Math.cos(angle) * radius,
            r: baseRadius,
            tier: tier
        };
    }

    function getEnemyZoneOuterLimit(zone) {
        if (zone.tier === 'tier3') {
            return SEA_TIER3_LIMIT - 160;
        }
        if (zone.tier === 'tier2') {
            return SEA_TIER2_LIMIT - 160;
        }
        return SEA_SAFE_LIMIT - 180;
    }

    function randomPointInEnemyZone(rng, zone, islands) {
        var attempt;
        var angle;
        var radius;
        var x;
        var z;
        var outerLimit = getEnemyZoneOuterLimit(zone);

        for (attempt = 0; attempt < 80; attempt += 1) {
            angle = randRange(rng, 0, TAU);
            radius = Math.sqrt(rng()) * zone.r;
            x = zone.x + Math.sin(angle) * radius;
            z = zone.z + Math.cos(angle) * radius;
            if (length2(x, z) < outerLimit && isPointClearOfIslandList(x, z, islands, ENEMY_SHORE_CLEARANCE)) {
                return { x: x, z: z };
            }
        }

        return { x: zone.x, z: zone.z };
    }

    function applyEnemyTierStats(enemy, tier) {
        enemy.zoneTier = tier || 'tier1';

        if (enemy.zoneTier === 'tier3') {
            enemy.maxHp = Math.round(enemy.maxHp * ENEMY_TIER3_HP_MUL);
            enemy.hp = enemy.maxHp;
            enemy.damage = Math.round(enemy.damage * ENEMY_TIER3_DAMAGE_MUL);
            enemy.cannonCooldownMul *= ENEMY_TIER3_RELOAD_MUL;
            enemy.sailPowerMul *= ENEMY_TIER3_SAIL_POWER_MUL;
            enemy.visualScale = ENEMY_TIER3_SCALE;
            enemy.collisionRadius = ENEMY_RADIUS * ENEMY_TIER3_SCALE;
            enemy.doubleShot = true;
            return;
        }

        if (enemy.zoneTier === 'tier2') {
            enemy.maxHp = Math.round(enemy.maxHp * ENEMY_TIER2_HP_MUL);
            enemy.hp = enemy.maxHp;
            enemy.damage = Math.round(enemy.damage * ENEMY_TIER2_DAMAGE_MUL);
            enemy.cannonCooldownMul *= ENEMY_TIER2_RELOAD_MUL;
            enemy.sailPowerMul *= ENEMY_TIER2_SAIL_POWER_MUL;
            enemy.visualScale = ENEMY_TIER2_SCALE;
            enemy.collisionRadius = ENEMY_RADIUS * ENEMY_TIER2_SCALE;
            return;
        }

        enemy.visualScale = 0.95;
        enemy.collisionRadius = ENEMY_RADIUS;
    }

    function applyEnemyZoneDifficulty(enemy, zone, tierOverride) {
        var tier = tierOverride || (zone ? zone.tier : 'tier1');
        applyEnemyTierStats(enemy, tier);
    }

    function makeCrateData(x, z, value, kind) {
        return {
            x: x,
            z: z,
            value: value,
            kind: kind || 'cargo',
            mesh: null,
            bob: randRange(state ? state.rng : Math.random, 0, TAU)
        };
    }

    function guardedLootValue(rng, tier, kind) {
        if (tier === 'tier3') {
            return kind === 'gold' ? Math.floor(randRange(rng, 95, 135)) : Math.floor(randRange(rng, 70, 105));
        }
        if (tier === 'tier2') {
            return kind === 'gold' ? Math.floor(randRange(rng, 55, 82)) : Math.floor(randRange(rng, 42, 68));
        }
        return kind === 'gold' ? Math.floor(randRange(rng, 24, 42)) : Math.floor(randRange(rng, 24, 48));
    }

    function generateGuardedLoot(rng, zones, islands) {
        var crates = [];
        var counts = { tier1: 0, tier2: 0, tier3: 0 };
        var limits = {
            tier1: GUARDED_LOOT_TIER1_COUNT,
            tier2: GUARDED_LOOT_TIER2_COUNT,
            tier3: GUARDED_LOOT_TIER3_COUNT
        };
        var i;
        var zone;
        var point;
        var kind;
        var value;

        for (i = 0; i < zones.length; i += 1) {
            zone = zones[i];
            if (counts[zone.tier] >= limits[zone.tier]) {
                continue;
            }
            point = randomPointInEnemyZone(rng, zone, islands);
            kind = (zone.tier === 'tier1' && i % 2 === 0) || (zone.tier !== 'tier1' && i % 3 !== 0) ? 'cargo' : 'gold';
            value = guardedLootValue(rng, zone.tier, kind);
            crates.push({
                x: point.x,
                z: point.z,
                value: value,
                kind: kind,
                mesh: null,
                bob: randRange(rng, 0, TAU)
            });
            counts[zone.tier] += 1;
        }

        return crates;
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
        var tier1Zones = [];
        var tier2Zones = [];
        var tier3Zones = [];
        var tradeIndex = 1;
        var wildIndex = 1;
        var bossIndex;
        var escortIndex;

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
            mesh: null
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
                mesh: null
            }, makeIslandShapeData(zone.dock ? 'trade' : pickWildIslandShape(wildIndex, rng), rng)));
        }

        for (i = 0; i < ENEMY_TIER1_ZONE_COUNT; i += 1) {
            zone = makeEnemyZone(rng, islands, i, 'tier1');
            tier1Zones.push(zone);
            enemyZones.push(zone);
        }
        for (i = 0; i < ENEMY_TIER2_ZONE_COUNT; i += 1) {
            zone = makeEnemyZone(rng, islands, i, 'tier2');
            tier2Zones.push(zone);
            enemyZones.push(zone);
        }
        for (i = 0; i < ENEMY_TIER3_ZONE_COUNT; i += 1) {
            zone = makeEnemyZone(rng, islands, i, 'tier3');
            tier3Zones.push(zone);
            enemyZones.push(zone);
        }

        for (i = 0; i < ENEMY_TIER1_SHIP_COUNT; i += 1) {
            zone = tier1Zones[i % tier1Zones.length];
            spawn = randomPointInEnemyZone(rng, zone, islands);
            enemy = makeShip(spawn.x, spawn.z, randRange(rng, 0, TAU), false);
            applyEnemyZoneDifficulty(enemy, zone, 'tier1');
            enemy.zoneX = zone.x;
            enemy.zoneZ = zone.z;
            enemy.zoneRadius = zone.r;
            enemy.targetX = spawn.x;
            enemy.targetZ = spawn.z;
            enemies.push(enemy);
        }

        for (i = 0; i < ENEMY_TIER2_SHIP_COUNT; i += 1) {
            zone = tier2Zones[i % tier2Zones.length];
            spawn = randomPointInEnemyZone(rng, zone, islands);
            enemy = makeShip(spawn.x, spawn.z, randRange(rng, 0, TAU), false);
            applyEnemyZoneDifficulty(enemy, zone, 'tier2');
            enemy.zoneX = zone.x;
            enemy.zoneZ = zone.z;
            enemy.zoneRadius = zone.r;
            enemy.targetX = spawn.x;
            enemy.targetZ = spawn.z;
            enemies.push(enemy);
        }

        for (bossIndex = 0; bossIndex < tier3Zones.length; bossIndex += 1) {
            zone = tier3Zones[bossIndex];
            for (escortIndex = 0; escortIndex < ENEMY_TIER3_ESCORTS_PER_ZONE; escortIndex += 1) {
                spawn = randomPointInEnemyZone(rng, zone, islands);
                enemy = makeShip(spawn.x, spawn.z, randRange(rng, 0, TAU), false);
                applyEnemyZoneDifficulty(enemy, zone, 'tier2');
                enemy.zoneX = zone.x;
                enemy.zoneZ = zone.z;
                enemy.zoneRadius = zone.r;
                enemy.targetX = spawn.x;
                enemy.targetZ = spawn.z;
                enemies.push(enemy);
            }

            for (i = 0; i < ENEMY_TIER3_BOSSES_PER_ZONE; i += 1) {
                spawn = randomPointInEnemyZone(rng, zone, islands);
                enemy = makeShip(spawn.x, spawn.z, randRange(rng, 0, TAU), false);
                applyEnemyZoneDifficulty(enemy, zone, 'tier3');
                enemy.zoneX = zone.x;
                enemy.zoneZ = zone.z;
                enemy.zoneRadius = zone.r;
                enemy.targetX = spawn.x;
                enemy.targetZ = spawn.z;
                enemies.push(enemy);
            }
        }

        return {
            seed: seed,
            rng: rng,
            time: 0,
            paused: false,
            gameOver: false,
            resultType: '',
            routeClear: false,
            docked: false,
            nearDock: false,
            activeDockIndex: -1,
            dockPanelOpen: false,
            dockTimer: 0,
            player: makeShip(-250, -190, 0.35, true),
            enemies: enemies,
            enemyZones: enemyZones,
            islands: islands,
            crates: generateGuardedLoot(rng, enemyZones, islands),
            projectiles: [],
            splashes: [],
            smokePuffs: [],
            windAngle: randRange(rng, 0, TAU),
            windTargetAngle: randRange(rng, 0, TAU),
            windSpeed: randRange(rng, 0.78, 1.08),
            windTimer: 5,
            cameraTargetX: -250,
            cameraTargetZ: -190,
            cameraOrbit: Math.PI * 0.25,
            mouseWorldX: 0,
            mouseWorldZ: 0,
            mouseInside: false,
            messageText: 'W/S sail stages. A/D rudder. Q/E camera. Hold Space or LMB to aim, release to fire. F docks at piers.',
            messageTimer: 0,
            input: {
                left: false,
                right: false,
                camLeft: false,
                camRight: false,
                aimHeld: false,
                aimSource: '',
                fireReleaseQueued: false,
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

    function makeWaterOverlayMaterial(material) {
        material.depthTest = false;
        material.depthWrite = false;
        return material;
    }

    function makeWakeLaneMaterial() {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthTest: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uColor: { value: new THREE.Color(0xeaf8ff) },
                uOpacity: { value: 0.54 }
            },
            vertexShader: [
                'attribute float aAlpha;',
                'varying float vAlpha;',
                'void main() {',
                '    vAlpha = aAlpha;',
                '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uColor;',
                'uniform float uOpacity;',
                'varying float vAlpha;',
                'void main() {',
                '    gl_FragColor = vec4(uColor, uOpacity * vAlpha);',
                '}'
            ].join('\n')
        });
    }

    function makeWindRibbonMaterial() {
        return makeWaterOverlayMaterial(new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uColor: { value: new THREE.Color(0xdffbff) },
                uOpacity: { value: 0.34 }
            },
            vertexShader: [
                'attribute float aAlpha;',
                'varying float vAlpha;',
                'void main() {',
                '    vAlpha = aAlpha;',
                '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uColor;',
                'uniform float uOpacity;',
                'varying float vAlpha;',
                'void main() {',
                '    gl_FragColor = vec4(uColor, uOpacity * vAlpha);',
                '}'
            ].join('\n')
        }));
    }

    function makeAimZoneMaterial(color, opacity) {
        return makeWaterOverlayMaterial(new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uOpacity: { value: opacity }
            },
            vertexShader: [
                'attribute float aAlpha;',
                'varying float vAlpha;',
                'void main() {',
                '    vAlpha = aAlpha;',
                '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uColor;',
                'uniform float uOpacity;',
                'varying float vAlpha;',
                'void main() {',
                '    gl_FragColor = vec4(uColor, uOpacity * vAlpha);',
                '}'
            ].join('\n')
        }));
    }

    function setOverlayObject(object, renderOrder) {
        object.renderOrder = renderOrder || 20;
        object.frustumCulled = false;
        return object;
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
            goldCrate: makeMaterial(0xf1c85b, 0.92, 0.0),
            cargoCrate: makeMaterial(0x9a6a3a, 0.88, 0.0),
            dock: makeMaterial(0x6b472a, 0.88, 0.0),
            dockZone: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xe0b565, wireframe: true, transparent: true, opacity: 0.50 })),
            fogBoundary: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0x061019, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })),
            debugGreen: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.45 })),
            debugRed: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xff6c5f, wireframe: true, transparent: true, opacity: 0.40 })),
            wind: makeWaterOverlayMaterial(new THREE.LineBasicMaterial({ color: 0x63a6ff, transparent: true, opacity: 0.32 })),
            windRibbon: makeWindRibbonMaterial(),
            smokePuff: new THREE.MeshBasicMaterial({ color: 0xc9d0d1, transparent: true, opacity: 0.34, depthWrite: false }),
            splashRing: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.45 })),
            wakeLane: makeWakeLaneMaterial(),
            hpBack: new THREE.MeshBasicMaterial({ color: 0x120e12, transparent: true, opacity: 0.82 }),
            hpFill: new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.92 }),
            aimGood: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.88 })),
            aimBad: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xff5d55, transparent: true, opacity: 0.90 })),
            aimCooldown: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xc8d3dc, transparent: true, opacity: 0.62 })),
            aimMarkerGood: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.58 })),
            aimMarkerBad: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xff5d55, wireframe: true, transparent: true, opacity: 0.72 })),
            aimMarkerCooldown: makeWaterOverlayMaterial(new THREE.MeshBasicMaterial({ color: 0xc8d3dc, wireframe: true, transparent: true, opacity: 0.52 })),
            aimZoneFill: makeAimZoneMaterial(0x32d1a0, AIM_ZONE_ALPHA_IDLE),
            aimZoneFillActive: makeAimZoneMaterial(0x32d1a0, AIM_ZONE_ALPHA_ACTIVE),
            aimZoneFillBad: makeAimZoneMaterial(0xff5d55, AIM_ZONE_ALPHA_BAD),
            aimZoneFillCooldown: makeAimZoneMaterial(0xc8d3dc, AIM_ZONE_ALPHA_COOLDOWN)
        };

        materials.hullPlayer.side = THREE.DoubleSide;
        materials.hullEnemy.side = THREE.DoubleSide;
        materials.sailPlayer.side = THREE.DoubleSide;
        materials.sailEnemy.side = THREE.DoubleSide;
    }

    function islandShallowWaterWidth(island) {
        return clamp(island.r * 1.17, 99, SHALLOW_WATER_WIDTH);
    }

    function computeWaterColorAt(worldX, worldZ) {
        var distanceFromCenter = length2(worldX, worldZ);
        var color = new THREE.Color(0x2a7191);
        var tier2Water = new THREE.Color(0x144357);
        var tier3Water = new THREE.Color(0x081e2c);
        var fogWater = new THREE.Color(0x040b11);
        var shallow = new THREE.Color(0x58c6bd);
        var tier2Factor = smoothstep(SEA_SAFE_LIMIT * 0.88, SEA_TIER2_LIMIT, distanceFromCenter);
        var tier3Factor = smoothstep(SEA_TIER2_LIMIT * 0.92, SEA_TIER3_LIMIT, distanceFromCenter);
        var fogFactor = smoothstep(SEA_TIER3_LIMIT, SEA_FOG_LIMIT, distanceFromCenter);
        var shallowFactor = 0;
        var i;
        var island;
        var distanceToCenter;
        var distanceFromCoast;
        var shallowWidth;

        color.lerp(tier2Water, tier2Factor * 0.68);
        color.lerp(tier3Water, tier3Factor * 0.82);
        color.lerp(fogWater, fogFactor * 0.92);

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
        waterPositions = geometry.attributes.position;
        waterBasePositions = new Float32Array(waterPositions.array.length);
        waterBasePositions.set(waterPositions.array);
        scene.add(mesh);
        waterMesh = mesh;
    }

    function sampleWaterWave(worldX, worldZ, time) {
        var wave = Math.sin(worldX * 0.010 + time * 1.25) * 3.0;
        wave += Math.cos((-worldZ) * 0.012 - time * 1.05) * 2.2;
        wave += Math.sin((worldX - worldZ) * 0.006 + time * 0.85) * 1.4;
        return wave;
    }

    function sampleFloatHeight(worldX, worldZ, time) {
        return sampleWaterWave(worldX, worldZ, time) * 0.24;
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

        for (i = 0; i < arr.length; i += 3) {
            x = base[i];
            y = base[i + 1];
            arr[i + 2] = sampleWaterWave(x, -y, time);
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
        var dockRing;
        var debugRing;

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
            dockRing = createFlatRing(DOCK_INTERACT_RADIUS, materials.dockZone);
            dockRing.position.set(island.dockX, WATER_DEBUG_Y, island.dockZ);
            worldGroup.add(dockRing);
        } else {
            island.dockX = island.x;
            island.dockZ = island.z;
        }

        group.position.set(island.x, 0, island.z);
        island.mesh = group;
        worldGroup.add(group);

        if (DEBUG_ENABLED) {
            debugRing = createFlatRing(island.r, materials.debugGreen);
            debugRing.position.set(island.x, WATER_DEBUG_Y, island.z);
            worldGroup.add(debugRing);
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

    function createCrateMesh(kind) {
        var group = new THREE.Group();
        var isGold = kind === 'gold';
        var bodyMaterial = isGold ? materials.goldCrate : materials.cargoCrate;
        var box = new THREE.Mesh(new THREE.BoxGeometry(isGold ? 17 : 20, isGold ? 13 : 15, isGold ? 17 : 20), bodyMaterial);
        var bandA = new THREE.Mesh(new THREE.BoxGeometry(isGold ? 19 : 22, isGold ? 15 : 17, 3), materials.dock);
        var bandB = new THREE.Mesh(new THREE.BoxGeometry(3, isGold ? 15 : 17, isGold ? 19 : 22), materials.dock);
        var lid = new THREE.Mesh(new THREE.BoxGeometry(isGold ? 19 : 22, 3, isGold ? 19 : 22), isGold ? materials.goldCrate : materials.crate);
        box.position.y = 8;
        bandA.position.y = 8.5;
        bandB.position.y = 8.6;
        lid.position.y = 16;
        group.add(box);
        group.add(bandA);
        group.add(bandB);
        group.add(lid);
        group.userData.kind = isGold ? 'gold' : 'cargo';
        return group;
    }

    function createFlatRing(radius, material) {
        var mat = material && material.clone ? material.clone() : material;
        var ring = new THREE.Mesh(new THREE.RingGeometry(radius - 1.5, radius + 1.5, 64), mat);
        ring.rotation.x = -Math.PI * 0.5;
        setOverlayObject(ring, 22);
        return ring;
    }

    function createWakeLaneMesh() {
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(WAKE_CURVE_SAMPLES * 2 * 3);
        var alphas = new Float32Array(WAKE_CURVE_SAMPLES * 2);
        var indices = [];
        var i;

        for (i = 0; i < WAKE_CURVE_SAMPLES - 1; i += 1) {
            indices.push(i * 2, i * 2 + 1, i * 2 + 2);
            indices.push(i * 2 + 1, i * 2 + 3, i * 2 + 2);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
        geometry.setIndex(indices);
        geometry.setDrawRange(0, 0);

        return setOverlayObject(new THREE.Mesh(geometry, materials.wakeLane.clone()), 18);
    }

    function createWindRibbonMesh(rng) {
        var stripCount = WIND_RIBBON_COUNT;
        var pointCount = WIND_RIBBON_POINTS;
        var vertexCount = stripCount * pointCount * 2;
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(vertexCount * 3);
        var alphas = new Float32Array(vertexCount);
        var indices = [];
        var seeds = [];
        var strip;
        var point;
        var index;
        var nextIndex;
        var sideIndex;

        for (strip = 0; strip < stripCount; strip += 1) {
            seeds.push({
                screenX: randRange(rng, -1, 1),
                screenZ: randRange(rng, -1, 1),
                phaseA: randRange(rng, 0, TAU),
                phaseB: randRange(rng, 0, TAU),
                speed: randRange(rng, 0.72, 1.22),
                wiggle: randRange(rng, 8, 18),
                lengthMul: randRange(rng, 0.72, 1.25),
                widthMul: randRange(rng, 0.70, 1.18),
                opacity: randRange(rng, 0.34, 0.76),
                life: randRange(rng, WIND_RIBBON_LIFE_MIN, WIND_RIBBON_LIFE_MAX),
                cycle: randRange(rng, WIND_RIBBON_CYCLE_MIN, WIND_RIBBON_CYCLE_MAX),
                cycleOffset: randRange(rng, 0, WIND_RIBBON_CYCLE_MAX),
                fadeIn: randRange(rng, 0.28, 0.48),
                fadeOut: randRange(rng, 0.42, 0.70),
                driftMul: randRange(rng, 0.65, 1.35),
                bendMul: randRange(rng, -1, 1)
            });
        }

        for (strip = 0; strip < stripCount; strip += 1) {
            for (point = 0; point < pointCount - 1; point += 1) {
                index = (strip * pointCount + point) * 2;
                nextIndex = (strip * pointCount + point + 1) * 2;
                indices.push(index, index + 1, nextIndex);
                indices.push(index + 1, nextIndex + 1, nextIndex);
            }
        }

        for (sideIndex = 0; sideIndex < vertexCount; sideIndex += 1) {
            alphas[sideIndex] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
        geometry.setIndex(indices);
        geometry.setDrawRange(0, indices.length);

        windRibbonMesh = setOverlayObject(new THREE.Mesh(geometry, materials.windRibbon), 24);
        windRibbonMesh.userData.seeds = seeds;
        windRibbonMesh.userData.pointCount = pointCount;
        worldGroup.add(windRibbonMesh);
    }

    function updateWindRibbons(renderTime, renderAlpha) {
        var mesh = windRibbonMesh;
        var geometry;
        var positionAttr;
        var alphaAttr;
        var positions;
        var alphas;
        var seeds;
        var player;
        var dirX;
        var dirZ;
        var sideX;
        var sideZ;
        var viewX;
        var viewZ;
        var screenRightX;
        var screenRightZ;
        var strip;
        var point;
        var sideIndex;
        var seed;
        var t;
        var centerOffset;
        var lifeT;
        var localTime;
        var lifeFade;
        var moveFade;
        var drift;
        var curl;
        var pulse;
        var endFade;
        var alpha;
        var width;
        var centerX;
        var centerY;
        var centerZ;
        var baseX;
        var baseZ;
        var baseScreenX;
        var baseScreenZ;
        var vertexIndex;

        if (!mesh || !mesh.geometry) {
            return;
        }

        geometry = mesh.geometry;
        positionAttr = geometry.attributes.position;
        alphaAttr = geometry.attributes.aAlpha;
        positions = positionAttr.array;
        alphas = alphaAttr.array;
        seeds = mesh.userData.seeds || [];
        player = sampleShipTransform(state.player, renderAlpha);
        dirX = Math.sin(state.windAngle);
        dirZ = Math.cos(state.windAngle);
        sideX = dirZ;
        sideZ = -dirX;
        viewX = -Math.sin(state.cameraOrbit);
        viewZ = -Math.cos(state.cameraOrbit);
        screenRightX = Math.cos(state.cameraOrbit);
        screenRightZ = -Math.sin(state.cameraOrbit);

        for (strip = 0; strip < seeds.length; strip += 1) {
            seed = seeds[strip];
            localTime = (renderTime * seed.speed + seed.cycleOffset) % seed.cycle;
            baseScreenX = seed.screenX * WIND_RIBBON_SCREEN_X + Math.sin(renderTime * 0.09 * seed.speed + seed.phaseA) * 34;
            baseScreenZ = seed.screenZ * WIND_RIBBON_SCREEN_Z + Math.cos(renderTime * 0.08 * seed.speed + seed.phaseB) * 30;
            baseX = player.x + screenRightX * baseScreenX + viewX * baseScreenZ;
            baseZ = player.z + screenRightZ * baseScreenX + viewZ * baseScreenZ;

            if (localTime > seed.life) {
                for (point = 0; point < WIND_RIBBON_POINTS; point += 1) {
                    vertexIndex = (strip * WIND_RIBBON_POINTS + point) * 2;
                    alphas[vertexIndex] = 0;
                    alphas[vertexIndex + 1] = 0;
                }
                continue;
            }

            lifeT = clamp(localTime / Math.max(0.001, seed.life), 0, 1);
            lifeFade = smoothstep(0.0, seed.fadeIn, localTime) * (1 - smoothstep(seed.life - seed.fadeOut, seed.life, localTime));
            moveFade = smoothstep(0.0, 0.25, lifeT) * (1 - smoothstep(0.86, 1.0, lifeT));
            drift = (lifeT - 0.5) * 105 * seed.driftMul * state.windSpeed;
            pulse = 0.78 + Math.sin(renderTime * 1.12 * seed.speed + seed.phaseB) * 0.12;

            for (point = 0; point < WIND_RIBBON_POINTS; point += 1) {
                t = point / Math.max(1, WIND_RIBBON_POINTS - 1);
                centerOffset = (t - 0.5) * WIND_RIBBON_LENGTH * seed.lengthMul + drift;
                curl = Math.sin(t * TAU * 0.92 + lifeT * 1.45 + seed.phaseA) * seed.wiggle * moveFade;
                curl += Math.sin(t * Math.PI * 1.55 + seed.phaseB) * seed.wiggle * 0.32;
                curl += Math.sin(lifeT * Math.PI) * seed.wiggle * 0.45 * seed.bendMul;
                centerX = baseX + dirX * centerOffset + sideX * curl;
                centerZ = baseZ + dirZ * centerOffset + sideZ * curl;
                centerY = WIND_RIBBON_Y + Math.sin(t * TAU + renderTime * 0.42 + seed.phaseA) * 2.4;
                width = WIND_RIBBON_WIDTH * seed.widthMul * (0.42 + Math.sin(t * Math.PI) * 0.72);
                endFade = smoothstep(0.0, 0.28, t) * (1 - smoothstep(0.70, 1.0, t));
                alpha = endFade * lifeFade * seed.opacity * pulse * clamp(0.72 + state.windSpeed * 0.20, 0.62, 1.0);
                vertexIndex = (strip * WIND_RIBBON_POINTS + point) * 2;

                sideIndex = vertexIndex * 3;
                positions[sideIndex + 0] = centerX + sideX * width;
                positions[sideIndex + 1] = centerY;
                positions[sideIndex + 2] = centerZ + sideZ * width;
                alphas[vertexIndex] = alpha;

                sideIndex = (vertexIndex + 1) * 3;
                positions[sideIndex + 0] = centerX - sideX * width;
                positions[sideIndex + 1] = centerY;
                positions[sideIndex + 2] = centerZ - sideZ * width;
                alphas[vertexIndex + 1] = alpha;
            }
        }

        positionAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
        mesh.visible = true;
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
        ship.wakeLeft = createWakeLaneMesh();
        ship.wakeRight = createWakeLaneMesh();
        ship.healthBar = createHealthBar();
        worldGroup.add(ship.wakeLeft);
        worldGroup.add(ship.wakeRight);
        worldGroup.add(ship.healthBar);
    }

    function getAimZoneVertexAlpha(angleT, radiusT) {
        var angleEdge = clamp(Math.min(angleT, 1 - angleT) / 0.18, 0, 1);
        var radiusEdge = clamp(Math.min(radiusT, 1 - radiusT) / 0.25, 0, 1);
        var angleAlpha = lerp(AIM_ZONE_EDGE_ALPHA_MIN, 1.0, angleEdge);
        var radiusAlpha = lerp(AIM_ZONE_RADIUS_ALPHA_MIN, 1.0, radiusEdge);
        return angleAlpha * radiusAlpha;
    }

    function makeAimZoneFillGeometry() {
        var positions = [];
        var alphas = [];
        var indices = [];
        var radiusSteps = [0, 0.22, 0.68, 1];
        var stepCount = radiusSteps.length;
        var i;
        var r;
        var angle;
        var angleT;
        var radiusT;
        var radius;
        var vertexIndex;
        var nextIndex;

        for (i = 0; i <= AIM_ZONE_SEGMENTS; i += 1) {
            angleT = i / AIM_ZONE_SEGMENTS;
            angle = -BROADSIDE_HALF_ARC + (BROADSIDE_HALF_ARC * 2) * angleT;

            for (r = 0; r < stepCount; r += 1) {
                radiusT = radiusSteps[r];
                radius = lerp(AIM_ZONE_INNER_RANGE, AIM_MAX_RANGE, radiusT);
                positions.push(
                    Math.sin(angle) * radius,
                    WATER_OVERLAY_Y - 0.08,
                    Math.cos(angle) * radius
                );
                alphas.push(getAimZoneVertexAlpha(angleT, radiusT));
            }
        }

        for (i = 0; i < AIM_ZONE_SEGMENTS; i += 1) {
            for (r = 0; r < stepCount - 1; r += 1) {
                vertexIndex = i * stepCount + r;
                nextIndex = (i + 1) * stepCount + r;
                indices.push(vertexIndex, vertexIndex + 1, nextIndex);
                indices.push(vertexIndex + 1, nextIndex + 1, nextIndex);
            }
        }

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    function createAimZoneSide(side) {
        var group = new THREE.Group();
        var fill = new THREE.Mesh(makeAimZoneFillGeometry(), materials.aimZoneFill);

        setOverlayObject(fill, 25);
        group.add(fill);
        group.visible = false;
        group.userData.side = side;
        group.userData.fill = fill;
        setOverlayObject(group, 25);
        return group;
    }

    function setAimZoneState(zone, stateName) {
        if (!zone) {
            return;
        }

        if (stateName === 'bad') {
            zone.userData.fill.material = materials.aimZoneFillBad;
        } else if (stateName === 'cooldown') {
            zone.userData.fill.material = materials.aimZoneFillCooldown;
        } else if (stateName === 'active') {
            zone.userData.fill.material = materials.aimZoneFillActive;
        } else {
            zone.userData.fill.material = materials.aimZoneFill;
        }
    }

    function syncAimZone(zone, renderShip, side) {
        var centerAngle;

        if (!zone) {
            return;
        }

        centerAngle = renderShip.heading + (side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
        zone.position.set(renderShip.x, 0, renderShip.z);
        zone.rotation.y = centerAngle;
    }

    function createAimObjects() {
        var dotGeometry = new THREE.SphereGeometry(3.2, 8, 6);
        var windGeometry;

        aimDots = new THREE.InstancedMesh(dotGeometry, materials.aimGood, AIM_DOT_COUNT);
        setOverlayObject(aimDots, 30);
        aimDotMatrix = new THREE.Matrix4();
        worldGroup.add(aimDots);

        aimMarker = new THREE.Mesh(new THREE.RingGeometry(13, 16, 32), materials.aimMarkerGood);
        aimMarker.rotation.x = -Math.PI * 0.5;
        aimMarker.position.y = WATER_OVERLAY_Y;
        setOverlayObject(aimMarker, 29);
        worldGroup.add(aimMarker);

        aimZoneLeft = createAimZoneSide(-1);
        aimZoneRight = createAimZoneSide(1);
        worldGroup.add(aimZoneLeft);
        worldGroup.add(aimZoneRight);

        if (DEBUG_ENABLED) {
            windGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            ]);
            windArrow = new THREE.Line(windGeometry, materials.wind);
            setOverlayObject(windArrow, 26);
            worldGroup.add(windArrow);
        } else {
            windArrow = null;
        }
    }

    function disposeObjectGeometry(object) {
        object.traverse(function (child) {
            if (child.geometry && child.geometry.dispose) {
                child.geometry.dispose();
            }
        });
    }

    function clearWorldGroup() {
        var child;

        if (!worldGroup) {
            return;
        }

        while (worldGroup.children.length > 0) {
            child = worldGroup.children[0];
            worldGroup.remove(child);
            disposeObjectGeometry(child);
        }

        windRibbonMesh = null;
    }

    function createFogBoundary() {
        var ring = new THREE.Mesh(new THREE.RingGeometry(SEA_TIER3_LIMIT, SEA_FOG_LIMIT, 192), materials.fogBoundary);
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
            ring = createFlatRing(zone.r, materials.debugRed);
            ring.position.set(zone.x, WATER_DEBUG_Y, zone.z);
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
        state.player.debugRing = DEBUG_ENABLED ? createFlatRing(PLAYER_RADIUS, materials.debugGreen) : null;
        worldGroup.add(state.player.mesh);
        if (state.player.debugRing) {
            worldGroup.add(state.player.debugRing);
        }

        for (i = 0; i < state.enemies.length; i += 1) {
            state.enemies[i].mesh = createShipMesh(false);
            state.enemies[i].mesh.scale.setScalar(state.enemies[i].visualScale || 0.95);
            attachShipHelpers(state.enemies[i]);
            state.enemies[i].debugRing = DEBUG_ENABLED ? createFlatRing(state.enemies[i].collisionRadius || ENEMY_RADIUS, materials.debugRed) : null;
            worldGroup.add(state.enemies[i].mesh);
            if (state.enemies[i].debugRing) {
                worldGroup.add(state.enemies[i].debugRing);
            }
        }

        for (i = 0; i < state.crates.length; i += 1) {
            attachCrateMesh(state.crates[i]);
        }

        createAimObjects();
        createWindRibbonMesh(rng);
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
        scene.fog = new THREE.Fog(0x061019, SEA_TIER3_LIMIT * 0.92, SEA_FOG_LIMIT * 1.12);

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
            hud.minimap.width = MINIMAP_SIZE;
            hud.minimap.height = MINIMAP_SIZE;
            minimapContext = hud.minimap.getContext('2d');
        }

        createWater();
        buildWorld();
        resize();
        syncMeshes(MAX_RENDER_ALPHA, state.time);

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
        var inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        var x;
        var y;
        var hit;

        if (!inside) {
            state.mouseInside = false;
            return false;
        }

        x = ((clientX - rect.left) / rect.width) * 2 - 1;
        y = -(((clientY - rect.top) / rect.height) * 2 - 1);
        hit = new THREE.Vector3();

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
            state.mouseWorldX = hit.x;
            state.mouseWorldZ = hit.z;
            state.mouseInside = true;
            return true;
        }

        state.mouseInside = false;
        return false;
    }

    function updateCamera(dt, renderAlpha) {
        var p = sampleShipTransform(state.player, renderAlpha);
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

    function resolveIslandCollision(ship) {
        var radius = ship.collisionRadius || (ship.isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS);
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
        var dangerFactor;
        var fogFactor;
        var outward;
        var outwardDrag;

        if (d <= SEA_TIER3_LIMIT) {
            return;
        }

        if (d < 0.001) {
            nx = 1;
            nz = 0;
        } else {
            nx = ship.x / d;
            nz = ship.z / d;
        }

        dangerFactor = smoothstep(SEA_TIER3_LIMIT, SEA_FOG_LIMIT, d);
        fogFactor = smoothstep(SEA_FOG_LIMIT * 0.92, SEA_FOG_LIMIT * 1.28, d);
        outward = ship.vx * nx + ship.vz * nz;

        if (outward > 0) {
            outwardDrag = ship.isPlayer ? 0.12 + dangerFactor * 0.42 + fogFactor * 0.26 : 0.22 + dangerFactor * 0.58 + fogFactor * 0.34;
            ship.vx -= nx * outward * outwardDrag;
            ship.vz -= nz * outward * outwardDrag;
        }

        ship.vx -= nx * (dangerFactor * 18 + fogFactor * 42) * dt;
        ship.vz -= nz * (dangerFactor * 18 + fogFactor * 42) * dt;

        if (ship.isPlayer && dangerFactor > 0.35 && state.messageTimer <= 0) {
            setMessage('Dense fog ahead. The open sea is unsafe.', 2.0);
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

        rememberShipTransform(ship);

        if (ship.recoilTimer > 0) {
            ship.recoilTimer = Math.max(0, ship.recoilTimer - dt);
        }

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
        updateWakeSamples(ship, dt);

        resolveSeaBoundary(ship, dt);

        if (ship.leftCannonCooldown > 0) {
            ship.leftCannonCooldown = Math.max(0, ship.leftCannonCooldown - dt);
        }
        if (ship.rightCannonCooldown > 0) {
            ship.rightCannonCooldown = Math.max(0, ship.rightCannonCooldown - dt);
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

        if (state.input.fireReleaseQueued) {
            fireFromShip(state.player, state.mouseWorldX, state.mouseWorldZ);
            state.input.fireReleaseQueued = false;
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
        } else if (distanceToPlayer < ENEMY_ATTACK_RANGE) {
            enemy.aiState = 'attack';
            desiredHeadingOverride = chooseBroadsideHeading(enemy, player);
            desiredX = enemy.x + Math.sin(desiredHeadingOverride) * 160;
            desiredZ = enemy.z + Math.cos(desiredHeadingOverride) * 160;
            if (distanceToPlayer < ENEMY_ATTACK_RANGE * 0.58) {
                desiredX += (enemy.x - player.x) * 0.45;
                desiredZ += (enemy.z - player.z) * 0.45;
            }
            fireFromShip(enemy, player.x + player.vx * 0.9, player.z + player.vz * 0.9);
        } else if (distanceToPlayer < ENEMY_CHASE_RANGE && zoneDistance < enemy.zoneRadius * 1.15) {
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

    function getCannonCooldownField(side) {
        return side < 0 ? 'leftCannonCooldown' : 'rightCannonCooldown';
    }

    function getShipCannonCooldown(ship, side) {
        return Math.max(0, ship[getCannonCooldownField(side)] || 0);
    }

    function setShipCannonCooldown(ship, side, cooldown) {
        ship[getCannonCooldownField(side)] = cooldown;
    }

    function getShipCannonReloadSeconds(ship) {
        return (ship.isPlayer ? PLAYER_CANNON_RELOAD_BASE : ENEMY_CANNON_RELOAD_BASE) * ship.cannonCooldownMul;
    }

    function formatCannonReload(cooldown, reloadSeconds) {
        if (cooldown <= 0) {
            return 'READY';
        }
        return pad((1 - cooldown / Math.max(0.001, reloadSeconds)) * 100, 2) + '%';
    }

    function getReloadProgress(cooldown, reloadSeconds) {
        return clamp(1 - cooldown / Math.max(0.001, reloadSeconds), 0, 1);
    }

    function formatBottomReload(cooldown, reloadSeconds) {
        if (cooldown <= 0) {
            return 'RDY';
        }
        return pad(getReloadProgress(cooldown, reloadSeconds) * 100, 2) + '%';
    }

    function getAimDotCount(shot) {
        return clamp(Math.round(shot.range / AIM_DOT_SPACING) + 2, AIM_DOT_MIN_COUNT, AIM_DOT_COUNT);
    }

    function getPlayerAimStatus(renderAlpha) {
        var p = state.player;
        var aimShip = typeof renderAlpha === 'number' ? sampleShipTransform(p, renderAlpha) : p;
        var shot = getShotPlan(p, state.mouseWorldX, state.mouseWorldZ, aimShip);
        var cooldown = getShipCannonCooldown(p, shot.info.side);
        var ready = cooldown <= 0;
        var inArc = shot.info.inArc;
        return {
            info: shot.info,
            shot: shot,
            cooldown: cooldown,
            ready: ready,
            inArc: inArc,
            canFire: inArc && ready && p.hp > 0 && !state.gameOver
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

    function getShotPlan(ship, targetX, targetZ, aimShip) {
        var sourceShip = aimShip || ship;
        var info = getBroadsideInfo(sourceShip, targetX, targetZ);
        var startX = sourceShip.x + info.rightX * info.side * 21 + forwardX(sourceShip.heading) * 5;
        var startY = 20;
        var startZ = sourceShip.z + info.rightZ * info.side * 21 + forwardZ(sourceShip.heading) * 5;
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
            range: dist,
            rangeLimited: rawDist > AIM_MAX_RANGE
        };
    }

    function spawnProjectileFromShot(ship, shot, laneOffset) {
        var mesh = createProjectileMesh();
        var projectile = {
            owner: ship.isPlayer ? 'player' : 'enemy',
            damage: ship.damage,
            x: shot.startX + forwardX(ship.heading) * laneOffset,
            y: shot.startY,
            z: shot.startZ + forwardZ(ship.heading) * laneOffset,
            vx: shot.vx,
            vy: shot.vy,
            vz: shot.vz,
            life: PROJECTILE_MAX_LIFE,
            mesh: mesh
        };

        mesh.position.set(projectile.x, projectile.y, projectile.z);
        worldGroup.add(mesh);
        state.projectiles.push(projectile);
        makeCannonSmoke(
            projectile.x,
            projectile.y + 2,
            projectile.z,
            shot.info.rightX * shot.info.side,
            shot.info.rightZ * shot.info.side,
            clamp(ship.visualScale || 1, 0.86, 1.85)
        );
    }

    function createSmokePuffMesh(pieceCount) {
        var group = new THREE.Group();
        var i;
        var piece;
        var material;
        var scale;

        for (i = 0; i < pieceCount; i += 1) {
            material = materials.smokePuff.clone();
            piece = new THREE.Mesh(new THREE.SphereGeometry(5.2, 7, 5), material);
            piece.userData.offsetX = randRange(state.rng, -5.5, 5.5);
            piece.userData.offsetY = randRange(state.rng, -2.5, 5.5);
            piece.userData.offsetZ = randRange(state.rng, -5.5, 5.5);
            piece.userData.driftX = randRange(state.rng, -7, 7);
            piece.userData.driftY = randRange(state.rng, 4, 12);
            piece.userData.driftZ = randRange(state.rng, -7, 7);
            piece.userData.opacity = randRange(state.rng, 0.22, 0.36);
            scale = randRange(state.rng, 0.72, 1.22);
            piece.scale.setScalar(scale);
            setOverlayObject(piece, 32);
            group.add(piece);
        }

        setOverlayObject(group, 32);
        return group;
    }

    function trimSmokePuffs() {
        var old;

        while (state.smokePuffs.length > CANNON_SMOKE_MAX) {
            old = state.smokePuffs.shift();
            if (old && old.mesh) {
                worldGroup.remove(old.mesh);
                disposeObjectGeometry(old.mesh);
            }
        }
    }

    function makeCannonSmoke(x, y, z, sideX, sideZ, scaleMul) {
        var pieceCount;
        var puff;
        var mesh;

        if (!worldGroup) {
            return;
        }

        pieceCount = scaleMul > 1.25 ? 6 : 4;
        mesh = createSmokePuffMesh(pieceCount);
        mesh.position.set(x + sideX * 5, y, z + sideZ * 5);
        mesh.scale.setScalar(scaleMul);
        worldGroup.add(mesh);
        puff = {
            life: CANNON_SMOKE_LIFE,
            totalLife: CANNON_SMOKE_LIFE,
            mesh: mesh,
            sideX: sideX,
            sideZ: sideZ,
            scaleMul: scaleMul
        };
        state.smokePuffs.push(puff);
        trimSmokePuffs();
    }

    function addCannonRecoil(ship, side, strength) {
        ship.recoilTimer = CANNON_RECOIL_TIME;
        ship.recoilSide = side;
        ship.recoilStrength = strength || 1;
    }

    function fireFromShip(ship, targetX, targetZ) {
        var shot;
        var cooldown;

        if (ship.hp <= 0 || state.gameOver) {
            return false;
        }

        shot = getShotPlan(ship, targetX, targetZ);
        if (getShipCannonCooldown(ship, shot.info.side) > 0) {
            return false;
        }
        if (!shot.info.inArc) {
            if (ship.isPlayer && ship.fireHintCooldown <= 0) {
                setMessage('Target outside broadside arc. Turn the ship side-on before firing.', 1.8);
                ship.fireHintCooldown = 0.8;
            }
            return false;
        }

        if (ship.doubleShot) {
            spawnProjectileFromShot(ship, shot, -15);
            spawnProjectileFromShot(ship, shot, 15);
        } else {
            spawnProjectileFromShot(ship, shot, 0);
        }

        addCannonRecoil(ship, shot.info.side, ship.doubleShot ? 1.18 : 1.0);

        cooldown = getShipCannonReloadSeconds(ship);
        setShipCannonCooldown(ship, shot.info.side, cooldown);
        return true;
    }

    function updateProjectiles(dt) {
        var i;
        var p;
        var hit;

        for (i = state.projectiles.length - 1; i >= 0; i -= 1) {
            p = state.projectiles[i];
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

            if (length2(p.x - enemy.x, p.z - enemy.z) <= (enemy.collisionRadius || ENEMY_RADIUS)) {
                applyDamage(enemy, p.damage);
                if (enemy.hp <= 0) {
                    sinkEnemy(enemy);
                }
                return true;
            }
        }
        return false;
    }

    function finishGame(resultType) {
        if (state.gameOver) {
            return;
        }

        state.gameOver = true;
        state.resultType = resultType;
        state.input.aimHeld = false;
        state.input.aimSource = '';
        state.input.fireReleaseQueued = false;
        state.dockPanelOpen = false;
        state.docked = false;
        state.dockTimer = 0;
        syncDockPanel();

        if (resultType === 'victory') {
            setMessage('You are the Terror of the Seas. All enemies defeated.', 10);
        } else {
            setMessage('Ship lost. Try again or return to the resume.', 10);
        }
    }

    function applyDamage(ship, amount) {
        ship.hp = Math.max(0, ship.hp - amount);
        ship.hitFlash = 0.22;
        if (ship.isPlayer && ship.hp <= 0) {
            finishGame('defeat');
        }
    }

    function sinkEnemy(enemy) {
        var crateCount = 2 + Math.floor(state.rng() * 3);
        var i;
        enemy.sinkTimer = 0.01;
        setMessage('Enemy ship disabled. Cargo crates in the water.', 2.4);

        for (i = 0; i < crateCount; i += 1) {
            spawnCrate(
                enemy.x + randRange(state.rng, -42, 42),
                enemy.z + randRange(state.rng, -42, 42),
                24 + Math.floor(randRange(state.rng, 0, 42)),
                i === 0 && enemy.zoneTier === 'tier3' ? 'gold' : 'cargo'
            );
        }
    }

    function attachCrateMesh(crate) {
        if (crate.mesh || !worldGroup) {
            return;
        }
        crate.mesh = createCrateMesh(crate.kind);
        crate.mesh.position.set(crate.x, 8, crate.z);
        worldGroup.add(crate.mesh);
    }

    function spawnCrate(x, z, value, kind) {
        var crate = {
            x: x,
            z: z,
            value: value,
            kind: kind || 'cargo',
            mesh: null,
            bob: randRange(state.rng, 0, TAU)
        };
        attachCrateMesh(crate);
        state.crates.push(crate);
    }

    function updateCrates(dt) {
        var i;
        var crate;
        var p = state.player;

        for (i = state.crates.length - 1; i >= 0; i -= 1) {
            crate = state.crates[i];
            crate.bob += dt * 1.8;
            if (dist2(crate, p) < 44) {
                if (crate.kind === 'gold') {
                    p.gold += crate.value;
                    worldGroup.remove(crate.mesh);
                    state.crates.splice(i, 1);
                    setMessage('Gold chest recovered: +' + crate.value + ' gold.', 2.0);
                } else if (p.cargo < p.cargoCapacity) {
                    p.cargo += 1;
                    p.cargoValue += crate.value;
                    worldGroup.remove(crate.mesh);
                    state.crates.splice(i, 1);
                    setMessage('Cargo recovered. Dock at a pier with F to sell it.', 2.0);
                } else {
                    setMessage('Cargo hold full. Dock and sell goods first.', 1.4);
                }
            }
        }
    }

    function makeSplash(x, z) {
        var ring = createFlatRing(10, materials.splashRing);
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

    function updateSmokePuffs(dt) {
        var i;
        var puff;
        var t;
        var j;
        var child;
        var fade;
        var scale;

        for (i = state.smokePuffs.length - 1; i >= 0; i -= 1) {
            puff = state.smokePuffs[i];
            puff.life -= dt;
            t = 1 - clamp(puff.life / puff.totalLife, 0, 1);
            fade = Math.pow(1 - t, 1.35);
            scale = 1 + t * 1.8;
            puff.mesh.position.x += puff.sideX * dt * 13;
            puff.mesh.position.y += dt * 8;
            puff.mesh.position.z += puff.sideZ * dt * 13;
            puff.mesh.scale.setScalar(puff.scaleMul * scale);
            puff.mesh.rotation.y += dt * 0.7;

            for (j = 0; j < puff.mesh.children.length; j += 1) {
                child = puff.mesh.children[j];
                child.position.set(
                    child.userData.offsetX + child.userData.driftX * t,
                    child.userData.offsetY + child.userData.driftY * t,
                    child.userData.offsetZ + child.userData.driftZ * t
                );
                if (child.material) {
                    child.material.opacity = child.userData.opacity * fade;
                }
            }

            if (puff.life <= 0) {
                worldGroup.remove(puff.mesh);
                disposeObjectGeometry(puff.mesh);
                state.smokePuffs.splice(i, 1);
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

    function repairCost() {
        var p = state.player;
        return Math.ceil(Math.max(0, p.maxHp - p.hp) * REPAIR_COST_PER_HP);
    }

    function repairAtDock() {
        var p = state.player;
        var cost = repairCost();

        if (!state.dockPanelOpen) {
            setMessage('Dock first, then repair hull.', 1.6);
            return;
        }
        if (cost <= 0) {
            setMessage('Hull is already fully repaired.', 1.5);
            syncDockPanel();
            return;
        }
        if (p.gold < cost) {
            setMessage('Need ' + cost + ' gold to repair hull.', 1.7);
            syncDockPanel();
            return;
        }
        p.gold -= cost;
        p.hp = p.maxHp;
        setMessage('Hull repaired for ' + cost + ' gold.', 2.0);
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
            p.cannonCooldownMul = Math.max(0.80, p.cannonCooldownMul - 0.05);
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
        var hullRepairCost = repairCost();
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
        if (hud.dockRepair) {
            hud.dockRepair.disabled = hullRepairCost <= 0 || p.gold < hullRepairCost;
            hud.dockRepair.textContent = hullRepairCost > 0 ? 'Repair hull - ' + hullRepairCost + ' gold' : 'Repair hull - full HP';
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
        updateSmokePuffs(dt);
        updateDock(dt);
        updateRouteClear();
    }

    function updateRouteClear() {
        var alive = state.enemies.filter(function (enemy) {
            return enemy.hp > 0;
        }).length;

        if (!state.routeClear && alive === 0) {
            state.routeClear = true;
            finishGame('victory');
        }
    }

    function wakeSpeedRatio(speed) {
        return clamp((speed - WAKE_MIN_SPEED) / Math.max(1, WAKE_FULL_SPEED - WAKE_MIN_SPEED), 0, 1);
    }

    function wakeLifetime(speedRatio) {
        return lerp(0.90, 3.20, smoothstep(0, 1, speedRatio));
    }

    function wakeSampleDistance(speedRatio, turnRatio) {
        var base = lerp(WAKE_SAMPLE_DISTANCE_SLOW, WAKE_SAMPLE_DISTANCE_FAST, speedRatio);
        return base * lerp(1.0, 0.72, turnRatio);
    }

    function wakeEmitterAt(x, z, heading, sideSign) {
        var fx = forwardX(heading);
        var fz = forwardZ(heading);
        var rx = forwardX(heading + Math.PI * 0.5);
        var rz = forwardZ(heading + Math.PI * 0.5);

        return {
            x: x + rx * sideSign * WAKE_EMITTER_SIDE_OFFSET + fx * WAKE_EMITTER_FORWARD_OFFSET,
            z: z + rz * sideSign * WAKE_EMITTER_SIDE_OFFSET + fz * WAKE_EMITTER_FORWARD_OFFSET,
            outX: rx * sideSign,
            outZ: rz * sideSign,
            forwardX: fx,
            forwardZ: fz
        };
    }

    function makeWakeSample(emitter, speedRatio, turnRatio) {
        var sideDrift = lerp(5.9, 2.15, speedRatio) * lerp(1.15, 0.85, turnRatio);
        var backDrift = lerp(0.25, 1.28, speedRatio);
        var outLen = Math.sqrt(emitter.outX * emitter.outX + emitter.outZ * emitter.outZ) || 1;
        var fLen = Math.sqrt(emitter.forwardX * emitter.forwardX + emitter.forwardZ * emitter.forwardZ) || 1;
        var outX = emitter.outX / outLen;
        var outZ = emitter.outZ / outLen;
        var forwardXValue = emitter.forwardX / fLen;
        var forwardZValue = emitter.forwardZ / fLen;

        return {
            x: emitter.x,
            z: emitter.z,
            age: 0,
            lifetime: wakeLifetime(speedRatio),
            outX: outX,
            outZ: outZ,
            forwardX: forwardXValue,
            forwardZ: forwardZValue,
            driftX: outX * sideDrift - forwardXValue * backDrift,
            driftZ: outZ * sideDrift - forwardZValue * backDrift,
            speedRatio: speedRatio,
            turnRatio: turnRatio
        };
    }

    function pushWakeSample(samples, sample) {
        var first = samples[0];
        var dot;

        if (first) {
            dot = sample.outX * first.outX + sample.outZ * first.outZ;
            if (dot < 0) {
                sample.outX = -sample.outX;
                sample.outZ = -sample.outZ;
            }
        }

        samples.unshift(sample);
        if (samples.length > WAKE_CURVE_SAMPLES) {
            samples.length = WAKE_CURVE_SAMPLES;
        }
    }

    function ageWakeSamples(samples, dt) {
        var i;
        var sample;

        for (i = samples.length - 1; i >= 0; i -= 1) {
            sample = samples[i];
            sample.age += dt;
            sample.x += sample.driftX * dt;
            sample.z += sample.driftZ * dt;
            if (sample.age >= sample.lifetime) {
                samples.splice(i, 1);
            }
        }
    }

    function resetWakeSpawn(ship) {
        ship.wakeDistance = 0;
        ship.wakePrevX = ship.x;
        ship.wakePrevZ = ship.z;
        ship.wakePrevHeading = ship.heading;
    }

    function pushWakeLaneSample(ship, sideSign, spawnX, spawnZ, spawnHeading, speedRatio, turnRatio) {
        var samples = sideSign < 0 ? ship.wakeLeftSamples : ship.wakeRightSamples;
        var emitter = wakeEmitterAt(spawnX, spawnZ, spawnHeading, sideSign);
        pushWakeSample(samples, makeWakeSample(emitter, speedRatio, turnRatio));
    }

    function pushWakeSamplePair(ship, spawnX, spawnZ, spawnHeading, speedRatio, turnRatio) {
        pushWakeLaneSample(ship, -1, spawnX, spawnZ, spawnHeading, speedRatio, turnRatio);
        pushWakeLaneSample(ship, 1, spawnX, spawnZ, spawnHeading, speedRatio, turnRatio);
    }

    function updateWakeSamples(ship, dt) {
        var speed = length2(ship.vx, ship.vz);
        var dx = ship.x - ship.wakePrevX;
        var dz = ship.z - ship.wakePrevZ;
        var moveDistance = length2(dx, dz);
        var headingDelta = wrapAngle(ship.heading - ship.wakePrevHeading);
        var speedRatio = wakeSpeedRatio(speed);
        var turnRate = Math.abs(headingDelta) / Math.max(dt, 0.001);
        var turnRatio = clamp((turnRate * 34) / Math.max(speed, 24), 0, 1);
        var spacing = wakeSampleDistance(speedRatio, turnRatio);
        var previousX = ship.wakePrevX;
        var previousZ = ship.wakePrevZ;
        var previousHeading = ship.wakePrevHeading;
        var remaining;
        var need;
        var t;
        var spawnX;
        var spawnZ;
        var spawnHeading;

        ageWakeSamples(ship.wakeLeftSamples, dt);
        ageWakeSamples(ship.wakeRightSamples, dt);

        if (ship.hp <= 0 || speed < WAKE_MIN_SPEED) {
            resetWakeSpawn(ship);
            return;
        }

        if (ship.wakeLeftSamples.length === 0 && ship.wakeRightSamples.length === 0) {
            pushWakeSamplePair(ship, ship.x, ship.z, ship.heading, speedRatio, turnRatio);
        }

        remaining = moveDistance;
        while (ship.wakeDistance + remaining >= spacing) {
            need = spacing - ship.wakeDistance;
            t = clamp(need / Math.max(remaining, 0.001), 0, 1);
            spawnX = lerp(previousX, ship.x, t);
            spawnZ = lerp(previousZ, ship.z, t);
            spawnHeading = previousHeading + headingDelta * t;
            pushWakeSamplePair(ship, spawnX, spawnZ, spawnHeading, speedRatio, turnRatio);
            previousX = spawnX;
            previousZ = spawnZ;
            previousHeading = spawnHeading;
            remaining -= need;
            ship.wakeDistance = 0;
            if (remaining < 0.001) {
                break;
            }
        }

        ship.wakeDistance += Math.max(0, remaining);
        ship.wakeDistance = Math.min(ship.wakeDistance, spacing);
        ship.wakePrevX = ship.x;
        ship.wakePrevZ = ship.z;
        ship.wakePrevHeading = ship.heading;
    }

    function wakeLaneAlpha(sample) {
        var ageRatio = clamp(sample.age / Math.max(sample.lifetime, 0.001), 0, 1);
        var headFade = smoothstep(0.00, 0.13, ageRatio);
        var tailFade = 1 - smoothstep(0.54, 1.0, ageRatio);
        var speedAlpha = lerp(0.24, 0.78, sample.speedRatio);
        var turnAlpha = lerp(1.0, 0.68, sample.turnRatio);
        return clamp(headFade * tailFade * speedAlpha * turnAlpha, 0, 1);
    }

    function wakeLaneWidth(sample) {
        var ageRatio = clamp(sample.age / Math.max(sample.lifetime, 0.001), 0, 1);
        var birthWidth = lerp(1.75, 0.90, sample.speedRatio);
        var expandWidth = lerp(5.2, 2.15, sample.speedRatio);
        var turnWidth = lerp(1.0, 0.72, sample.turnRatio);
        return (birthWidth + expandWidth * smoothstep(0.05, 1.0, ageRatio)) * turnWidth;
    }

    function hideWakeLane(mesh) {
        if (!mesh) {
            return;
        }
        mesh.visible = false;
        mesh.geometry.setDrawRange(0, 0);
    }

    function syncWakeLane(ship, mesh, sideSign) {
        var samples = sideSign < 0 ? ship.wakeLeftSamples : ship.wakeRightSamples;
        var count = Math.min(samples.length, WAKE_CURVE_SAMPLES);
        var attr;
        var alphaAttr;
        var positions;
        var alphas;
        var i;
        var sample;
        var width;
        var alpha;
        var innerWidth;
        var lastSample;

        if (!mesh) {
            return;
        }

        if (count < 2) {
            hideWakeLane(mesh);
            return;
        }

        attr = mesh.geometry.attributes.position;
        alphaAttr = mesh.geometry.attributes.aAlpha;
        positions = attr.array;
        alphas = alphaAttr.array;

        for (i = 0; i < count; i += 1) {
            sample = samples[i];
            width = wakeLaneWidth(sample);
            alpha = wakeLaneAlpha(sample);
            innerWidth = WAKE_INNER_WIDTH * lerp(1.0, 0.72, sample.speedRatio);

            positions[(i * 2) * 3 + 0] = sample.x - sample.outX * innerWidth;
            positions[(i * 2) * 3 + 1] = WATER_TRAIL_Y;
            positions[(i * 2) * 3 + 2] = sample.z - sample.outZ * innerWidth;

            positions[(i * 2 + 1) * 3 + 0] = sample.x + sample.outX * width;
            positions[(i * 2 + 1) * 3 + 1] = WATER_TRAIL_Y;
            positions[(i * 2 + 1) * 3 + 2] = sample.z + sample.outZ * width;

            alphas[i * 2] = alpha * 0.74;
            alphas[i * 2 + 1] = alpha;
        }

        lastSample = samples[count - 1];
        for (i = count; i < WAKE_CURVE_SAMPLES; i += 1) {
            positions[(i * 2) * 3 + 0] = lastSample.x;
            positions[(i * 2) * 3 + 1] = WATER_TRAIL_Y;
            positions[(i * 2) * 3 + 2] = lastSample.z;
            positions[(i * 2 + 1) * 3 + 0] = lastSample.x;
            positions[(i * 2 + 1) * 3 + 1] = WATER_TRAIL_Y;
            positions[(i * 2 + 1) * 3 + 2] = lastSample.z;
            alphas[i * 2] = 0;
            alphas[i * 2 + 1] = 0;
        }

        attr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
        mesh.visible = true;
        mesh.geometry.setDrawRange(0, Math.max(0, (count - 1) * 6));
    }

    function syncWake(ship) {
        syncWakeLane(ship, ship.wakeLeft, -1);
        syncWakeLane(ship, ship.wakeRight, 1);
    }

    function syncHealthBar(ship, renderState) {
        var bar = ship.healthBar;
        var fill;
        var ratio;
        var fullWidth;

        if (!bar) {
            return;
        }

        bar.position.set(renderState.x, ship.hp > 0 ? 78 : -1000, renderState.z);
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

    function syncShipMesh(ship, renderAlpha, renderTime) {
        var mesh = ship.mesh;
        var sailMesh;
        var sailCurve;
        var floatY;
        var waterRoll;
        var waterPitch;
        var recoilT;
        var recoilRoll;
        var recoilPitch;
        var renderState = sampleShipTransform(ship, renderAlpha);

        if (!mesh) {
            return;
        }

        floatY = sampleFloatHeight(renderState.x, renderState.z, renderTime);
        waterRoll = Math.sin(renderTime * 2.5 + renderState.x * 0.01) * 0.030 + sampleWaterWave(renderState.x + 35, renderState.z, renderTime) * 0.0024;
        waterPitch = Math.cos(renderTime * 2.0 + renderState.z * 0.01) * 0.024 + sampleWaterWave(renderState.x, renderState.z + 35, renderTime) * 0.0020;
        recoilT = ship.recoilTimer > 0 ? 1 - clamp(ship.recoilTimer / CANNON_RECOIL_TIME, 0, 1) : 1;
        recoilRoll = ship.recoilTimer > 0 ? -ship.recoilSide * Math.sin(recoilT * Math.PI) * 0.078 * (ship.recoilStrength || 1) : 0;
        recoilPitch = ship.recoilTimer > 0 ? Math.sin(recoilT * TAU) * 0.022 * (ship.recoilStrength || 1) : 0;

        mesh.position.set(renderState.x, ship.hp > 0 ? floatY : -Math.min(24, renderState.sinkTimer * 12), renderState.z);
        mesh.rotation.y = renderState.heading;
        mesh.rotation.z = ship.hp > 0 ? waterRoll + recoilRoll : renderState.sinkTimer * 0.18;
        mesh.rotation.x = ship.hp > 0 ? waterPitch + recoilPitch : -renderState.sinkTimer * 0.10;

        sailMesh = mesh.userData.sailMesh;
        if (sailMesh) {
            sailCurve = 0.62 + ship.sail * 0.38;
            sailMesh.scale.set(sailCurve, 1, 1);
            sailMesh.rotation.z = Math.sin(renderTime * 2.2 + renderState.x * 0.01) * 0.035;
        }
        if (mesh.userData.sailPivot) {
            mesh.userData.sailPivot.rotation.y = renderState.sailAngle;
        }

        if (ship.debugRing) {
            ship.debugRing.position.set(renderState.x, WATER_DEBUG_Y, renderState.z);
            ship.debugRing.visible = DEBUG_ENABLED && ship.hp > 0;
        }

        syncWake(ship);
        syncHealthBar(ship, renderState);
    }

    function syncMeshes(renderAlpha, renderTime) {
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
        var aimVisible;
        var dotCount;
        var renderPlayer;
        var activeAimZone;
        var inactiveAimZone;
        var aimStateName;

        renderAlpha = typeof renderAlpha === 'number' ? renderAlpha : MAX_RENDER_ALPHA;
        renderTime = typeof renderTime === 'number' ? renderTime : state.time;

        syncShipMesh(state.player, renderAlpha, renderTime);
        for (i = 0; i < state.enemies.length; i += 1) {
            syncShipMesh(state.enemies[i], renderAlpha, renderTime);
        }

        for (i = 0; i < state.projectiles.length; i += 1) {
            p = state.projectiles[i];
            p.mesh.position.set(p.x, p.y, p.z);
        }

        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            attachCrateMesh(crate);
            crate.mesh.position.set(crate.x, 7 + sampleFloatHeight(crate.x, crate.z, renderTime) + Math.sin(crate.bob) * 3.2, crate.z);
            crate.mesh.rotation.y += crate.kind === 'gold' ? 0.014 : 0.010;
            crate.mesh.rotation.z = Math.sin(crate.bob * 0.7) * 0.08;
        }

        player = state.player;
        aimVisible = state.input.aimHeld && state.mouseInside && player.hp > 0 && !state.gameOver;
        aimDots.visible = aimVisible;
        aimMarker.visible = aimVisible;

        if (aimZoneLeft) {
            aimZoneLeft.visible = aimVisible;
        }
        if (aimZoneRight) {
            aimZoneRight.visible = aimVisible;
        }

        if (aimVisible) {
            renderPlayer = sampleShipTransform(player, renderAlpha);
            aimStatus = getPlayerAimStatus(renderAlpha);

            syncAimZone(aimZoneLeft, renderPlayer, -1);
            syncAimZone(aimZoneRight, renderPlayer, 1);

            activeAimZone = aimStatus.info.side < 0 ? aimZoneLeft : aimZoneRight;
            inactiveAimZone = aimStatus.info.side < 0 ? aimZoneRight : aimZoneLeft;
            aimStateName = aimStatus.inArc ? (aimStatus.ready ? 'active' : 'cooldown') : 'bad';
            setAimZoneState(inactiveAimZone, 'idle');
            setAimZoneState(activeAimZone, aimStateName);

            if (!aimStatus.inArc) {
                aimDots.material = materials.aimBad;
                aimMarker.material = materials.aimMarkerBad;
            } else if (!aimStatus.ready) {
                aimDots.material = materials.aimCooldown;
                aimMarker.material = materials.aimMarkerCooldown;
            } else {
                aimDots.material = materials.aimGood;
                aimMarker.material = materials.aimMarkerGood;
            }

            aimMarker.position.set(aimStatus.shot.endX, WATER_OVERLAY_Y, aimStatus.shot.endZ);
            vx = aimStatus.shot.vx;
            vy = aimStatus.shot.vy;
            vz = aimStatus.shot.vz;
            simX = aimStatus.shot.startX;
            simY = aimStatus.shot.startY;
            simZ = aimStatus.shot.startZ;
            dotCount = getAimDotCount(aimStatus.shot);
            aimDots.count = dotCount;

            for (i = 0; i < dotCount; i += 1) {
                t = (i / Math.max(1, dotCount - 1)) * aimStatus.shot.flightTime;
                var dotX = simX + vx * t;
                var dotY = Math.max(WATER_OVERLAY_Y + 2, simY + vy * t - GRAVITY * t * t * 0.5);
                var dotZ = simZ + vz * t;
                var dotScale = 0.62 + i / Math.max(1, dotCount) * 0.42;
                aimDotMatrix.makeScale(dotScale, dotScale, dotScale);
                aimDotMatrix.setPosition(dotX, dotY, dotZ);
                aimDots.setMatrixAt(i, aimDotMatrix);
            }
        } else {
            aimDots.count = 0;
        }
        aimDots.instanceMatrix.needsUpdate = true;

        updateWindRibbons(renderTime, renderAlpha);

        if (windArrow) {
            windArrow.visible = DEBUG_ENABLED;
            if (DEBUG_ENABLED) {
                windAttr = windArrow.geometry.attributes.position;
                windAttr.setXYZ(0, player.x, WATER_DEBUG_Y + 18, player.z);
                windAttr.setXYZ(1, player.x + Math.sin(state.windAngle) * 95, WATER_DEBUG_Y + 18, player.z + Math.cos(state.windAngle) * 95);
                windAttr.needsUpdate = true;
            }
        }
    }

    function mapToMini(value) {
        return MINIMAP_CENTER + (value / SEA_HARD_LIMIT) * MINIMAP_WORLD_RADIUS;
    }

    function drawMinimapPlayerMarker(ctx, x, y, heading) {
        var forwardXValue = Math.sin(heading);
        var forwardYValue = Math.cos(heading);
        var sideX = Math.cos(heading);
        var sideY = -Math.sin(heading);
        var tipSize = 13;
        var tailSize = 9;
        var halfWidth = 6;

        ctx.save();
        ctx.fillStyle = 'rgba(50, 209, 160, 1)';
        ctx.strokeStyle = 'rgba(3, 14, 18, 0.76)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + forwardXValue * tipSize, y + forwardYValue * tipSize);
        ctx.lineTo(x - forwardXValue * tailSize + sideX * halfWidth, y - forwardYValue * tailSize + sideY * halfWidth);
        ctx.lineTo(x - forwardXValue * tailSize - sideX * halfWidth, y - forwardYValue * tailSize - sideY * halfWidth);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.restore();
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

        ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
        ctx.fillStyle = 'rgba(5, 16, 24, 0.84)';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeRect(0.5, 0.5, MINIMAP_SIZE - 1, MINIMAP_SIZE - 1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(MINIMAP_CENTER, 0);
        ctx.lineTo(MINIMAP_CENTER, MINIMAP_SIZE);
        ctx.moveTo(0, MINIMAP_CENTER);
        ctx.lineTo(MINIMAP_SIZE, MINIMAP_CENTER);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(80, 216, 194, 0.18)';
        ctx.beginPath();
        ctx.arc(MINIMAP_CENTER, MINIMAP_CENTER, (SEA_SAFE_LIMIT / SEA_HARD_LIMIT) * MINIMAP_WORLD_RADIUS, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(74, 120, 132, 0.30)';
        ctx.beginPath();
        ctx.arc(MINIMAP_CENTER, MINIMAP_CENTER, (SEA_TIER2_LIMIT / SEA_HARD_LIMIT) * MINIMAP_WORLD_RADIUS, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(18, 35, 48, 0.58)';
        ctx.beginPath();
        ctx.arc(MINIMAP_CENTER, MINIMAP_CENTER, (SEA_TIER3_LIMIT / SEA_HARD_LIMIT) * MINIMAP_WORLD_RADIUS, 0, TAU);
        ctx.stroke();

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            x = mapToMini(island.x);
            y = mapToMini(island.z);
            ctx.fillStyle = island.dock ? 'rgba(255, 209, 102, 0.85)' : 'rgba(83, 158, 90, 0.70)';
            ctx.beginPath();
            ctx.arc(x, y, clamp(island.r / 22, 2.8, 6.4), 0, TAU);
            ctx.fill();
        }

        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            ctx.fillStyle = crate.kind === 'gold' ? 'rgba(241, 200, 91, 0.95)' : 'rgba(181, 114, 49, 0.85)';
            ctx.fillRect(mapToMini(crate.x) - 1.5, mapToMini(crate.z) - 1.5, 3, 3);
        }

        for (i = 0; i < state.enemies.length; i += 1) {
            enemy = state.enemies[i];
            if (enemy.hp <= 0) {
                continue;
            }
            if (enemy.zoneTier === 'tier3') {
                ctx.fillStyle = 'rgba(255, 48, 38, 1)';
            } else if (enemy.zoneTier === 'tier2') {
                ctx.fillStyle = 'rgba(255, 126, 72, 0.98)';
            } else {
                ctx.fillStyle = 'rgba(255, 108, 95, 0.95)';
            }
            ctx.beginPath();
            ctx.arc(mapToMini(enemy.x), mapToMini(enemy.z), enemy.zoneTier === 'tier3' ? 5.6 : (enemy.zoneTier === 'tier2' ? 4.1 : 3.3), 0, TAU);
            ctx.fill();
        }

        drawMinimapPlayerMarker(ctx, mapToMini(p.x), mapToMini(p.z), p.heading);
    }

    function getSeaFogVignetteAlpha() {
        var p = state.player;
        var distanceFromCenter = length2(p.x, p.z);
        var dangerFactor = smoothstep(SEA_TIER3_LIMIT, SEA_FOG_LIMIT, distanceFromCenter);
        var farFogFactor = smoothstep(SEA_FOG_LIMIT, SEA_FOG_LIMIT * 1.24, distanceFromCenter);
        return clamp(dangerFactor * 0.42 + farFogFactor * 0.22, 0, 0.64);
    }

    function updateSeaFogVignette() {
        if (!hud.seaFogVignette) {
            return;
        }
        hud.seaFogVignette.style.opacity = getSeaFogVignetteAlpha().toFixed(3);
    }

    function setBottomReloadHud(card, ring, text, cooldown, reloadSeconds) {
        var progress = getReloadProgress(cooldown, reloadSeconds);

        if (ring) {
            ring.style.setProperty('--reload-fill', progress.toFixed(3));
        }
        if (text) {
            text.textContent = formatBottomReload(cooldown, reloadSeconds);
        }
        if (card) {
            card.classList.toggle('is-ready', cooldown <= 0);
        }
    }

    function updateBottomStatusHud() {
        var p = state.player;
        var reloadSeconds = getShipCannonReloadSeconds(p);
        var sailPercent = Math.round(p.sail * 100);
        var sailStage = clamp(Math.round(p.sail / SAIL_STAGE_STEP), 0, 3);
        var i;
        var dot;

        if (hud.bottomSail) {
            hud.bottomSail.textContent = pad(sailPercent, 2) + '%';
        }

        for (i = 0; i < hud.bottomSailStages.length; i += 1) {
            dot = hud.bottomSailStages[i];
            dot.classList.toggle('is-on', i <= sailStage);
        }

        setBottomReloadHud(hud.bottomLeftCard, hud.bottomLeftRing, hud.bottomLeftText, p.leftCannonCooldown, reloadSeconds);
        setBottomReloadHud(hud.bottomRightCard, hud.bottomRightRing, hud.bottomRightText, p.rightCannonCooldown, reloadSeconds);
    }

    function syncResultOverlay() {
        var visible = state.gameOver && (state.resultType === 'defeat' || state.resultType === 'victory');
        var title = state.resultType === 'victory' ? 'Terror of the Seas!' : 'Ship lost';
        var body = state.resultType === 'victory'
            ? 'You defeated every enemy on the sea. Congratulations, and thank you for playing!'
            : 'You fought bravely, but something went wrong. Try again or return to the resume.';

        if (!hud.resultOverlay) {
            return;
        }

        hud.resultOverlay.hidden = !visible;
        hud.resultOverlay.classList.toggle('is-visible', visible);
        hud.resultOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');

        if (hud.resultTitle) {
            hud.resultTitle.textContent = title;
        }
        if (hud.resultText) {
            hud.resultText.textContent = body;
        }
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
            hud.reload.textContent = 'L ' + formatCannonReload(p.leftCannonCooldown, getShipCannonReloadSeconds(p)) + ' / R ' + formatCannonReload(p.rightCannonCooldown, getShipCannonReloadSeconds(p));
        }
        updateBottomStatusHud();
        updateSeaFogVignette();
        if (hud.dock) {
            hud.dock.textContent = state.dockPanelOpen ? 'SHOP' : (state.nearDock ? 'PRESS F' : (state.docked ? 'DOCKED' : 'NO'));
        }

        if (hud.message) {
            if (DEBUG_ENABLED) {
                debugText = 'DEBUG seed=' + state.seed + ' speed=' + speed + ' proj=' + state.projectiles.length + ' crates=' + state.crates.length;
                debugText += ' ai=' + state.enemies.map(function (enemy) { return enemy.aiState; }).join(',');
                hud.message.textContent = state.messageTimer > 0 ? state.messageText + ' | ' + debugText : debugText;
            } else {
                hud.message.textContent = state.messageTimer > 0 ? state.messageText : (state.nearDock ? 'Press F to open the pier services menu.' : 'W/S sail stages. A/D rudder. Q/E camera. Hold Space or LMB to aim, release to fire. Dock at a pier with F.');
            }
        }

        drawMinimap();
        syncDockPanel();
        syncResultOverlay();

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
        var renderAlpha;
        var renderTime;

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

        renderAlpha = clamp(accumulator / FIXED_DT, 0, MAX_RENDER_ALPHA);
        renderTime = renderSimulationTime(renderAlpha);

        updateCamera(dt, renderAlpha);
        updateWater(renderTime);
        syncMeshes(renderAlpha, renderTime);
        updateHud();
        renderer.render(scene, camera);
        window.requestAnimationFrame(renderFrame);
    }

    function resetGame() {
        state = makeInitialState();
        accumulator = 0;
        clockStarted = false;
        buildWorld();
        syncMeshes(MAX_RENDER_ALPHA, state.time);
        syncDockPanel();
        syncResultOverlay();
        setMessage('New run. Catch the wind, fire broadside, and press F inside a pier zone to dock.', 4);
    }

    function togglePause() {
        state.paused = !state.paused;
        updateHud();
    }

    function onKeyDown(event) {
        if (event.repeat) {
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
            state.input.aimHeld = true;
            state.input.aimSource = 'keyboard';
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
        } else if (event.code === 'Space') {
            if (!state.dockPanelOpen && state.input.aimHeld && state.input.aimSource === 'keyboard' && state.mouseInside) {
                state.input.fireReleaseQueued = true;
            }
            if (state.input.aimSource === 'keyboard') {
                state.input.aimHeld = false;
                state.input.aimSource = '';
            }
            event.preventDefault();
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
                state.input.aimHeld = true;
                state.input.aimSource = 'mouse';
                event.preventDefault();
            }
        });
        window.addEventListener('mouseup', function (event) {
            if (event.button !== 0 || !state.input.aimHeld || state.input.aimSource !== 'mouse') {
                return;
            }
            if (updateMouseWorld(event.clientX, event.clientY) && !state.dockPanelOpen) {
                state.input.fireReleaseQueued = true;
            }
            state.input.aimHeld = false;
            state.input.aimSource = '';
            event.preventDefault();
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
        if (hud.resultRestart) {
            hud.resultRestart.addEventListener('click', resetGame);
        }
        if (hud.dockClose) {
            hud.dockClose.addEventListener('click', closeDockPanel);
        }
        if (hud.dockSell) {
            hud.dockSell.addEventListener('click', sellCargoAtDock);
        }
        if (hud.dockRepair) {
            hud.dockRepair.addEventListener('click', repairAtDock);
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
            setMessage('Sail and Fire loaded. W/S switch sail stages, A/D rudder, Q/E camera. Hold Space or LMB to aim, release to fire.', 5);
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
