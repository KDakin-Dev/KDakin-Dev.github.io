(function () {
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function choose(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function hexToRgb(hex) {
        var raw = hex.replace('#', '');
        return [
            parseInt(raw.slice(0, 2), 16),
            parseInt(raw.slice(2, 4), 16),
            parseInt(raw.slice(4, 6), 16)
        ];
    }

    function mixRgb(a, b, t) {
        return [
            lerp(a[0], b[0], t),
            lerp(a[1], b[1], t),
            lerp(a[2], b[2], t)
        ];
    }

    function rgbText(rgb) {
        return 'rgb(' + Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]) + ')';
    }

    function rgbTriplet(rgb) {
        return Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]);
    }

    function makePalette(c0, c1, c2, c3, c4, glow, particle) {
        return {
            colors: [hexToRgb(c0), hexToRgb(c1), hexToRgb(c2), hexToRgb(c3), hexToRgb(c4)],
            glow: hexToRgb(glow),
            particle: particle
        };
    }

    function initStarPreview() {
        var preview = document.querySelector('[data-star-preview]');
        if (!preview) {
            return;
        }

        var layer = preview.querySelector('.site-star-particle-layer');
        var core = preview.querySelector('.site-star-core');
        if (!layer || !core) {
            return;
        }

        var palettes = [
            makePalette('#f7fdff', '#d8efff', '#73b8ff', '#2e70c8', '#173f87', '#73b8ff', '#73b8ff'),
            makePalette('#fffef1', '#fff2ad', '#ffbe58', '#ff7638', '#dc4122', '#ffbe58', '#ffd166'),
            makePalette('#fff1d7', '#ffc07a', '#ff7842', '#c63a22', '#68160f', '#ff7842', '#ff8d5f'),
            makePalette('#fff7eb', '#ffb06f', '#e65a32', '#9b2518', '#42100c', '#bf4326', '#bf4326')
        ];

        var particles = [];
        var maxParticles = 3;
        var spawnIntervalMs = 1560;
        var targetFps = 24;
        var lastSpawnAt = 0;
        var lastTime = 0;
        var lastDrawTime = 0;
        var previewVisible = true;
        var pulse = 0;
        var currentPalette = {
            colors: palettes[1].colors.map(function (c) { return c.slice(); }),
            glow: palettes[1].glow.slice()
        };
        var targetPalette = palettes[1];

        function getMetrics() {
            var rect = preview.getBoundingClientRect();
            var radius = core.offsetWidth * 0.5;
            var centerX = rect.width * 0.5;
            var centerY = rect.height * 0.5;
            return { width: rect.width, height: rect.height, centerX: centerX, centerY: centerY, radius: radius };
        }

        function spawnParticle() {
            var m = getMetrics();
            var side = Math.floor(Math.random() * 4);
            var x = 0;
            var y = 0;
            if (side === 0) {
                x = randomBetween(0.12, 0.88) * m.width;
                y = -14;
            } else if (side === 1) {
                x = m.width + 14;
                y = randomBetween(0.16, 0.84) * m.height;
            } else if (side === 2) {
                x = randomBetween(0.12, 0.88) * m.width;
                y = m.height + 14;
            } else {
                x = -14;
                y = randomBetween(0.16, 0.84) * m.height;
            }

            var dx = m.centerX - x;
            var dy = m.centerY - y;
            var distance = Math.hypot(dx, dy) || 1;
            var nx = dx / distance;
            var ny = dy / distance;
            var impactX = m.centerX - nx * (m.radius * 0.92);
            var impactY = m.centerY - ny * (m.radius * 0.92);
            var toImpactX = impactX - x;
            var toImpactY = impactY - y;
            var travelDistance = Math.hypot(toImpactX, toImpactY) || 1;
            var speed = randomBetween(23, 42);
            var palette = choose(palettes);
            var size = randomBetween(5, 8);

            var node = document.createElement('span');
            node.className = 'site-preview-particle';
            node.style.setProperty('--particle-color', palette.particle);
            node.style.width = size.toFixed(2) + 'px';
            node.style.height = size.toFixed(2) + 'px';
            node.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px) translate(-50%, -50%)';
            layer.appendChild(node);

            particles.push({
                node: node,
                x: x,
                y: y,
                vx: toImpactX / travelDistance * speed,
                vy: toImpactY / travelDistance * speed,
                impactX: impactX,
                impactY: impactY,
                palette: palette,
                size: size
            });
        }

        function impactParticle(particle) {
            targetPalette = particle.palette;
            pulse = Math.min(1, pulse + 0.34);
            if (particle.node.parentNode) {
                particle.node.parentNode.removeChild(particle.node);
            }
        }

        function updateVisuals() {
            var i;
            var c;
            for (i = 0; i < currentPalette.colors.length; i += 1) {
                currentPalette.colors[i] = mixRgb(currentPalette.colors[i], targetPalette.colors[i], 0.075);
            }
            currentPalette.glow = mixRgb(currentPalette.glow, targetPalette.glow, 0.075);
            pulse = lerp(pulse, 0, 0.05);

            var scale = 1 + pulse * 0.022;
            preview.style.setProperty('--star-scale', scale.toFixed(4));
            preview.style.setProperty('--star-glow', pulse.toFixed(4));
            preview.style.setProperty('--star-glow-rgb', rgbTriplet(currentPalette.glow));
            for (c = 0; c < currentPalette.colors.length; c += 1) {
                preview.style.setProperty('--star-c' + c, rgbText(currentPalette.colors[c]));
            }

            var glowA = 30 + pulse * 10;
            var glowB = 66 + pulse * 18;
            var alphaA = 0.28 + pulse * 0.08;
            var alphaB = 0.12 + pulse * 0.05;
            core.style.boxShadow =
                '0 0 ' + glowA.toFixed(1) + 'px rgba(' + rgbTriplet(currentPalette.glow) + ', ' + alphaA.toFixed(3) + '), ' +
                '0 0 ' + glowB.toFixed(1) + 'px rgba(' + rgbTriplet(currentPalette.glow) + ', ' + alphaB.toFixed(3) + ')';
        }

        function isPreviewActive() {
            return previewVisible && !document.hidden && !document.body.classList.contains('game-mode');
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                previewVisible = entries.some(function (entry) {
                    return entry.isIntersecting;
                });
            }, { threshold: 0.05 });
            observer.observe(preview);
        }

        function frame(time) {
            var minFrameMs;
            var dt;
            var i;
            if (!lastTime) {
                lastTime = time;
                lastSpawnAt = time;
                lastDrawTime = time;
            }

            if (!isPreviewActive()) {
                lastTime = time;
                window.setTimeout(function () {
                    window.requestAnimationFrame(frame);
                }, 360);
                return;
            }

            minFrameMs = 1000 / targetFps;
            if (time - lastDrawTime < minFrameMs) {
                window.requestAnimationFrame(frame);
                return;
            }
            lastDrawTime = time;

            dt = clamp((time - lastTime) / 1000, 0, 0.05);
            lastTime = time;

            if (time - lastSpawnAt >= spawnIntervalMs && particles.length < maxParticles) {
                spawnParticle();
                lastSpawnAt = time;
            }

            for (i = particles.length - 1; i >= 0; i -= 1) {
                var particle = particles[i];
                var dx;
                var dy;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.node.style.transform = 'translate(' + particle.x.toFixed(2) + 'px, ' + particle.y.toFixed(2) + 'px) translate(-50%, -50%)';

                dx = particle.impactX - particle.x;
                dy = particle.impactY - particle.y;
                if (Math.hypot(dx, dy) <= Math.max(2.2, particle.size * 0.60)) {
                    impactParticle(particle);
                    particles.splice(i, 1);
                }
            }

            updateVisuals();
            window.requestAnimationFrame(frame);
        }

        window.requestAnimationFrame(frame);
    }

    function initSailPreview() {
        var preview = document.querySelector('[data-sail-preview]');
        var canvas;
        var ctx;
        var dpr = 1;
        var width = 0;
        var height = 0;
        var previewVisible = true;
        var lastTime = 0;
        var lastDrawTime = 0;
        var targetFps = 30;
        var waterDots = [];
        var i;
        var hullVertices = [
            [-15, 14, -34], [15, 14, -34], [-16, 14, 8], [16, 14, 8], [0, 14, 44],
            [-13, 5, -34], [13, 5, -34], [-15, 4, 8], [15, 4, 8], [0, 5, 40],
            [0, -2, -28], [0, -3, 8], [0, 1, 37]
        ];
        var hullTriangles = [
            [0, 2, 3], [0, 3, 1], [2, 4, 3], [0, 5, 7], [0, 7, 2], [2, 7, 9], [2, 9, 4],
            [1, 3, 8], [1, 8, 6], [3, 4, 9], [3, 9, 8], [0, 1, 6], [0, 6, 5], [5, 10, 11],
            [5, 11, 7], [7, 11, 12], [7, 12, 9], [6, 8, 11], [6, 11, 10], [8, 9, 12],
            [8, 12, 11], [4, 12, 9], [4, 3, 12], [4, 12, 2]
        ];
        var islands = [
            { x: 0.74, y: 0.23, rx: 0.12, ry: 0.07, angle: -0.28, dark: 1.0 },
            { x: 0.18, y: 0.70, rx: 0.09, ry: 0.055, angle: -0.24, dark: 0.82 }
        ];
        var ships = {
            player: {
                x: 0.34,
                y: 0.58,
                heading: -0.58,
                scale: 1.06,
                hullLight: '#d6ebff',
                hullMid: '#91b7d8',
                hullDark: '#44637f',
                deck: '#d0b08b',
                sail: '#76a9ff',
                mast: '#6f5740',
                stroke: 'rgba(206, 232, 255, 0.50)'
            },
            enemy: {
                x: 0.73,
                y: 0.34,
                heading: 2.34,
                scale: 0.94,
                hullLight: '#86424d',
                hullMid: '#59242f',
                hullDark: '#311018',
                deck: '#8f6c4c',
                sail: '#d1c4b2',
                mast: '#5c4332',
                stroke: 'rgba(255, 204, 188, 0.32)'
            }
        };

        if (!preview) {
            return;
        }
        canvas = preview.querySelector('[data-sail-preview-canvas]');
        if (!canvas) {
            return;
        }
        ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        for (i = 0; i < 36; i += 1) {
            waterDots.push({
                x: randomBetween(0.02, 0.98),
                y: randomBetween(0.10, 0.94),
                r: randomBetween(0.6, 1.8),
                a: randomBetween(0.08, 0.24)
            });
        }

        function resize() {
            var rect = preview.getBoundingClientRect();
            dpr = window.devicePixelRatio || 1;
            width = Math.max(1, Math.round(rect.width));
            height = Math.max(1, Math.round(rect.height));
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function isPreviewActive() {
            return previewVisible && !document.hidden && !document.body.classList.contains('game-mode');
        }

        function toScreen(point, ship) {
            var heading = ship.heading;
            var cos = Math.cos(heading);
            var sin = Math.sin(heading);
            var x = point[0] * ship.scale;
            var y = point[1] * ship.scale;
            var z = point[2] * ship.scale;
            var rx = x * cos - z * sin;
            var rz = x * sin + z * cos;
            var isoX = (rx - rz) * (width * 0.0068);
            var isoY = (rx + rz) * (height * 0.0031) - y * (height * 0.0072);
            return {
                x: ship.screenX + isoX,
                y: ship.screenY + isoY,
                depth: rz + rx + y * 0.2
            };
        }

        function drawPolygon(points, fill, stroke, alpha) {
            var p0;
            var j;
            if (!points.length) {
                return;
            }
            p0 = points[0];
            ctx.save();
            ctx.globalAlpha = alpha == null ? 1 : alpha;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            for (j = 1; j < points.length; j += 1) {
                ctx.lineTo(points[j].x, points[j].y);
            }
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            if (stroke) {
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        }

        function drawShadow(ship) {
            ctx.save();
            ctx.translate(ship.screenX, ship.screenY + ship.floatY + height * 0.07);
            ctx.rotate(-0.32);
            ctx.scale(1.05, 0.46);
            var gradient = ctx.createRadialGradient(0, 0, 6, 0, 0, width * 0.12 * ship.scale);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.00)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, width * 0.12 * ship.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawWake(ship, time) {
            var i;
            var sx = ship.screenX - Math.cos(ship.heading + Math.PI * 0.5) * width * 0.035;
            var sy = ship.screenY + height * 0.055;
            for (i = 0; i < 2; i += 1) {
                var side = i === 0 ? -1 : 1;
                ctx.save();
                ctx.translate(sx + side * width * 0.014, sy + ship.floatY * 0.35);
                ctx.rotate(-0.22 + side * 0.08 + Math.sin(time * 1.3 + i) * 0.02);
                ctx.globalAlpha = 0.34;
                ctx.strokeStyle = 'rgba(218, 241, 255, 0.72)';
                ctx.lineWidth = 3.2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-18 * side, 8, -34 * side, 20, -56 * side, 34);
                ctx.stroke();
                ctx.globalAlpha = 0.18;
                ctx.lineWidth = 7.0;
                ctx.stroke();
                ctx.restore();
            }
        }

        function drawWindRibbon(x0, y0, length, angle, alpha, timeShift) {
            var i;
            ctx.save();
            ctx.translate(x0 * width, y0 * height);
            ctx.rotate(angle);
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            for (i = 0; i < 3; i += 1) {
                var offset = i * 12;
                var start = (Math.sin(lastTime * 0.0012 + timeShift + i * 0.7) * 0.5 + 0.5) * 16;
                var grad = ctx.createLinearGradient(-length * 0.45, 0, length * 0.55, 0);
                grad.addColorStop(0.00, 'rgba(99, 166, 255, 0.00)');
                grad.addColorStop(0.26, 'rgba(163, 208, 255, ' + (alpha * 0.24).toFixed(3) + ')');
                grad.addColorStop(0.56, 'rgba(214, 238, 255, ' + (alpha * 0.72).toFixed(3) + ')');
                grad.addColorStop(1.00, 'rgba(214, 238, 255, 0.00)');
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo(-length * 0.5 + start, offset);
                ctx.bezierCurveTo(-length * 0.18, offset - 4, length * 0.08, offset + 6, length * 0.5, offset + 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        function drawIsland(island, time) {
            var x = island.x * width;
            var y = island.y * height;
            var rx = island.rx * width;
            var ry = island.ry * height;
            var tilt = island.angle;
            var glow = 0.90 + Math.sin(time * 0.7 + island.x * 3.0) * 0.04;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(tilt);
            ctx.scale(1, 0.55);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
            ctx.beginPath();
            ctx.ellipse(0, 18, rx * 0.95, ry * 0.92, 0, 0, Math.PI * 2);
            ctx.fill();
            var sand = ctx.createRadialGradient(-rx * 0.18, -ry * 0.26, rx * 0.08, 0, 0, rx);
            sand.addColorStop(0, 'rgba(209, 182, 115, ' + (0.96 * island.dark).toFixed(3) + ')');
            sand.addColorStop(1, 'rgba(143, 108, 59, ' + (0.98 * island.dark).toFixed(3) + ')');
            ctx.fillStyle = sand;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(60, 114, 69, 0.96)';
            ctx.beginPath();
            ctx.ellipse(-rx * 0.18, -ry * 0.20, rx * 0.26 * glow, ry * 0.24 * glow, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rx * 0.22, ry * 0.10, rx * 0.20, ry * 0.18, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function makeDeckPolys(shipStyle, time) {
            var ship = shipStyle;
            var faces = [];
            var projected = hullVertices.map(function (point) {
                return toScreen(point, ship);
            });
            var deckBox = [
                [-10.5, 18, -23], [10.5, 18, -23], [10.5, 18, 11], [-10.5, 18, 11],
                [-10.5, 22, -23], [10.5, 22, -23], [10.5, 22, 11], [-10.5, 22, 11]
            ].map(function (point) {
                return toScreen(point, ship);
            });
            var sternBox = [
                [-12, 9, -41], [12, 9, -41], [12, 9, -29], [-12, 9, -29],
                [-12, 17, -41], [12, 17, -41], [12, 17, -29], [-12, 17, -29]
            ].map(function (point) {
                return toScreen(point, ship);
            });
            var sailAngle = Math.sin(time * 2.1 + ship.x * 5.0) * 0.12;
            var sailShape = [
                [-15, -10, 0], [15, -10, 0], [15, 26, 0], [-15, 26, 0]
            ].map(function (point) {
                var x = point[0];
                var y = point[1];
                var z = point[2];
                var cx = Math.cos(sailAngle);
                var sx = Math.sin(sailAngle);
                var rx = x * cx - z * sx;
                var rz = x * sx + z * cx;
                return toScreen([rx, y + 43, rz + 1], ship);
            });
            var boom = [
                [-16.5, 38.5, 0], [16.5, 38.5, 0], [16.5, 40.7, 0], [-16.5, 40.7, 0]
            ].map(function (point) {
                return toScreen(point, ship);
            });
            var mastBottom = toScreen([0, 13, 0], ship);
            var mastTop = toScreen([0, 71, 0], ship);
            var cannonL = [
                [-24, 17, 0], [-6, 17, 0], [-6, 21, 0], [-24, 21, 0]
            ].map(function (point) { return toScreen(point, ship); });
            var cannonR = [
                [6, 17, 0], [24, 17, 0], [24, 21, 0], [6, 21, 0]
            ].map(function (point) { return toScreen(point, ship); });
            var t;
            for (t = 0; t < hullTriangles.length; t += 1) {
                var tri = hullTriangles[t];
                var triPoints = [projected[tri[0]], projected[tri[1]], projected[tri[2]]];
                var shade = triPoints[0].depth + triPoints[1].depth + triPoints[2].depth;
                var fill = ship.hullMid;
                if (shade < -16) {
                    fill = ship.hullLight;
                } else if (shade > 28) {
                    fill = ship.hullDark;
                }
                faces.push({ depth: shade / 3, points: triPoints, fill: fill, stroke: ship.stroke, alpha: 0.98 });
            }
            faces.push({ depth: (deckBox[4].depth + deckBox[5].depth + deckBox[6].depth + deckBox[7].depth) / 4, points: [deckBox[4], deckBox[5], deckBox[6], deckBox[7]], fill: ship.deck, stroke: 'rgba(255,255,255,0.16)', alpha: 0.96 });
            faces.push({ depth: (deckBox[0].depth + deckBox[1].depth + deckBox[5].depth + deckBox[4].depth) / 4, points: [deckBox[0], deckBox[1], deckBox[5], deckBox[4]], fill: ship.hullMid, stroke: null, alpha: 0.92 });
            faces.push({ depth: (deckBox[1].depth + deckBox[2].depth + deckBox[6].depth + deckBox[5].depth) / 4, points: [deckBox[1], deckBox[2], deckBox[6], deckBox[5]], fill: ship.hullDark, stroke: null, alpha: 0.92 });
            faces.push({ depth: (sternBox[4].depth + sternBox[5].depth + sternBox[6].depth + sternBox[7].depth) / 4, points: [sternBox[4], sternBox[5], sternBox[6], sternBox[7]], fill: ship.hullMid, stroke: null, alpha: 0.94 });
            faces.push({ depth: (sternBox[1].depth + sternBox[2].depth + sternBox[6].depth + sternBox[5].depth) / 4, points: [sternBox[1], sternBox[2], sternBox[6], sternBox[5]], fill: ship.hullDark, stroke: null, alpha: 0.94 });
            faces.push({ depth: (boom[0].depth + boom[1].depth + boom[2].depth + boom[3].depth) / 4, points: boom, fill: ship.mast, stroke: null, alpha: 1.0 });
            faces.push({ depth: (sailShape[0].depth + sailShape[1].depth + sailShape[2].depth + sailShape[3].depth) / 4, points: sailShape, fill: ship.sail, stroke: 'rgba(255,255,255,0.18)', alpha: 0.92 });
            faces.push({ depth: (cannonL[0].depth + cannonL[1].depth + cannonL[2].depth + cannonL[3].depth) / 4, points: cannonL, fill: '#2c2b2c', stroke: null, alpha: 0.9 });
            faces.push({ depth: (cannonR[0].depth + cannonR[1].depth + cannonR[2].depth + cannonR[3].depth) / 4, points: cannonR, fill: '#2c2b2c', stroke: null, alpha: 0.9 });
            faces.push({
                depth: mastTop.depth,
                draw: function () {
                    ctx.save();
                    ctx.strokeStyle = ship.mast;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(mastBottom.x, mastBottom.y);
                    ctx.lineTo(mastTop.x, mastTop.y);
                    ctx.stroke();
                    ctx.restore();
                }
            });
            return faces;
        }

        function drawShip(ship, time) {
            var faces;
            var k;
            drawShadow(ship);
            faces = makeDeckPolys(ship, time);
            faces.sort(function (a, b) {
                return a.depth - b.depth;
            });
            for (k = 0; k < faces.length; k += 1) {
                if (faces[k].draw) {
                    faces[k].draw();
                } else {
                    drawPolygon(faces[k].points, faces[k].fill, faces[k].stroke, faces[k].alpha);
                }
            }
        }

        function drawShots(time) {
            var ax = ships.player.screenX + width * 0.03;
            var ay = ships.player.screenY - height * 0.005;
            var bx = ships.enemy.screenX - width * 0.025;
            var by = ships.enemy.screenY + height * 0.012;
            var s1 = (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.34 + 0.22;
            var s2 = (Math.sin(time * 1.2 + 0.7) * 0.5 + 0.5) * 0.34 + 0.08;
            drawShot(ax, ay, bx, by, s1, 1.0);
            drawShot(ax, ay, bx, by, s2, 0.72);
        }

        function drawShot(ax, ay, bx, by, progress, alpha) {
            var x = lerp(ax, bx, progress);
            var y = lerp(ay, by, progress) - Math.sin(progress * Math.PI) * height * 0.045;
            var tailX = lerp(ax, bx, Math.max(0, progress - 0.10));
            var tailY = lerp(ay, by, Math.max(0, progress - 0.10)) - Math.sin(Math.max(0, progress - 0.10) * Math.PI) * height * 0.045;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 238, 190, ' + (0.36 * alpha).toFixed(3) + ')';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 238, 190, ' + (0.98 * alpha).toFixed(3) + ')';
            ctx.shadowColor = 'rgba(255, 238, 190, ' + (0.70 * alpha).toFixed(3) + ')';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawWater(time) {
            var gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#1f4f75');
            gradient.addColorStop(1, '#071823');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width * 0.50, height * 0.64);
            ctx.rotate(-0.34);
            ctx.scale(1.0, 0.48);
            var g = ctx.createLinearGradient(-width * 0.5, 0, width * 0.5, 0);
            g.addColorStop(0.00, 'rgba(190, 225, 255, 0.05)');
            g.addColorStop(0.50, 'rgba(190, 225, 255, 0.12)');
            g.addColorStop(1.00, 'rgba(190, 225, 255, 0.04)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.0;
            var i;
            for (i = -7; i <= 7; i += 1) {
                ctx.beginPath();
                ctx.moveTo(-width * 0.62, i * 28);
                ctx.lineTo(width * 0.62, i * 28);
                ctx.stroke();
            }
            for (i = -7; i <= 7; i += 1) {
                ctx.beginPath();
                ctx.moveTo(i * 38, -height * 0.54);
                ctx.lineTo(i * 38, height * 0.54);
                ctx.stroke();
            }
            ctx.restore();

            ctx.fillStyle = 'rgba(196, 232, 255, 0.18)';
            for (i = 0; i < waterDots.length; i += 1) {
                var dot = waterDots[i];
                var twinkle = dot.a + Math.sin(time * 0.8 + dot.x * 9.0 + dot.y * 5.0) * 0.04;
                ctx.globalAlpha = clamp(twinkle, 0.04, 0.24);
                ctx.beginPath();
                ctx.arc(dot.x * width, dot.y * height, dot.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        function frame(time) {
            var minFrameMs;
            if (!lastTime) {
                lastTime = time;
                lastDrawTime = time;
            }
            if (!isPreviewActive()) {
                lastTime = time;
                window.setTimeout(function () {
                    window.requestAnimationFrame(frame);
                }, 360);
                return;
            }
            minFrameMs = 1000 / targetFps;
            if (time - lastDrawTime < minFrameMs) {
                window.requestAnimationFrame(frame);
                return;
            }
            lastDrawTime = time;
            lastTime = time;

            ships.player.screenX = width * ships.player.x + Math.sin(time * 0.0011) * width * 0.010;
            ships.player.screenY = height * ships.player.y + Math.sin(time * 0.0017) * height * 0.010;
            ships.player.floatY = Math.sin(time * 0.0017) * height * 0.008;
            ships.enemy.screenX = width * ships.enemy.x + Math.sin(time * 0.0013 + 1.2) * width * 0.008;
            ships.enemy.screenY = height * ships.enemy.y + Math.sin(time * 0.0019 + 0.7) * height * 0.008;
            ships.enemy.floatY = Math.sin(time * 0.0019 + 0.7) * height * 0.007;

            drawWater(time * 0.001);
            for (i = 0; i < islands.length; i += 1) {
                drawIsland(islands[i], time * 0.001);
            }
            drawWindRibbon(0.78, 0.66, width * 0.18, -0.44, 0.9, 0.0);
            drawWindRibbon(0.69, 0.76, width * 0.14, -0.44, 0.56, 0.9);
            drawWake(ships.player, time * 0.001);
            drawWake(ships.enemy, time * 0.001 + 1.5);
            drawShip(ships.enemy, time * 0.001);
            drawShip(ships.player, time * 0.001);
            drawShots(time * 0.001);
            window.requestAnimationFrame(frame);
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                previewVisible = entries.some(function (entry) {
                    return entry.isIntersecting;
                });
            }, { threshold: 0.05 });
            observer.observe(preview);
        }

        window.addEventListener('resize', resize);
        resize();
        window.requestAnimationFrame(frame);
    }

    function initAllPreviews() {
        initStarPreview();
        initSailPreview();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllPreviews);
    } else {
        initAllPreviews();
    }
})();
