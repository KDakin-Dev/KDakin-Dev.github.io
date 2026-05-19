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
            baseNodes: 5,
            nodesPerLevel: 3,
            maxNodes: 42,
            baseTarget: 4,
            targetPerLevel: 2,
            linkDistance: 165,
            collectRadius: 12,
            playAreaLeft: 18,
            playAreaRight: 18,
            playAreaTop: 124,
            playAreaBottom: 26,
            chaosStart: 1.25,
            chaosDecayPerLevel: 0.08,
            chaosMin: 0.42,
            orbitPullBase: 0.15,
            orbitPullPerLevel: 0.035,
            orbitPullMax: 0.48,
            speedBase: 70,
            speedPerLevel: 7,
            levelAdvanceDelayMs: 260
        },
        atoms: [
            { name: "H", mass: 1, radius: 2.2, color: "99, 166, 255", unlock: 1 },
            { name: "He", mass: 4, radius: 2.8, color: "126, 242, 176", unlock: 2 },
            { name: "C", mass: 12, radius: 3.4, color: "180, 136, 255", unlock: 3 },
            { name: "O", mass: 16, radius: 3.8, color: "255, 209, 102", unlock: 4 },
            { name: "Si", mass: 28, radius: 4.4, color: "255, 145, 77", unlock: 5 },
            { name: "Fe", mass: 56, radius: 5.2, color: "255, 107, 139", unlock: 6 }
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
        miniOrbitBox: document.querySelector(".mini-orbit")
    };

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = {
        width: 1,
        height: 1,
        dpr: 1,
        lastTime: 0,
        nodes: [],
        pulses: [],
        collectedLinkKeys: Object.create(null),
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
        collectedThisLevel: 0,
        totalCollected: 0,
        target: 6,
        levelAdvancePending: false
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

    function resize() {
        state.dpr = clamp(window.devicePixelRatio || 1, 1, CONFIG.canvasDprMax);
        state.width = Math.max(1, window.innerWidth);
        state.height = Math.max(1, window.innerHeight);
        canvas.width = Math.floor(state.width * state.dpr);
        canvas.height = Math.floor(state.height * state.dpr);
        canvas.style.width = state.width + "px";
        canvas.style.height = state.height + "px";
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        rebuildNodes(true);
    }

    function getGameBounds() {
        return {
            left: CONFIG.game.playAreaLeft,
            right: state.width - CONFIG.game.playAreaRight,
            top: CONFIG.game.playAreaTop,
            bottom: state.height - CONFIG.game.playAreaBottom
        };
    }

    function wantedNodeCount() {
        if (state.gameMode) {
            return clamp(
                CONFIG.game.baseNodes + state.level * CONFIG.game.nodesPerLevel,
                CONFIG.game.baseNodes,
                CONFIG.game.maxNodes
            );
        }
        var area = state.width * state.height;
        return clamp(
            Math.floor(area / CONFIG.portfolio.areaPerNode),
            CONFIG.portfolio.minNodes,
            CONFIG.portfolio.maxNodes
        );
    }

    function availableAtoms() {
        return CONFIG.atoms.filter(function (atom) {
            return atom.unlock <= state.level;
        });
    }

    function pickAtom() {
        var atoms = availableAtoms();
        var levelBias = clamp(state.level - 1, 0, atoms.length - 1);
        var roll = Math.random();
        if (roll < 0.58) return atoms[0];
        if (roll < 0.82) return atoms[Math.min(1, atoms.length - 1)];
        if (roll < 0.94) return atoms[Math.min(levelBias, atoms.length - 1)];
        return atoms[Math.floor(Math.random() * atoms.length)];
    }

    function getOrbitCenter(time) {
        return {
            x: state.width * (0.5 + Math.sin(time * 0.00008) * 0.045),
            y: state.height * (0.48 + Math.cos(time * 0.00007) * 0.035)
        };
    }

    function getOrbitParams(index) {
        var group = index % 5;
        var minDim = Math.min(state.width, state.height);
        var gameScale = state.gameMode ? 0.72 : 1.0;
        return {
            group: group,
            a: minDim * (0.30 + group * 0.075) * (1.54 - group * 0.055) * gameScale,
            b: minDim * (0.115 + group * 0.045) * gameScale,
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

    function createNode(index) {
        var center = getOrbitCenter(0);
        var params = getOrbitParams(index);
        var phase = rand(0, Math.PI * 2);
        var point = orbitPoint(center.x, center.y, params.a, params.b, params.rot, phase);
        var atom = pickAtom();
        var bounds = getGameBounds();
        var margin = 34;
        var minY = state.gameMode ? bounds.top + margin : margin;
        var maxY = state.gameMode ? bounds.bottom - margin : state.height - margin;
        return {
            id: index,
            x: clamp(point.x, margin, state.width - margin),
            y: clamp(point.y, minY, maxY),
            a: params.a,
            b: params.b,
            rot: params.rot,
            speed: params.speed,
            orbitGroup: params.group,
            phase: phase,
            ox: state.gameMode ? rand(-55, 55) : rand(-5, 5),
            oy: state.gameMode ? rand(-55, 55) : rand(-5, 5),
            ovx: state.gameMode ? rand(-28, 28) : 0,
            ovy: state.gameMode ? rand(-28, 28) : 0,
            freeVx: rand(-22, 22),
            freeVy: rand(-22, 22),
            size: atom.radius,
            mass: atom.mass,
            atom: atom,
            hue: rand(0.75, 1.0)
        };
    }

    function rebuildNodes(keepExisting) {
        var count = wantedNodeCount();
        if (!keepExisting) {
            state.nodes = [];
        }
        if (state.nodes.length > count) {
            state.nodes.length = count;
        }
        while (state.nodes.length < count) {
            state.nodes.push(createNode(state.nodes.length));
        }
        dom.metricNodes.textContent = pad3(state.nodes.length);
        dom.gameNodes.textContent = pad3(state.nodes.length);
    }

    function updateScroll() {
        var doc = document.documentElement;
        var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        state.scroll01 = state.gameMode ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
        dom.metricScroll.textContent = state.scroll01.toFixed(2);
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

    function beginLevel(level) {
        state.level = level;
        state.collectedThisLevel = 0;
        state.target = CONFIG.game.baseTarget + level * CONFIG.game.targetPerLevel;
        state.collectedLinkKeys = Object.create(null);
        state.levelAdvancePending = false;
        rebuildNodes(false);
    }

    function enterGameMode() {
        state.gameMode = true;
        document.body.classList.add("game-mode");
        beginLevel(1);
        updateGameStats();
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(function () {});
        }
    }

    function exitGameMode() {
        state.gameMode = false;
        document.body.classList.remove("game-mode");
        state.collectedLinkKeys = Object.create(null);
        state.levelAdvancePending = false;
        rebuildNodes(false);
        updateGameStats();
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(function () {});
        }
    }

    function updateNode(node, dt, time) {
        if (state.gameMode) {
            updateGameNode(node, dt, time);
            return;
        }

        var margin = 26 + node.size;
        var center = getOrbitCenter(time);
        var energy = 1 + state.scroll01 * 1.65;
        var rot = node.rot + Math.sin(time * 0.00006 + node.orbitGroup) * 0.035;
        var t = node.phase + time * 0.001 * node.speed * energy;
        var target = orbitPoint(center.x, center.y, node.a, node.b, rot, t);

        var ax = -node.ox * 1.8;
        var ay = -node.oy * 1.8;

        applyPointerForce(node, target.x, target.y, function (fx, fy) {
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

    function updateGameNode(node, dt, time) {
        var bounds = getGameBounds();
        var margin = 26 + node.size;
        var chaos = clamp(
            CONFIG.game.chaosStart - state.level * CONFIG.game.chaosDecayPerLevel,
            CONFIG.game.chaosMin,
            CONFIG.game.chaosStart
        );
        var center = getOrbitCenter(time);
        var rot = node.rot + Math.sin(time * 0.00004 + node.orbitGroup) * 0.05;
        var t = node.phase + time * 0.001 * node.speed * (0.65 + state.level * 0.09);
        var target = orbitPoint(center.x, center.y, node.a, node.b, rot, t);
        var pull = clamp(
            CONFIG.game.orbitPullBase + state.level * CONFIG.game.orbitPullPerLevel,
            CONFIG.game.orbitPullBase,
            CONFIG.game.orbitPullMax
        );
        var ax = (target.x - node.x) * pull;
        var ay = (target.y - node.y) * pull;

        ax += Math.sin(time * 0.0012 + node.phase) * 32 * chaos;
        ay += Math.cos(time * 0.0010 + node.phase) * 32 * chaos;

        applyPointerForce(node, node.x, node.y, function (fx, fy) {
            ax += fx * 1.45;
            ay += fy * 1.45;
        });

        node.freeVx += ax * dt / Math.sqrt(node.mass);
        node.freeVy += ay * dt / Math.sqrt(node.mass);
        node.freeVx *= Math.pow(0.975, dt * 60);
        node.freeVy *= Math.pow(0.975, dt * 60);

        var maxSpeed = CONFIG.game.speedBase + state.level * CONFIG.game.speedPerLevel;
        var speed = Math.sqrt(node.freeVx * node.freeVx + node.freeVy * node.freeVy);
        if (speed > maxSpeed) {
            node.freeVx = node.freeVx / speed * maxSpeed;
            node.freeVy = node.freeVy / speed * maxSpeed;
        }

        node.x += node.freeVx * dt;
        node.y += node.freeVy * dt;

        if (node.x < bounds.left + margin) {
            node.x = bounds.left + margin;
            node.freeVx = Math.abs(node.freeVx) * 0.92;
        }
        if (node.x > bounds.right - margin) {
            node.x = bounds.right - margin;
            node.freeVx = -Math.abs(node.freeVx) * 0.92;
        }
        if (node.y < bounds.top + margin) {
            node.y = bounds.top + margin;
            node.freeVy = Math.abs(node.freeVy) * 0.92;
        }
        if (node.y > bounds.bottom - margin) {
            node.y = bounds.bottom - margin;
            node.freeVy = -Math.abs(node.freeVy) * 0.92;
        }
    }

    function applyPointerForce(node, baseX, baseY, applyForce) {
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
            ctx.lineTo(x + state.scroll01 * 50, state.height);
        }
        for (y = -grid + offset; y < state.height + grid; y += grid) {
            ctx.moveTo(0, y);
            ctx.lineTo(state.width, y + state.scroll01 * 30);
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
        var count = state.gameMode ? clamp(2 + Math.floor(state.level / 2), 2, 5) : 5;
        ctx.save();
        for (var i = 0; i < count; i += 1) {
            var params = getOrbitParams(i);
            var rot = params.rot + Math.sin(time * 0.00006 + params.group) * 0.035;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, params.a, params.b, rot, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(99, 166, 255, " + (state.gameMode ? 0.09 : 0.13 - i * 0.015) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    function linkKey(a, b) {
        return a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
    }

    function pointSegmentDistance(px, py, ax, ay, bx, by) {
        var vx = bx - ax;
        var vy = by - ay;
        var wx = px - ax;
        var wy = py - ay;
        var lenSq = vx * vx + vy * vy;
        if (lenSq <= 0.001) return Math.sqrt(wx * wx + wy * wy);
        var t = clamp((wx * vx + wy * vy) / lenSq, 0, 1);
        var dx = px - (ax + vx * t);
        var dy = py - (ay + vy * t);
        return Math.sqrt(dx * dx + dy * dy);
    }

    function tryCollectLink(a, b, key) {
        if (!state.gameMode || !state.pointer.active) return false;
        if (state.collectedLinkKeys[key]) return true;
        if (state.levelAdvancePending) return false;

        var d = pointSegmentDistance(state.pointer.x, state.pointer.y, a.x, a.y, b.x, b.y);
        if (d >= CONFIG.game.collectRadius) return false;

        state.collectedLinkKeys[key] = true;
        state.collectedThisLevel += 1;
        state.totalCollected += 1;
        addPulse((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 90);

        if (state.collectedThisLevel >= state.target) {
            state.levelAdvancePending = true;
            window.setTimeout(function () {
                if (state.gameMode) beginLevel(state.level + 1);
            }, CONFIG.game.levelAdvanceDelayMs);
        }

        return true;
    }

    function drawLinks() {
        var limit = state.gameMode ? CONFIG.game.linkDistance : (state.width < 700 ? CONFIG.portfolio.linkDistanceMobile : CONFIG.portfolio.linkDistanceDesktop);
        var limitSq = limit * limit;
        var count = 0;
        ctx.save();
        ctx.lineWidth = state.gameMode ? 1.4 : 1;
        for (var i = 0; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];
            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var dSq = dx * dx + dy * dy;
                if (dSq < limitSq) {
                    var key = linkKey(a, b);
                    var collected = tryCollectLink(a, b, key);
                    var alpha = (1 - dSq / limitSq) * (state.gameMode ? 0.44 : 0.22);
                    if (collected) {
                        ctx.strokeStyle = "rgba(126, 242, 176, " + clamp(alpha + 0.28, 0.34, 0.82).toFixed(4) + ")";
                        ctx.shadowColor = "rgba(126, 242, 176, 0.35)";
                        ctx.shadowBlur = 9;
                    } else {
                        ctx.strokeStyle = "rgba(99, 166, 255, " + alpha.toFixed(4) + ")";
                        ctx.shadowBlur = 0;
                    }
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
        dom.metricLinks.textContent = pad3(count);
        dom.gameLinks.textContent = pad3(count);
    }

    function drawNodes(time) {
        ctx.save();
        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            var pulse = 0.75 + Math.sin(time * 0.002 + n.phase) * 0.25;
            var atomColor = n.atom.color;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.size + pulse * (state.gameMode ? 1.2 : 0.8), 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + atomColor + ", " + (state.gameMode ? 0.72 : 0.42).toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + atomColor + ", 0.45)";
            ctx.shadowBlur = state.gameMode ? 18 : 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(n.x, n.y, (n.size + 5) * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(" + atomColor + ", " + (state.gameMode ? 0.18 : 0.08).toFixed(4) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
            if (state.gameMode && n.size >= 3.3) {
                ctx.fillStyle = "rgba(215, 227, 244, 0.72)";
                ctx.font = "10px SFMono-Regular, Consolas, monospace";
                ctx.textAlign = "center";
                ctx.fillText(n.atom.name, n.x, n.y - n.size - 8);
            }
        }
        ctx.restore();
    }

    function drawPulses(dt) {
        ctx.save();
        for (var i = state.pulses.length - 1; i >= 0; i -= 1) {
            var p = state.pulses[i];
            p.r += (260 + p.power * 0.7) * dt;
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
        ctx.save();
        var r = state.pointer.down ? CONFIG.portfolio.pointerPushRadius : CONFIG.portfolio.pointerRadius;
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
        dom.metricInput.textContent = input;
        dom.gameInput.textContent = input;
    }

    function updateGameStats() {
        dom.gameLevel.textContent = pad2(state.level);
        dom.gameCollected.textContent = pad3(state.collectedThisLevel);
        dom.gameTarget.textContent = pad3(state.target);
        dom.gameLinks.textContent = pad3(state.linkCount);
        dom.gameNodes.textContent = pad3(state.nodes.length);
        dom.gameAtoms.textContent = availableAtoms().map(function (atom) { return atom.name; }).join("+");
        dom.gameProgressFill.style.width = clamp(state.collectedThisLevel / Math.max(1, state.target) * 100, 0, 100).toFixed(2) + "%";
    }

    function updateMiniOrbitProbe(time) {
        if (!dom.miniProbe || !dom.miniOrbitBox) return;
        var rect = dom.miniOrbitBox.getBoundingClientRect();
        var cx = rect.width * 0.5;
        var cy = rect.height * 0.5;
        var a = rect.width * 0.43;
        var b = rect.height * 0.29;
        var rot = -18 * Math.PI / 180;
        var t = time * 0.00115;
        var x = Math.cos(t) * a;
        var y = Math.sin(t) * b;
        var c = Math.cos(rot);
        var s = Math.sin(rot);
        var px = cx + x * c - y * s;
        var py = cy + x * s + y * c;
        dom.miniProbe.style.transform = "translate(" + px.toFixed(2) + "px, " + py.toFixed(2) + "px) translate(-50%, -50%)";
    }

    function frame(time) {
        if (!state.lastTime) state.lastTime = time;
        var dt = clamp((time - state.lastTime) / 1000, 0.001, 0.033);
        state.lastTime = time;

        updateScroll();
        updateMetrics();
        updateMiniOrbitProbe(time);
        updateGameStats();

        ctx.clearRect(0, 0, state.width, state.height);
        drawGrid(time);
        drawBounds();
        drawOrbitTraces(time);

        if (!reduceMotion) {
            for (var i = 0; i < state.nodes.length; i += 1) {
                updateNode(state.nodes[i], dt, time);
            }
        }

        drawPointerField();
        drawPulses(dt);
        drawLinks();
        drawNodes(time);

        window.requestAnimationFrame(frame);
    }

    function setupReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
        if (!("IntersectionObserver" in window)) {
            items.forEach(function (item) { item.classList.add("visible"); });
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
        items.forEach(function (item) { observer.observe(item); });
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
        addPulse(event.clientX, event.clientY, state.gameMode ? 220 : 180);
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
