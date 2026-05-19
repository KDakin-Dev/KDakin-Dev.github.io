(function () {
    "use strict";

    var CONFIG = {
        canvasDprMax: 2,

        portfolio: {
            minNodes: 48,
            maxNodes: 130,
            areaPerNode: 17000,
            linkDistanceDesktop: 146,
            linkDistanceMobile: 118,
            pointerRadius: 190,
            pointerPushRadius: 260,
            pointerForce: 170,
            pointerPushForce: 360
        },

        game: {
            playAreaLeft: 18,
            playAreaRight: 18,
            playAreaTop: 124,
            playAreaBottom: 26,

            connectDistance: 82,
            meshDistance: 104,
            bondBreakDistance: 176,
            collectDelayMs: 900,

            pointerRadius: 156,
            pointerPushRadius: 240,
            pointerForce: 225,
            pointerPushForce: 520,
            pulseForce: 210,

            springStiffness: 11.5,
            springDamping: 1.55,
            coreSpringBonus: 1.35,

            baseDamping: 0.993,
            connectedDamping: 0.987,
            maxSpeedBase: 52,
            maxSpeedPerLevel: 1.8,
            spawnSpeedBase: 8.0,
            spawnSpeedPerLevel: 0.45,

            orbitDriveLoose: 2.8,
            orbitDriveConnected: 0.62,
            orbitTangentialDrive: 4.6,
            orbitJitter: 1.8,

            previewAlpha: 0.13,
            bondAlpha: 0.72
        },

        atoms: {
            CORE: { name: "CORE", mass: 9999, radius: 7.0, color: "143, 214, 255" },
            H: { name: "H", mass: 1, radius: 2.5, color: "99, 166, 255" },
            He: { name: "He", mass: 4, radius: 3.0, color: "126, 242, 176" },
            Li: { name: "Li", mass: 7, radius: 3.3, color: "198, 154, 255" },
            Be: { name: "Be", mass: 9, radius: 3.5, color: "120, 220, 190" },
            B: { name: "B", mass: 11, radius: 3.7, color: "255, 170, 104" },
            C: { name: "C", mass: 12, radius: 3.9, color: "185, 148, 255" },
            N: { name: "N", mass: 14, radius: 4.0, color: "125, 190, 255" },
            O: { name: "O", mass: 16, radius: 4.2, color: "255, 209, 102" },
            Si: { name: "Si", mass: 28, radius: 4.9, color: "255, 145, 77" },
            Fe: { name: "Fe", mass: 56, radius: 5.8, color: "255, 107, 139" }
        },

        reactions: [
            { name: "He", color: "126, 242, 176", mass: 4, priority: 100, match: { H: 2 }, exact: true },
            { name: "CH4", color: "185, 148, 255", mass: 16, priority: 90, match: { C: 1, H: 4 } },
            { name: "H2O", color: "255, 209, 102", mass: 18, priority: 88, match: { O: 1, H: 2 } },
            { name: "CO2", color: "255, 184, 94", mass: 44, priority: 86, match: { C: 1, O: 2 } },
            { name: "SiO2", color: "255, 145, 77", mass: 60, priority: 84, match: { Si: 1, O: 2 } },
            { name: "FeO", color: "255, 107, 139", mass: 72, priority: 82, match: { Fe: 1, O: 1 } },
            { name: "H2", color: "143, 214, 255", mass: 2, priority: 60, match: { H: 2 } },
            { name: "O2", color: "255, 209, 102", mass: 32, priority: 58, match: { O: 2 } },
            { name: "N2", color: "125, 190, 255", mass: 28, priority: 56, match: { N: 2 } }
        ],

        stages: [
            { label: "H seed", atoms: ["H", "H", "H"], connectDistance: 82, meshDistance: 104, target: 3 },
            { label: "H2 chain", atoms: ["H", "H", "H", "H"], connectDistance: 82, meshDistance: 104, target: 4 },
            { label: "He cluster", atoms: ["H", "H", "He", "He"], connectDistance: 80, meshDistance: 102, target: 4 },
            { label: "Li lattice", atoms: ["H", "H", "He", "Li", "Li"], connectDistance: 78, meshDistance: 100, target: 5 },
            { label: "Be ring", atoms: ["H", "He", "Li", "Be", "Be", "H"], connectDistance: 78, meshDistance: 98, target: 6 },
            { label: "B web", atoms: ["H", "He", "Li", "Be", "B", "B", "H"], connectDistance: 76, meshDistance: 98, target: 7 },
            { label: "C frame", atoms: ["H", "H", "He", "B", "C", "C", "C"], connectDistance: 76, meshDistance: 98, target: 7 },
            { label: "CH4 molecule", atoms: ["C", "H", "H", "H", "H", "He", "H"], connectDistance: 78, meshDistance: 100, target: 7 },
            { label: "N bridge", atoms: ["C", "N", "N", "H", "H", "He", "Li"], connectDistance: 76, meshDistance: 98, target: 7 },
            { label: "O mesh", atoms: ["O", "O", "C", "H", "H", "N", "He", "Li"], connectDistance: 76, meshDistance: 98, target: 8 },
            { label: "H2O cluster", atoms: ["O", "H", "H", "O", "H", "H", "He", "C"], connectDistance: 78, meshDistance: 100, target: 8 },
            { label: "Si grid", atoms: ["Si", "Si", "O", "O", "C", "H", "H", "N", "He"], connectDistance: 76, meshDistance: 98, target: 9 },
            { label: "Fe core", atoms: ["Fe", "Fe", "Si", "O", "O", "C", "C", "H", "He", "N"], connectDistance: 76, meshDistance: 98, target: 10 }
        ]
    };

    var canvas = document.getElementById("field-canvas");
    var ctx = canvas.getContext("2d", { alpha: true });

    var dom = {
        metricNodes: document.getElementById("metric-nodes"),
        metricLinks: document.getElementById("metric-links"),
        metricInput: document.getElementById("metric-input"),
        metricScroll: document.getElementById("metric-scroll"),
        gameLevel: document.getElementById("game-level"),
        gameCollected: document.getElementById("game-collected"),
        gameTarget: document.getElementById("game-target"),
        gameLinks: document.getElementById("game-links"),
        gameNodes: document.getElementById("game-nodes"),
        gameInput: document.getElementById("game-input"),
        gameAtoms: document.getElementById("game-atoms"),
        gameProgressFill: document.getElementById("game-progress-fill"),
        enterGameButton: document.getElementById("enter-game"),
        exitGameButton: document.getElementById("exit-game"),
        miniProbe: document.querySelector(".probe-dot"),
        miniCore: document.querySelector(".core-dot"),
        miniOrbitBox: document.querySelector(".mini-orbit")
    };

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = {
        width: 1,
        height: 1,
        dpr: 1,
        lastTime: 0,
        nodes: [],
        bonds: [],
        bondKeys: Object.create(null),
        pulses: [],
        pointer: {
            x: 0,
            y: 0,
            px: 0,
            py: 0,
            active: false,
            down: false,
            speed: 0
        },
        scroll01: 0,
        linkCount: 0,
        gameMode: false,
        level: 1,
        stage: null,
        connectedCount: 0,
        target: 3,
        levelAdvancePending: false,
        portfolioNodes: []
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function pad3(value) {
        return String(value).padStart(3, "0").slice(-3);
    }

    function pad2(value) {
        return String(value).padStart(2, "0");
    }

    function distSq(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    function resize() {
        state.dpr = clamp(window.devicePixelRatio || 1, 1, CONFIG.canvasDprMax);
        state.width = Math.max(1, window.innerWidth);
        state.height = Math.max(1, window.innerHeight);
        canvas.width = Math.floor(state.width * state.dpr);
        canvas.height = Math.floor(state.height * state.dpr);
        canvas.style.width = state.width + "px";
        canvas.style.height = state.height + "px";
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        if (state.gameMode) {
            keepGameInsideBounds();
        } else {
            rebuildPortfolioNodes();
        }
    }

    function getGameBounds() {
        return {
            left: CONFIG.game.playAreaLeft,
            right: state.width - CONFIG.game.playAreaRight,
            top: CONFIG.game.playAreaTop,
            bottom: state.height - CONFIG.game.playAreaBottom
        };
    }

    function wantedPortfolioNodeCount() {
        var area = state.width * state.height;
        return clamp(
            Math.floor(area / CONFIG.portfolio.areaPerNode),
            CONFIG.portfolio.minNodes,
            CONFIG.portfolio.maxNodes
        );
    }

    function getOrbitCenter(time) {
        return {
            x: state.width * (0.5 + Math.sin(time * 0.00008) * 0.045),
            y: state.height * (0.48 + Math.cos(time * 0.00007) * 0.035)
        };
    }

    function getOrbitParams(index, scale) {
        var group = index % 5;
        var minDim = Math.min(state.width, state.height);
        return {
            group: group,
            a: minDim * (0.30 + group * 0.075) * (1.54 - group * 0.055) * scale,
            b: minDim * (0.115 + group * 0.045) * scale,
            rot: -0.42 + group * 0.29,
            speed: (group % 2 === 0 ? 1 : -1) * rand(0.10, 0.24) * (1 + group * 0.08)
        };
    }

    function orbitPoint(cx, cy, a, b, rot, t) {
        var x = Math.cos(t) * a;
        var y = Math.sin(t) * b;
        var c = Math.cos(rot);
        var s = Math.sin(rot);
        return {
            x: cx + x * c - y * s,
            y: cy + x * s + y * c
        };
    }

    function createPortfolioNode(index) {
        var center = getOrbitCenter(0);
        var params = getOrbitParams(index, 1.0);
        var phase = rand(0, Math.PI * 2);
        var point = orbitPoint(center.x, center.y, params.a, params.b, params.rot, phase);
        return {
            id: index,
            x: point.x,
            y: point.y,
            a: params.a,
            b: params.b,
            rot: params.rot,
            speed: params.speed,
            orbitGroup: params.group,
            phase: phase,
            ox: rand(-5, 5),
            oy: rand(-5, 5),
            ovx: 0,
            ovy: 0,
            size: rand(1.1, 2.7),
            atom: CONFIG.atoms.H
        };
    }

    function rebuildPortfolioNodes() {
        var count = wantedPortfolioNodeCount();
        if (state.portfolioNodes.length > count) {
            state.portfolioNodes.length = count;
        }
        while (state.portfolioNodes.length < count) {
            state.portfolioNodes.push(createPortfolioNode(state.portfolioNodes.length));
        }
        state.nodes = state.portfolioNodes;
        if (dom.metricNodes) dom.metricNodes.textContent = pad3(state.nodes.length);
    }

    function getStage(level) {
        var base = CONFIG.stages[Math.min(level - 1, CONFIG.stages.length - 1)];
        if (level <= CONFIG.stages.length) {
            return base;
        }

        var extraCount = Math.min(8, level - CONFIG.stages.length);
        var atoms = base.atoms.slice();
        var extraPool = ["H", "H", "He", "C", "O", "Si", "Fe"];
        for (var i = 0; i < extraCount; i += 1) {
            atoms.push(extraPool[i % extraPool.length]);
        }

        return {
            label: base.label + "+",
            atoms: atoms,
            connectDistance: base.connectDistance,
            meshDistance: base.meshDistance,
            target: atoms.length
        };
    }

    function createGameNode(id, atomName, x, y, connected, core) {
        var atom = CONFIG.atoms[atomName];
        var bounds = getGameBounds();
        var cx = (bounds.left + bounds.right) * 0.5;
        var cy = (bounds.top + bounds.bottom) * 0.5;
        var dx = x - cx;
        var dy = y - cy;
        var angle = Math.atan2(dy, dx);
        var ring = Math.sqrt(dx * dx + dy * dy);
        var speed = CONFIG.game.spawnSpeedBase + state.level * CONFIG.game.spawnSpeedPerLevel;
        var massScale = 1 / Math.sqrt(Math.max(1, atom.mass));
        var orbitDir = id % 2 === 0 ? 1 : -1;

        return {
            id: id,
            atom: atom,
            atomName: atomName,
            baseMass: atom.mass,
            mass: atom.mass,
            displayName: atom.name,
            displayColor: atom.color,
            formula: "",
            formulaMass: atom.mass,
            x: x,
            y: y,
            vx: core ? 0 : rand(-speed, speed) * massScale,
            vy: core ? 0 : rand(-speed, speed) * massScale,
            connected: connected,
            core: core,
            radius: atom.radius,
            baseRadius: atom.radius,
            pulse: rand(0, Math.PI * 2),
            orbitAngle: angle,
            orbitA: clamp(ring * rand(0.86, 1.16), 90, Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * 0.48),
            orbitB: clamp(ring * rand(0.42, 0.74), 54, Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * 0.34),
            orbitRot: rand(-0.7, 0.7),
            orbitDir: orbitDir,
            orbitSpeed: orbitDir * (0.18 + rand(0.0, 0.10)) / Math.pow(Math.max(1, atom.mass), 0.38)
        };
    }

    function beginLevel(level) {
        var stage = getStage(level);
        var bounds = getGameBounds();
        var cx = (bounds.left + bounds.right) * 0.5;
        var cy = (bounds.top + bounds.bottom) * 0.5;

        state.level = level;
        state.stage = stage;
        state.nodes = [];
        state.bonds = [];
        state.bondKeys = Object.create(null);
        state.connectedCount = 0;
        state.target = stage.target || stage.atoms.length;
        state.levelAdvancePending = false;

        state.nodes.push(createGameNode(0, "CORE", cx, cy, true, true));

        var count = stage.atoms.length;
        for (var i = 0; i < count; i += 1) {
            var angle = (Math.PI * 2 * i) / Math.max(1, count) + rand(-0.32, 0.32);
            var ring = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * rand(0.26, 0.45);
            var x = cx + Math.cos(angle) * ring + rand(-34, 34);
            var y = cy + Math.sin(angle) * ring + rand(-34, 34);
            x = clamp(x, bounds.left + 36, bounds.right - 36);
            y = clamp(y, bounds.top + 36, bounds.bottom - 36);
            state.nodes.push(createGameNode(i + 1, stage.atoms[i], x, y, false, false));
        }

        recalculateComponents();
        updateGameStats();
    }

    function keepGameInsideBounds() {
        var bounds = getGameBounds();
        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            var margin = 22 + n.radius;
            n.x = clamp(n.x, bounds.left + margin, bounds.right - margin);
            n.y = clamp(n.y, bounds.top + margin, bounds.bottom - margin);
        }
    }

    function updateScroll() {
        var doc = document.documentElement;
        var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        state.scroll01 = state.gameMode ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
        if (dom.metricScroll) dom.metricScroll.textContent = state.scroll01.toFixed(2);
    }

    function setPointer(x, y, active) {
        var p = state.pointer;
        p.px = p.x;
        p.py = p.y;
        p.x = x;
        p.y = y;
        p.active = active;
        var dx = p.x - p.px;
        var dy = p.y - p.py;
        p.speed = Math.sqrt(dx * dx + dy * dy);
    }

    function addPulse(x, y, power) {
        state.pulses.push({
            x: x,
            y: y,
            r: 0,
            life: 1,
            power: power
        });
        if (state.pulses.length > 12) {
            state.pulses.shift();
        }
    }

    function enterGameMode() {
        state.gameMode = true;
        document.body.classList.add("game-mode");
        beginLevel(1);
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(function () {});
        }
    }

    function exitGameMode() {
        state.gameMode = false;
        document.body.classList.remove("game-mode");
        state.nodes = state.portfolioNodes;
        state.bonds = [];
        state.bondKeys = Object.create(null);
        rebuildPortfolioNodes();
        updateGameStats();
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(function () {});
        }
    }

    function applyPortfolioPointerForce(node, baseX, baseY, applyForce) {
        if (state.pointer.active) {
            var px = baseX - state.pointer.x;
            var py = baseY - state.pointer.y;
            var pdSq = px * px + py * py + 140;
            var pd = Math.sqrt(pdSq);
            var radius = state.pointer.down ? CONFIG.portfolio.pointerPushRadius : CONFIG.portfolio.pointerRadius;
            if (pd < radius) {
                var force = (1 - pd / radius) * (state.pointer.down ? CONFIG.portfolio.pointerPushForce : CONFIG.portfolio.pointerForce);
                applyForce((px / pd) * force, (py / pd) * force);
            }
        }

        for (var i = 0; i < state.pulses.length; i += 1) {
            var pulse = state.pulses[i];
            var qx = baseX - pulse.x;
            var qy = baseY - pulse.y;
            var qd = Math.sqrt(qx * qx + qy * qy) + 0.001;
            var band = Math.abs(qd - pulse.r);
            if (band < 90) {
                var push = (1 - band / 90) * pulse.life * pulse.power;
                applyForce((qx / qd) * push, (qy / qd) * push);
            }
        }
    }

    function updatePortfolioNode(node, dt, time) {
        var margin = 26 + node.size;
        var center = getOrbitCenter(time);
        var energy = 1;
        var rot = node.rot + Math.sin(time * 0.00006 + node.orbitGroup) * 0.035;
        var t = node.phase + time * 0.001 * node.speed * energy;
        var target = orbitPoint(center.x, center.y, node.a, node.b, rot, t);

        var ax = -node.ox * 1.8;
        var ay = -node.oy * 1.8;

        applyPortfolioPointerForce(node, target.x, target.y, function (fx, fy) {
            ax += fx;
            ay += fy;
        });

        node.ovx += ax * dt;
        node.ovy += ay * dt;
        node.ovx *= Math.pow(0.90, dt * 60);
        node.ovy *= Math.pow(0.90, dt * 60);
        node.ox += node.ovx * dt;
        node.oy += node.ovy * dt;

        var maxOffset = state.pointer.down ? 140 : 95;
        var offsetLen = Math.sqrt(node.ox * node.ox + node.oy * node.oy);
        if (offsetLen > maxOffset) {
            node.ox = node.ox / offsetLen * maxOffset;
            node.oy = node.oy / offsetLen * maxOffset;
        }

        node.x = clamp(target.x + node.ox, margin, state.width - margin);
        node.y = clamp(target.y + node.oy, margin, state.height - margin);
    }

    function applyGamePointerForces(dt) {
        if (!state.pointer.active) return;

        var radius = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
        var strength = state.pointer.down ? CONFIG.game.pointerPushForce : CONFIG.game.pointerForce;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;

            var dx = n.x - state.pointer.x;
            var dy = n.y - state.pointer.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            if (d > radius) continue;

            var falloff = 1 - d / radius;
            var massScale = Math.pow(Math.max(1, getNodeMass(n)), 0.72);
            var force = strength * falloff / massScale;
            n.vx += (dx / d) * force * dt;
            n.vy += (dy / d) * force * dt;
        }
    }

    function applyPulseForces(dt) {
        for (var p = state.pulses.length - 1; p >= 0; p -= 1) {
            var pulse = state.pulses[p];

            for (var i = 0; i < state.nodes.length; i += 1) {
                var n = state.nodes[i];
                if (n.core) continue;

                var dx = n.x - pulse.x;
                var dy = n.y - pulse.y;
                var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
                var band = Math.abs(d - pulse.r);
                if (band > 92) continue;

                var falloff = (1 - band / 92) * pulse.life;
                var massScale = Math.pow(Math.max(1, getNodeMass(n)), 0.72);
                var force = pulse.power * falloff / massScale;
                n.vx += (dx / d) * force * dt;
                n.vy += (dy / d) * force * dt;
            }
        }
    }

    function bondKey(a, b) {
        return a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
    }

    function hasBond(a, b) {
        return !!state.bondKeys[bondKey(a, b)];
    }

    function addBond(a, b, restLength, source) {
        var key = bondKey(a, b);
        if (state.bondKeys[key]) return false;

        state.bondKeys[key] = true;
        state.bonds.push({
            a: a.id,
            b: b.id,
            rest: restLength,
            source: source || "mesh",
            age: 0
        });
        return true;
    }

    function getNodeById(id) {
        return state.nodes[id] || null;
    }

    function getNodeMass(node) {
        if (!node) return 1;
        return Math.max(1, node.mass || node.baseMass || 1);
    }

    function resetNodeFormula(node) {
        if (!node || node.core) return;
        node.mass = node.baseMass;
        node.radius = node.baseRadius;
        node.displayName = node.atom.name;
        node.displayColor = node.atom.color;
        node.formula = "";
        node.formulaMass = node.baseMass;
    }

    function componentKeyCounts(nodes) {
        var counts = {};
        var total = 0;
        var mass = 0;

        for (var i = 0; i < nodes.length; i += 1) {
            var n = nodes[i];
            if (n.core) continue;
            counts[n.atomName] = (counts[n.atomName] || 0) + 1;
            total += 1;
            mass += n.baseMass || n.mass || 1;
        }

        return {
            counts: counts,
            total: total,
            mass: mass
        };
    }

    function reactionMatches(rule, info) {
        var key;
        var needTotal = 0;

        for (key in rule.match) {
            if (Object.prototype.hasOwnProperty.call(rule.match, key)) {
                if ((info.counts[key] || 0) < rule.match[key]) return false;
                needTotal += rule.match[key];
            }
        }

        if (rule.exact && info.total !== needTotal) return false;
        return true;
    }

    function classifyComponent(nodes) {
        var info = componentKeyCounts(nodes);
        if (info.total <= 1) return null;

        var best = null;
        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var rule = CONFIG.reactions[i];
            if (!reactionMatches(rule, info)) continue;
            if (!best || rule.priority > best.priority) {
                best = rule;
            }
        }

        if (!best) return null;

        return {
            name: best.name,
            color: best.color,
            mass: best.mass || info.mass,
            nodeCount: info.total
        };
    }

    function recalculateComponents() {
        var adjacency = {};
        var i;

        for (i = 0; i < state.nodes.length; i += 1) {
            adjacency[state.nodes[i].id] = [];
            resetNodeFormula(state.nodes[i]);
        }

        for (i = 0; i < state.bonds.length; i += 1) {
            var bond = state.bonds[i];
            if (!adjacency[bond.a]) adjacency[bond.a] = [];
            if (!adjacency[bond.b]) adjacency[bond.b] = [];
            adjacency[bond.a].push(bond.b);
            adjacency[bond.b].push(bond.a);
        }

        var visited = {};
        var coreComponent = {};
        var components = [];

        for (i = 0; i < state.nodes.length; i += 1) {
            var start = state.nodes[i];
            if (visited[start.id]) continue;

            var queue = [start.id];
            var componentIds = [];
            visited[start.id] = true;

            while (queue.length > 0) {
                var id = queue.shift();
                componentIds.push(id);
                var list = adjacency[id] || [];

                for (var j = 0; j < list.length; j += 1) {
                    var next = list[j];
                    if (visited[next]) continue;
                    visited[next] = true;
                    queue.push(next);
                }
            }

            var componentNodes = [];
            var hasCore = false;
            for (var k = 0; k < componentIds.length; k += 1) {
                var node = getNodeById(componentIds[k]);
                if (!node) continue;
                componentNodes.push(node);
                if (node.core) hasCore = true;
            }

            components.push({
                nodes: componentNodes,
                hasCore: hasCore
            });

            if (hasCore) {
                for (var c = 0; c < componentNodes.length; c += 1) {
                    coreComponent[componentNodes[c].id] = true;
                }
            }
        }

        for (i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            n.connected = !!coreComponent[n.id];
        }

        for (i = 0; i < components.length; i += 1) {
            var reaction = classifyComponent(components[i].nodes);
            if (!reaction) continue;

            var perNodeMass = reaction.mass / Math.max(1, reaction.nodeCount);
            for (var r = 0; r < components[i].nodes.length; r += 1) {
                var rn = components[i].nodes[r];
                if (rn.core) continue;
                rn.formula = reaction.name;
                rn.displayName = reaction.name;
                rn.displayColor = reaction.color;
                rn.formulaMass = reaction.mass;
                rn.mass = Math.max(rn.baseMass, rn.baseMass + perNodeMass * 0.35);
                rn.radius = rn.baseRadius + clamp(perNodeMass * 0.055, 0.0, 2.2);
            }
        }

        updateConnectedCount();
    }

    function breakStretchedBonds() {
        var kept = [];
        var changed = false;

        for (var i = 0; i < state.bonds.length; i += 1) {
            var bond = state.bonds[i];
            var a = getNodeById(bond.a);
            var b = getNodeById(bond.b);

            if (!a || !b) {
                changed = true;
                continue;
            }

            var d = Math.sqrt(distSq(a, b));
            var breakDistance = Math.max(CONFIG.game.bondBreakDistance, bond.rest * 2.35 + a.radius + b.radius);

            if (d > breakDistance) {
                delete state.bondKeys[bondKey(a, b)];
                addPulse((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 42);
                changed = true;
                continue;
            }

            kept.push(bond);
        }

        if (changed) {
            state.bonds = kept;
            recalculateComponents();
        }
    }

    function getGameConnectDistance() {
        var stage = state.stage || getStage(state.level);
        return stage.connectDistance || CONFIG.game.connectDistance;
    }

    function getGameMeshDistance() {
        var stage = state.stage || getStage(state.level);
        return stage.meshDistance || CONFIG.game.meshDistance;
    }

    function detectNewBonds() {
        var connectDistance = getGameConnectDistance();
        var meshDistance = getGameMeshDistance();
        var connectSq = connectDistance * connectDistance;
        var meshSq = meshDistance * meshDistance;
        var changed = false;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];

            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                if (a.core && b.core) continue;
                if (hasBond(a, b)) continue;

                var dSq = distSq(a, b);
                var shouldCoreBond = (a.connected || b.connected) && dSq < connectSq;
                var shouldMoleculeBond = !a.core && !b.core && dSq < connectSq;
                var shouldMeshBond = a.connected && b.connected && dSq < meshSq;

                if (shouldCoreBond || shouldMoleculeBond || shouldMeshBond) {
                    var d = Math.sqrt(dSq);
                    var rest = clamp(d * 0.72, 32 + a.radius + b.radius, 62 + a.radius + b.radius);
                    var source = a.core || b.core ? "core" : (shouldMeshBond ? "mesh" : "molecule");
                    if (addBond(a, b, rest, source)) {
                        addPulse((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, source === "molecule" ? 42 : 66);
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            recalculateComponents();
        }
    }

    function applyBondForces(dt) {
        for (var i = 0; i < state.bonds.length; i += 1) {
            var bond = state.bonds[i];
            var a = getNodeById(bond.a);
            var b = getNodeById(bond.b);
            if (!a || !b) continue;

            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var nx = dx / d;
            var ny = dy / d;

            var stretch = d - bond.rest;
            var stiffness = CONFIG.game.springStiffness;
            if (bond.source === "core") stiffness *= CONFIG.game.coreSpringBonus;
            if (bond.source === "molecule") stiffness *= 1.18;

            var spring = stretch * stiffness;

            var rvx = b.vx - a.vx;
            var rvy = b.vy - a.vy;
            var rel = rvx * nx + rvy * ny;
            var damp = rel * CONFIG.game.springDamping;

            var force = spring + damp;

            if (!a.core) {
                a.vx += force * nx * dt / getNodeMass(a);
                a.vy += force * ny * dt / getNodeMass(a);
            }
            if (!b.core) {
                b.vx -= force * nx * dt / getNodeMass(b);
                b.vy -= force * ny * dt / getNodeMass(b);
            }

            bond.age += dt;
        }
    }

    function applyGameAmbientForces(dt, time) {
        var bounds = getGameBounds();
        var cx = (bounds.left + bounds.right) * 0.5;
        var cy = (bounds.top + bounds.bottom) * 0.5;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];

            if (n.core) {
                n.x = cx;
                n.y = cy;
                n.vx = 0;
                n.vy = 0;
                continue;
            }

            n.orbitAngle += n.orbitSpeed * dt * (1.0 + state.level * 0.018);

            var rot = n.orbitRot + Math.sin(time * 0.00008 + n.pulse) * 0.05;
            var c = Math.cos(rot);
            var s = Math.sin(rot);
            var ox = Math.cos(n.orbitAngle) * n.orbitA;
            var oy = Math.sin(n.orbitAngle) * n.orbitB;
            var tx = cx + ox * c - oy * s;
            var ty = cy + ox * s + oy * c;

            var dx = tx - n.x;
            var dy = ty - n.y;

            var drive = n.connected ? CONFIG.game.orbitDriveConnected : CONFIG.game.orbitDriveLoose;
            var massScale = Math.pow(getNodeMass(n), 0.62);

            n.vx += dx * drive * dt / massScale;
            n.vy += dy * drive * dt / massScale;

            var tangentX = -Math.sin(n.orbitAngle) * n.orbitDir;
            var tangentY = Math.cos(n.orbitAngle) * n.orbitDir;
            var tangent = CONFIG.game.orbitTangentialDrive * (n.connected ? 0.32 : 1.0) / massScale;
            n.vx += tangentX * tangent * dt;
            n.vy += tangentY * tangent * dt;

            var jitter = CONFIG.game.orbitJitter * (n.connected ? 0.22 : 1.0);
            n.vx += Math.sin(time * 0.0013 + n.pulse) * jitter * dt / massScale;
            n.vy += Math.cos(time * 0.0011 + n.pulse) * jitter * dt / massScale;
        }
    }

    function integrateGameNodes(dt) {
        var bounds = getGameBounds();

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;

            var damping = n.connected ? CONFIG.game.connectedDamping : CONFIG.game.baseDamping;
            n.vx *= Math.pow(damping, dt * 60);
            n.vy *= Math.pow(damping, dt * 60);

            var maxSpeed = (CONFIG.game.maxSpeedBase + state.level * CONFIG.game.maxSpeedPerLevel) / Math.pow(getNodeMass(n), 0.18);
            var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (speed > maxSpeed) {
                n.vx = n.vx / speed * maxSpeed;
                n.vy = n.vy / speed * maxSpeed;
            }

            n.x += n.vx * dt;
            n.y += n.vy * dt;

            var margin = 22 + n.radius;
            if (n.x < bounds.left + margin) {
                n.x = bounds.left + margin;
                n.vx = Math.abs(n.vx) * 0.72;
            }
            if (n.x > bounds.right - margin) {
                n.x = bounds.right - margin;
                n.vx = -Math.abs(n.vx) * 0.72;
            }
            if (n.y < bounds.top + margin) {
                n.y = bounds.top + margin;
                n.vy = Math.abs(n.vy) * 0.72;
            }
            if (n.y > bounds.bottom - margin) {
                n.y = bounds.bottom - margin;
                n.vy = -Math.abs(n.vy) * 0.72;
            }
        }
    }

    function detectConnections() {
        detectNewBonds();
        breakStretchedBonds();
        recalculateComponents();

        if (!state.levelAdvancePending && state.connectedCount >= state.target) {
            state.levelAdvancePending = true;
            window.setTimeout(function () {
                if (state.gameMode) {
                    beginLevel(state.level + 1);
                }
            }, CONFIG.game.collectDelayMs);
        }
    }

    function updateConnectedCount() {
        var count = 0;
        for (var i = 0; i < state.nodes.length; i += 1) {
            if (!state.nodes[i].core && state.nodes[i].connected) {
                count += 1;
            }
        }
        state.connectedCount = count;
    }

    function updateGamePhysics(dt, time) {
        applyGameAmbientForces(dt, time);
        applyGamePointerForces(dt);
        applyPulseForces(dt);

        applyBondForces(dt);
        applyBondForces(dt);

        integrateGameNodes(dt);
        detectConnections();
    }

    function drawGrid(time) {
        var grid = state.gameMode ? 70 : 80;
        var offset = (time * 0.006) % grid;
        ctx.save();
        ctx.globalAlpha = state.gameMode ? 0.5 : 0.34;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(99, 166, 255, 0.055)";
        ctx.beginPath();

        var x;
        var y;

        for (x = -grid + offset; x < state.width + grid; x += grid) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, state.height);
        }
        for (y = -grid + offset; y < state.height + grid; y += grid) {
            ctx.moveTo(0, y);
            ctx.lineTo(state.width, y);
        }

        ctx.stroke();
        ctx.restore();
    }

    function drawBounds() {
        if (!state.gameMode) return;
        var bounds = getGameBounds();
        ctx.save();
        ctx.strokeStyle = "rgba(143, 214, 255, 0.26)";
        ctx.lineWidth = 1;
        ctx.setLineDash([9, 10]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        ctx.restore();
    }

    function drawOrbitTraces(time) {
        var center = getOrbitCenter(time);
        var count = state.gameMode ? 2 : 5;
        ctx.save();

        for (var i = 0; i < count; i += 1) {
            var params = getOrbitParams(i, state.gameMode ? 0.72 : 1.0);
            var rot = params.rot + Math.sin(time * 0.00006 + params.group) * 0.035;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, params.a, params.b, rot, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(99, 166, 255, " + (state.gameMode ? 0.06 : 0.13 - i * 0.015) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPortfolioLinks() {
        var limit = state.width < 700 ? CONFIG.portfolio.linkDistanceMobile : CONFIG.portfolio.linkDistanceDesktop;
        var limitSq = limit * limit;
        var count = 0;

        ctx.save();
        ctx.lineWidth = 1;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];
            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var dSq = dx * dx + dy * dy;
                if (dSq < limitSq) {
                    var alpha = (1 - dSq / limitSq) * 0.22;
                    ctx.strokeStyle = "rgba(99, 166, 255, " + alpha.toFixed(4) + ")";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                    count += 1;
                }
            }
        }

        ctx.restore();
        state.linkCount = count;
        if (dom.metricLinks) dom.metricLinks.textContent = pad3(count);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(count);
    }

    function drawGamePreviewLinks() {
        var stage = state.stage || getStage(state.level);
        var limit = stage.meshDistance || CONFIG.game.meshDistance;
        var limitSq = limit * limit;

        ctx.save();
        ctx.lineWidth = 1;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];
            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                if (hasBond(a, b)) continue;

                var dSq = distSq(a, b);
                if (dSq < limitSq) {
                    var alpha = (1 - dSq / limitSq) * CONFIG.game.previewAlpha;
                    ctx.strokeStyle = "rgba(99, 166, 255, " + alpha.toFixed(4) + ")";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    function drawGameBonds() {
        ctx.save();
        ctx.lineWidth = 1.8;

        for (var i = 0; i < state.bonds.length; i += 1) {
            var bond = state.bonds[i];
            var a = getNodeById(bond.a);
            var b = getNodeById(bond.b);
            if (!a || !b) continue;

            var glow = Math.max(0, 1 - bond.age * 2.2);
            var alpha = CONFIG.game.bondAlpha + glow * 0.22;

            if (bond.source === "core") {
                ctx.strokeStyle = "rgba(143, 214, 255, " + alpha.toFixed(4) + ")";
                ctx.shadowColor = "rgba(143, 214, 255, 0.38)";
            } else if (bond.source === "molecule") {
                ctx.strokeStyle = "rgba(255, 209, 102, " + alpha.toFixed(4) + ")";
                ctx.shadowColor = "rgba(255, 209, 102, 0.34)";
            } else {
                ctx.strokeStyle = "rgba(126, 242, 176, " + alpha.toFixed(4) + ")";
                ctx.shadowColor = "rgba(126, 242, 176, 0.32)";
            }

            ctx.shadowBlur = 8 + glow * 14;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        ctx.restore();

        state.linkCount = state.bonds.length;
        if (dom.metricLinks) dom.metricLinks.textContent = pad3(state.linkCount);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(state.linkCount);
    }

    function drawNodes(time) {
        ctx.save();

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            var atomColor = n.displayColor || (n.atom && n.atom.color) || "99, 166, 255";
            var pulse = 0.75 + Math.sin(time * 0.002 + (n.pulse || n.phase || 0)) * 0.25;
            var size = n.core ? n.radius + pulse * 1.2 : (n.radius || n.size || 2) + pulse * (state.gameMode ? 1.1 : 0.8);
            var alpha = state.gameMode ? (n.connected ? 0.88 : 0.56) : 0.42;

            ctx.beginPath();
            ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + atomColor + ", " + alpha.toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + atomColor + ", 0.45)";
            ctx.shadowBlur = state.gameMode ? 18 : 10;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(n.x, n.y, size + (n.connected ? 6 : 4), 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(" + atomColor + ", " + (state.gameMode ? (n.connected ? 0.28 : 0.13) : 0.08).toFixed(4) + ")";
            ctx.lineWidth = n.core ? 1.6 : 1;
            ctx.stroke();

            if (state.gameMode) {
                ctx.fillStyle = n.connected ? "rgba(215, 227, 244, 0.86)" : "rgba(139, 155, 176, 0.76)";
                ctx.font = n.core ? "11px SFMono-Regular, Consolas, monospace" : "10px SFMono-Regular, Consolas, monospace";
                ctx.textAlign = "center";
                ctx.fillText(n.displayName || n.atom.name, n.x, n.y - size - 8);

                if (n.formula && n.formula !== n.atom.name) {
                    ctx.fillStyle = "rgba(215, 227, 244, 0.45)";
                    ctx.font = "9px SFMono-Regular, Consolas, monospace";
                    ctx.fillText(n.atom.name, n.x, n.y + size + 13);
                }
            }
        }

        ctx.restore();
    }

    function drawPulses(dt) {
        ctx.save();

        for (var i = state.pulses.length - 1; i >= 0; i -= 1) {
            var p = state.pulses[i];
            p.r += (230 + p.power * 0.55) * dt;
            p.life -= 0.72 * dt;

            if (p.life <= 0) {
                state.pulses.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 209, 102, " + (p.life * 0.32).toFixed(4) + ")";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPointerField() {
        if (!state.pointer.active) return;

        var r;
        if (state.gameMode) {
            r = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
        } else {
            r = state.pointer.down ? CONFIG.portfolio.pointerPushRadius : CONFIG.portfolio.pointerRadius;
        }

        ctx.save();
        var gradient = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 0, state.pointer.x, state.pointer.y, r);
        gradient.addColorStop(0, "rgba(99, 166, 255, 0.18)");
        gradient.addColorStop(0.44, "rgba(99, 166, 255, 0.06)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(143, 214, 255, 0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    function updateMetrics() {
        var input = "IDLE";
        if (state.pointer.down) {
            input = "PUSH";
        } else if (state.pointer.active) {
            input = state.pointer.speed > 18 ? "VECTOR" : "TRACK";
        }

        if (dom.metricInput) dom.metricInput.textContent = input;
        if (dom.gameInput) dom.gameInput.textContent = input;
    }

    function updateGameStats() {
        var stage = state.stage || getStage(state.level);
        if (dom.gameLevel) dom.gameLevel.textContent = pad2(state.level);
        if (dom.gameCollected) dom.gameCollected.textContent = pad3(state.connectedCount);
        if (dom.gameTarget) dom.gameTarget.textContent = pad3(state.target);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(state.linkCount);
        if (dom.gameNodes) dom.gameNodes.textContent = pad3(state.gameMode ? state.nodes.length : state.portfolioNodes.length);
        if (dom.gameAtoms) dom.gameAtoms.textContent = stage.label;
        if (dom.gameProgressFill) {
            dom.gameProgressFill.style.width = clamp(state.connectedCount / Math.max(1, state.target) * 100, 0, 100).toFixed(2) + "%";
        }
    }

    function placeMiniDot(element, rect, left, top, width, height, rotationDeg, timeValue) {
        if (!element) return;

        var cx = rect.width * (left + width * 0.5);
        var cy = rect.height * (top + height * 0.5);
        var a = rect.width * width * 0.5;
        var b = rect.height * height * 0.5;
        var rot = rotationDeg * Math.PI / 180;
        var x = Math.cos(timeValue) * a;
        var y = Math.sin(timeValue) * b;
        var c = Math.cos(rot);
        var s = Math.sin(rot);
        var px = cx + x * c - y * s;
        var py = cy + x * s + y * c;

        element.style.transform = "translate(" + px.toFixed(2) + "px, " + py.toFixed(2) + "px) translate(-50%, -50%)";
    }

    function updateMiniOrbitProbe(time) {
        if (!dom.miniOrbitBox) return;

        var rect = dom.miniOrbitBox.getBoundingClientRect();
        placeMiniDot(dom.miniProbe, rect, 0.07, 0.21, 0.86, 0.58, -18, time * 0.00115);
        placeMiniDot(dom.miniCore, rect, 0.13, 0.26, 0.74, 0.48, 22, time * -0.00082 + Math.PI * 0.55);
    }

    function frame(time) {
        if (!state.lastTime) state.lastTime = time;
        var dt = clamp((time - state.lastTime) / 1000, 0.001, 0.033);
        state.lastTime = time;

        updateScroll();
        updateMetrics();
        updateMiniOrbitProbe(time);

        ctx.clearRect(0, 0, state.width, state.height);
        drawGrid(time);
        drawBounds();
        drawOrbitTraces(time);

        if (!reduceMotion) {
            if (state.gameMode) {
                updateGamePhysics(dt, time);
            } else {
                for (var i = 0; i < state.nodes.length; i += 1) {
                    updatePortfolioNode(state.nodes[i], dt, time);
                }
            }
        }

        drawPointerField();
        drawPulses(dt);

        if (state.gameMode) {
            drawGamePreviewLinks();
            drawGameBonds();
        } else {
            drawPortfolioLinks();
        }

        drawNodes(time);
        updateGameStats();

        window.requestAnimationFrame(frame);
    }

    function setupReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
        if (!("IntersectionObserver" in window)) {
            items.forEach(function (item) {
                item.classList.add("visible");
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    window.addEventListener("pointermove", function (event) {
        setPointer(event.clientX, event.clientY, true);
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
        state.pointer.active = false;
    }, { passive: true });

    window.addEventListener("pointerdown", function (event) {
        state.pointer.down = true;
        setPointer(event.clientX, event.clientY, true);
        addPulse(event.clientX, event.clientY, state.gameMode ? CONFIG.game.pulseForce : 180);
    });

    window.addEventListener("pointerup", function (event) {
        state.pointer.down = false;
        setPointer(event.clientX, event.clientY, true);
    }, { passive: true });

    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && state.gameMode) {
            exitGameMode();
        }
    });

    document.addEventListener("fullscreenchange", function () {
        if (!document.fullscreenElement && state.gameMode) {
            exitGameMode();
        }
    });

    if (dom.enterGameButton) {
        dom.enterGameButton.addEventListener("click", enterGameMode);
    }

    if (dom.exitGameButton) {
        dom.exitGameButton.addEventListener("click", exitGameMode);
    }

    resize();
    updateScroll();
    setupReveal();
    window.requestAnimationFrame(frame);
}());
