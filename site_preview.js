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
        var lastSpawnAt = 0;
        var lastTime = 0;
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
            for (var i = 0; i < currentPalette.colors.length; i += 1) {
                currentPalette.colors[i] = mixRgb(currentPalette.colors[i], targetPalette.colors[i], 0.075);
            }
            currentPalette.glow = mixRgb(currentPalette.glow, targetPalette.glow, 0.075);
            pulse = lerp(pulse, 0, 0.05);

            var scale = 1 + pulse * 0.022;
            preview.style.setProperty('--star-scale', scale.toFixed(4));
            preview.style.setProperty('--star-glow', pulse.toFixed(4));
            preview.style.setProperty('--star-glow-rgb', rgbTriplet(currentPalette.glow));
            for (var c = 0; c < currentPalette.colors.length; c += 1) {
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

        function frame(time) {
            if (!lastTime) {
                lastTime = time;
                lastSpawnAt = time;
            }
            var dt = clamp((time - lastTime) / 1000, 0, 0.05);
            lastTime = time;

            if (time - lastSpawnAt >= spawnIntervalMs && particles.length < maxParticles) {
                spawnParticle();
                lastSpawnAt = time;
            }

            for (var i = particles.length - 1; i >= 0; i -= 1) {
                var particle = particles[i];
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.node.style.left = particle.x.toFixed(2) + 'px';
                particle.node.style.top = particle.y.toFixed(2) + 'px';

                var dx = particle.impactX - particle.x;
                var dy = particle.impactY - particle.y;
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStarPreview);
    } else {
        initStarPreview();
    }
})();
