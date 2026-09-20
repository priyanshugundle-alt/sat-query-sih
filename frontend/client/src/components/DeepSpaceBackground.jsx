import React, { useEffect, useRef } from "react";

/**
 * DeepSpaceBackground — High-Definition Cinematic Deep Space Starfield
 * 
 * Features:
 * - 380+ stars rendered in multi-tiered magnitudes (micro, medium, bright hero stars)
 * - Authentic stellar color palette (cool cyan, warm amber, white, soft violet)
 * - Dynamic individual star twinkling with subtle phase offsets
 * - Cross lens-flares on hero stars
 * - Ambient cosmic dust nebulae (very soft opacity gradients)
 * - Faint telemetry orbit path line
 */
export function DeepSpaceBackground({ opacity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Stellar color palette
    const STAR_COLORS = [
      "rgba(255, 255, 255, ",  // Crisp white
      "rgba(244, 240, 230, ",  // Warm off-white
      "rgba(212, 190, 150, ",  // Amber tint
      "rgba(180, 225, 250, ",  // Cool cyan tint
      "rgba(200, 210, 240, ",  // Soft blue-violet
    ];

    // Generate 380 stars across 3 magnitude tiers
    const stars = Array.from({ length: 380 }, () => {
      const tier = Math.random();
      let radius, baseAlpha, colorPrefix, hasFlare;

      if (tier > 0.94) {
        // Hero stars (top 6%)
        radius = Math.random() * 0.9 + 1.6;
        baseAlpha = Math.random() * 0.35 + 0.65;
        colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        hasFlare = true;
      } else if (tier > 0.65) {
        // Medium crisp stars (30%)
        radius = Math.random() * 0.5 + 1.0;
        baseAlpha = Math.random() * 0.3 + 0.45;
        colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        hasFlare = false;
      } else {
        // Micro background stars (64%)
        radius = Math.random() * 0.4 + 0.4;
        baseAlpha = Math.random() * 0.25 + 0.2;
        colorPrefix = "rgba(235, 230, 220, ";
        hasFlare = false;
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha,
        colorPrefix,
        hasFlare,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.02,
      };
    });

    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. Base Space Void
      ctx.fillStyle = "#070908";
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Dust / Deep Space Nebular Ambiance (Soft, subtle gradients)
      const dust1 = ctx.createRadialGradient(
        width * 0.3,
        height * 0.4,
        80,
        width * 0.3,
        height * 0.4,
        width * 0.55
      );
      dust1.addColorStop(0, "rgba(212, 154, 58, 0.06)"); // Soft gold dust
      dust1.addColorStop(0.6, "rgba(20, 35, 30, 0.04)");
      dust1.addColorStop(1, "rgba(7, 9, 8, 0)");
      ctx.fillStyle = dust1;
      ctx.fillRect(0, 0, width, height);

      const dust2 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.65,
        60,
        width * 0.75,
        height * 0.65,
        width * 0.45
      );
      dust2.addColorStop(0, "rgba(30, 70, 90, 0.08)"); // Soft cyan space dust
      dust2.addColorStop(0.7, "rgba(10, 20, 25, 0.03)");
      dust2.addColorStop(1, "rgba(7, 9, 8, 0)");
      ctx.fillStyle = dust2;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Micro drift movement
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle formula
        const currentAlpha = Math.min(
          1,
          Math.max(
            0.05,
            star.baseAlpha *
              (0.65 + 0.35 * Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset))
          )
        );

        ctx.fillStyle = `${star.colorPrefix}${currentAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Cross lens-flare for hero stars
        if (star.hasFlare && currentAlpha > 0.4) {
          ctx.strokeStyle = `${star.colorPrefix}${(currentAlpha * 0.35).toFixed(3)})`;
          ctx.lineWidth = 0.75;
          const flareLen = star.radius * 4;

          ctx.beginPath();
          ctx.moveTo(star.x - flareLen, star.y);
          ctx.lineTo(star.x + flareLen, star.y);
          ctx.moveTo(star.x, star.y - flareLen);
          ctx.lineTo(star.x, star.y + flareLen);
          ctx.stroke();
        }
      }

      // 4. Subtle Orbital Telemetry Arc
      ctx.strokeStyle = "rgba(212, 154, 58, 0.09)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 15]);
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.5, width * 0.48, height * 0.3, -Math.PI / 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070908]"
      style={{ opacity, transition: "opacity 1s ease" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default DeepSpaceBackground;
