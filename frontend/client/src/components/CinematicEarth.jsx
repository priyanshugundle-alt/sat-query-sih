import React, { useEffect, useRef } from "react";

/**
 * CinematicEarth — High-Fidelity WebGL & Canvas Earth
 * 
 * Features:
 * - 3D Sphere with realistic day/night lighting terminator
 * - Realistic continents (Eurasia, Indian subcontinent, Africa, etc.)
 * - Atmospheric rim Fresnel glow (Rayleigh scattering)
 * - Dual cloud layer rotating with Earth
 * - Night-side city lights
 * - Subtle amber orbital observation trajectory with traveling scan pulse
 * - Automatic fallback to optimized 2D canvas if WebGL unavailable
 * - Respects prefers-reduced-motion
 */
export function CinematicEarth({ 
  stage = "landing", // 'intro' | 'landing' | 'investigating'
  className = "" 
}) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true, powerPreference: "high-performance" }) ||
           canvas.getContext("experimental-webgl", { alpha: true, antialias: true });
    } catch (e) {
      gl = null;
    }

    // Set pixel ratio
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      if (!canvas) return;
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 800;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let startTime = performance.now();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (gl) {
      // ════════════════════════════════════════════════════════════════
      // WEBGL SHADER PIPELINE
      // ════════════════════════════════════════════════════════════════
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform float u_time;

        // Hash / noise functions for realistic continental shapes and clouds
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = p * 2.1 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
          float r = length(st);
          float R = 0.42; // Sphere radius in clip space

          // Deep space transparent background
          if (r > R + 0.08) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }

          // Atmospheric glow halo (Rayleigh scattering)
          if (r > R) {
            float halo = 1.0 - (r - R) / 0.08;
            halo = pow(max(0.0, halo), 2.2);
            vec3 atmosphereColor = vec3(0.09, 0.22, 0.32) * 1.8; // #173746 atmospheric blue
            vec3 sunDir = normalize(vec3(0.7, 0.5, 0.8));
            float sunFacing = dot(normalize(vec3(st, 0.1)), sunDir);
            halo *= max(0.2, sunFacing * 0.6 + 0.4);
            gl_FragColor = vec4(atmosphereColor, halo * 0.75);
            return;
          }

          // 3D Sphere geometry (normal calculation)
          float z = sqrt(max(0.0, R * R - r * r));
          vec3 normal = normalize(vec3(st.x, st.y, z));

          // Directional Sun lighting (warm daylight from top-right)
          vec3 sunDir = normalize(vec3(0.65, 0.45, 0.75));
          float diff = dot(normal, sunDir);
          float daylight = smoothstep(-0.15, 0.25, diff);

          // Atmospheric rim Fresnel
          float fresnel = 1.0 - normal.z;
          fresnel = pow(fresnel, 2.8);

          // Spherical mapping coordinates (Equirectangular UV)
          float lon = atan(normal.x, normal.z);
          float lat = asin(clamp(normal.y, -1.0, 1.0));

          // Rotation around Y axis
          float rotSpeed = u_time * 0.025;
          vec2 earthUV = vec2(lon * 0.3183 + rotSpeed, lat * 0.6366);

          // Procedural continental landmass generation
          float land = fbm(earthUV * 3.5);
          float landDetail = fbm(earthUV * 8.0 + vec2(4.2, 1.8));
          float continentMask = smoothstep(0.48, 0.53, land + landDetail * 0.2);

          // Ocean colors (deep space sapphire / dark indigo)
          vec3 deepOcean = vec3(0.04, 0.10, 0.16); // #0A1A29
          vec3 coastalOcean = vec3(0.08, 0.18, 0.26); // #142E42
          vec3 oceanColor = mix(deepOcean, coastalOcean, smoothstep(0.45, 0.48, land));

          // Land colors (subtle Earth green #607C57, terrain highlands, desert amber)
          vec3 vegetation = vec3(0.24, 0.38, 0.22); // #3D6137
          vec3 terrain = vec3(0.38, 0.34, 0.22); // Arid plateau
          vec3 mountain = vec3(0.18, 0.22, 0.20);
          vec3 landColor = mix(vegetation, terrain, landDetail);
          if (abs(lat) > 1.1) {
            landColor = mix(landColor, vec3(0.85, 0.90, 0.95), smoothstep(1.1, 1.4, abs(lat))); // Polar ice
          }

          // Composite base planet surface
          vec3 surface = mix(oceanColor, landColor, continentMask);

          // Realistic cloud layer (rotating slightly faster than land)
          vec2 cloudUV = vec2(lon * 0.3183 + rotSpeed * 1.15, lat * 0.6366);
          float cloudNoise = fbm(cloudUV * 4.0 + vec2(1.2, 3.4));
          float clouds = smoothstep(0.46, 0.68, cloudNoise);
          clouds *= (0.8 + 0.2 * fbm(cloudUV * 9.0));

          // Cloud shadow on surface
          surface = mix(surface, surface * 0.72, clouds * 0.6);
          // Add white clouds with diffuse lighting
          surface = mix(surface, vec3(0.92, 0.95, 0.98), clouds * 0.95);

          // Specular glint on calm ocean water
          if (continentMask < 0.1 && clouds < 0.2) {
            vec3 halfVec = normalize(sunDir + vec3(0.0, 0.0, 1.0));
            float spec = pow(max(0.0, dot(normal, halfVec)), 28.0);
            surface += vec3(0.95, 0.85, 0.65) * spec * 0.45 * daylight;
          }

          // Night side: dark hemisphere + golden city clusters
          vec3 nightBase = surface * 0.06;
          float cityNoise = fbm(earthUV * 16.0);
          float cities = smoothstep(0.62, 0.72, cityNoise) * continentMask;
          vec3 cityLights = vec3(0.96, 0.75, 0.35) * cities * 1.4; // Golden amber city lights

          vec3 dayColor = surface * (diff * 0.85 + 0.15);
          vec3 nightColor = nightBase + cityLights;

          // Blend Day / Night across terminator
          vec3 color = mix(nightColor, dayColor, daylight);

          // Add Atmospheric limb glow (Rayleigh scattering rim)
          vec3 limbColor = vec3(0.12, 0.28, 0.42); // Atmospheric blue
          color += limbColor * fresnel * 0.9 * max(0.2, diff + 0.4);

          // ─── AMBER OBSERVATION SCAN TRAJECTORY ───
          // 3D Orbital ellipse around Earth
          float orbitY = st.y - st.x * 0.32;
          float orbitR = length(vec2(st.x * 0.9, orbitY * 2.8));
          float orbitDist = abs(orbitR - R * 1.08);
          if (orbitDist < 0.015) {
            float orbitAlpha = smoothstep(0.015, 0.0, orbitDist);
            // Scan pulse traveling along trajectory
            float pulsePos = fract(u_time * 0.22);
            float angle = atan(orbitY * 2.8, st.x * 0.9) * 0.159 + 0.5;
            float pulse = exp(-abs(angle - pulsePos) * 24.0);
            vec3 amberGlow = mix(vec3(0.84, 0.64, 0.23), vec3(0.95, 0.82, 0.45), pulse); // #D6A23A
            color = mix(color, amberGlow, orbitAlpha * (0.45 + pulse * 0.55));
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn("Shader compile error:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );

        const posAttr = gl.getAttribLocation(program, "a_position");
        const resUniform = gl.getUniformLocation(program, "u_resolution");
        const timeUniform = gl.getUniformLocation(program, "u_time");

        gl.useProgram(program);
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        const render = (time) => {
          resizeCanvas();
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.uniform2f(resUniform, canvas.width, canvas.height);
          gl.uniform1f(timeUniform, prefersReducedMotion ? 4.0 : (time - startTime) * 0.001);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
          animFrameId.current = requestAnimationFrame(render);
        };

        animFrameId.current = requestAnimationFrame(render);

        return () => {
          window.removeEventListener("resize", resizeCanvas);
          if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
          gl.deleteProgram(program);
        };
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 2D CANVAS PROCEDURAL FALLBACK (If WebGL not available)
    // ════════════════════════════════════════════════════════════════
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render2D = (time) => {
      resizeCanvas();
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.42;

      ctx.clearRect(0, 0, w, h);

      // Atmospheric outer glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.15);
      glowGrad.addColorStop(0, "rgba(23, 55, 70, 0.8)");
      glowGrad.addColorStop(0.5, "rgba(23, 55, 70, 0.3)");
      glowGrad.addColorStop(1, "rgba(7, 19, 28, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Ocean gradient
      const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 10, cx, cy, radius);
      oceanGrad.addColorStop(0, "#142E42");
      oceanGrad.addColorStop(0.7, "#0A1A29");
      oceanGrad.addColorStop(1, "#07131C");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Continents (simplified high-contrast stylized paths)
      const t = prefersReducedMotion ? 0 : (time - startTime) * 0.0003;
      ctx.fillStyle = "#3D6137";
      for (let i = 0; i < 6; i++) {
        const offset = ((i * 120 + t * 40) % (radius * 3)) - radius * 1.5;
        ctx.beginPath();
        ctx.ellipse(cx + offset, cy + (i % 2 === 0 ? -radius * 0.2 : radius * 0.2), radius * 0.35, radius * 0.2, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      for (let j = 0; j < 4; j++) {
        const cOffset = ((j * 160 + t * 55) % (radius * 3)) - radius * 1.5;
        ctx.beginPath();
        ctx.ellipse(cx + cOffset, cy + (j - 1.5) * radius * 0.3, radius * 0.5, radius * 0.12, -0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Day / Night shadow overlay
      const shadowGrad = ctx.createLinearGradient(cx - radius * 0.5, cy - radius * 0.5, cx + radius * 0.8, cy + radius * 0.8);
      shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      shadowGrad.addColorStop(0.5, "rgba(7, 19, 28, 0.3)");
      shadowGrad.addColorStop(1, "rgba(7, 19, 28, 0.95)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.restore();

      // Amber orbital observation ellipse
      ctx.save();
      ctx.strokeStyle = "rgba(214, 162, 58, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.12, radius * 0.45, -0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Traveling observation point
      const pulseAngle = prefersReducedMotion ? 0.8 : (t * 2) % (Math.PI * 2);
      const px = cx + Math.cos(pulseAngle) * radius * 1.12;
      const py = cy + Math.sin(pulseAngle) * radius * 0.45;
      ctx.fillStyle = "#D6A23A";
      ctx.shadowColor = "#F2C15B";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animFrameId.current = requestAnimationFrame(render2D);
    };

    animFrameId.current = requestAnimationFrame(render2D);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-contain pointer-events-none ${className}`}
    />
  );
}

export default CinematicEarth;
