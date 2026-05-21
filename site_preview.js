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

    function initStarPreview() {
        const preview = document.querySelector('[data-star-preview]');
        if (!preview) {
            return;
        }

        const layer = preview.querySelector('.site-star-particle-layer');
        const core = preview.querySelector('.site-star-core');
        if (!layer || !core) {
            return;
        }

        const colors = [
            { value: '#73b8ff', hue: -150, saturation: 1.26, brightness: 1.05 },
            { value: '#cfe9ff', hue: -118, saturation: 1.18, brightness: 1.08 },
            { value: '#ffd166', hue: -8, saturation: 1.08, brightness: 1.00 },
            { value: '#ff8d5f', hue: 18, saturation: 1.16, brightness: 0.92 },
            { value: '#bf4326', hue: 34, saturation: 1.20, brightness: 0.82 }
        ];

        const particles = [];
        const maxParticles = 3;
        const spawnIntervalMs = 1560;
        let lastSpawnAt = 0;
        let lastTime = 0;
        let pulse = 0;
        let starHue = 0;
        let starSaturation = 1.06;
        let starBrightness = 1.00;
        let targetHue = 0;
        let targetSaturation = 1.06;
        let targetBrightness = 1.00;

        function getMetrics() {
            const rect = preview.getBoundingClientRect();
            const radius = core.offsetWidth * 0.5;
            const centerX = rect.width * 0.5;
            const centerY = rect.height * 0.5;
            return { width: rect.width, height: rect.height, centerX: centerX, centerY: centerY, radius: radius };
        }

        function spawnParticle() {
            const m = getMetrics();
            const side = Math.floor(Math.random() * 4);
            let x = 0;
            let y = 0;
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

            const dx = m.centerX - x;
            const dy = m.centerY - y;
            const distance = Math.hypot(dx, dy) || 1;
            const nx = dx / distance;
            const ny = dy / distance;
            const impactX = m.centerX - nx * (m.radius * 0.92);
            const impactY = m.centerY - ny * (m.radius * 0.92);
            const toImpactX = impactX - x;
            const toImpactY = impactY - y;
            const travelDistance = Math.hypot(toImpactX, toImpactY) || 1;
            const speed = randomBetween(23, 42);
            const color = choose(colors);
            const size = randomBetween(5, 8);

            const node = document.createElement('span');
            node.className = 'site-preview-particle';
            node.style.setProperty('--particle-color', color.value);
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
                hue: color.hue,
                saturation: color.saturation,
                brightness: color.brightness,
                size: size
            });
        }

        function impactParticle(particle) {
            targetHue = particle.hue;
            targetSaturation = particle.saturation;
            targetBrightness = particle.brightness;
            pulse = Math.min(1, pulse + 0.34);
            if (particle.node.parentNode) {
                particle.node.parentNode.removeChild(particle.node);
            }
        }

        function updateVisuals() {
            starHue = lerp(starHue, targetHue, 0.11);
            starSaturation = lerp(starSaturation, targetSaturation, 0.09);
            starBrightness = lerp(starBrightness, targetBrightness, 0.09);
            pulse = lerp(pulse, 0, 0.05);

            const scale = 1 + pulse * 0.022;
            preview.style.setProperty('--star-hue', starHue.toFixed(2) + 'deg');
            preview.style.setProperty('--star-sat', starSaturation.toFixed(3));
            preview.style.setProperty('--star-bright', starBrightness.toFixed(3));
            preview.style.setProperty('--star-scale', scale.toFixed(4));
            preview.style.setProperty('--star-glow', pulse.toFixed(4));

            const glowA = 30 + pulse * 10;
            const glowB = 66 + pulse * 18;
            const alphaA = 0.28 + pulse * 0.08;
            const alphaB = 0.12 + pulse * 0.05;
            core.style.boxShadow = '0 0 ' + glowA.toFixed(1) + 'px rgba(255, 197, 96, ' + alphaA.toFixed(3) + '), 0 0 ' + glowB.toFixed(1) + 'px rgba(255, 145, 56, ' + alphaB.toFixed(3) + ')';
        }

        function frame(time) {
            if (!lastTime) {
                lastTime = time;
                lastSpawnAt = time;
            }
            const dt = clamp((time - lastTime) / 1000, 0, 0.05);
            lastTime = time;

            if (time - lastSpawnAt >= spawnIntervalMs && particles.length < maxParticles) {
                spawnParticle();
                lastSpawnAt = time;
            }

            for (let i = particles.length - 1; i >= 0; i -= 1) {
                const particle = particles[i];
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.node.style.left = particle.x.toFixed(2) + 'px';
                particle.node.style.top = particle.y.toFixed(2) + 'px';

                const dx = particle.impactX - particle.x;
                const dy = particle.impactY - particle.y;
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
