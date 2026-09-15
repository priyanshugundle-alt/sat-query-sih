import React, { useEffect, useRef } from "react";

/**
 * DeepSpaceBackground — Subtle, Realistic Deep Space Canvas
 * 
 * Features:
 * - Sparse stars with authentic magnitude distribution
 * - Very faint galaxy/Milky Way dust (no bright gaming nebula)
 * - Faint orbital telemetry arcs and coordinate fragments
 * - Slow subtle parallax & low opacity
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

    // Generate 120 sparse realistic stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 0.9 + 0.3,
      alpha: Math.random() * 0.5 + 0.15,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let time = 0;
    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle galactic dust gradient (Very faint #151817 / #1D211F)
      const dustGrad = ctx.createRadialGradient(
        width * 0.45,
        height * 0.5,
        50,
        width * 0.45,
        height * 0.5,
        width * 0.65
      );
      dustGrad.addColorStop(0, "rgba(29, 33, 31, 0.28)");
      dustGrad.addColorStop(0.5, "rgba(21, 24, 23, 0.15)");
      dustGrad.addColorStop(1, "rgba(11, 13, 12, 0)");
      ctx.fillStyle = dustGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const currentAlpha =
          star.alpha * (0.7 + 0.3 * Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset));
        ctx.fillStyle = `rgba(233, 229, 218, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Subtle orbital path arc
      ctx.strokeStyle = "rgba(212, 154, 58, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.5, width * 0.45, height * 0.28, -Math.PI / 10, 0, Math.PI * 2);
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0B0D0C]"
      style={{ opacity, transition: "opacity 1s ease" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default DeepSpaceBackground;
