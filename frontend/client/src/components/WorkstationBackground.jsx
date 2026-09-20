import React, { useEffect, useRef } from 'react';

/**
 * WorkstationBackground - Subtle deep space environment for Investigation Workstation
 *
 * Creates an atmospheric environment with cosmic black & dark cyan depth and sparse stars,
 * without rendering the 3D Earth globe.
 */
export const WorkstationBackground = () => {
  const spaceCanvasRef = useRef(null);

  // Subtle deep space environment with atmospheric depth
  useEffect(() => {
    const canvas = spaceCanvasRef.current;
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

    // Sparse stars for deep space depth
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.0 + 0.2,
      alpha: Math.random() * 0.5 + 0.2,
      twinkleSpeed: Math.random() * 0.012 + 0.004,
      phase: Math.random() * Math.PI * 2,
    }));

    let time = 0;
    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Base deep space environment (subtle cyan-black gradients, not flat black)
      const baseGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 0,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.8
      );
      baseGrad.addColorStop(0, "#0D171C");      // Dark cyan surface
      baseGrad.addColorStop(0.7, "#080E11");   // Transition cosmic black
      baseGrad.addColorStop(1, "#040708");     // Void black
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Sparse stars with subtle twinkle
      stars.forEach(star => {
        const twinkle = 0.6 + 0.4 * Math.sin(time * star.twinkleSpeed * 100 + star.phase);
        ctx.fillStyle = `rgba(240, 246, 248, ${star.alpha * twinkle * 0.8})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Deep Space Environment Layer */}
      <canvas 
        ref={spaceCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          opacity: 0.7,
          transition: 'opacity 1.2s ease'
        }}
      />
    </div>
  );
};

