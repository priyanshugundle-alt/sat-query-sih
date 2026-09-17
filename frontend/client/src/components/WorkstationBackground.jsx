import React, { useEffect, useRef } from 'react';
import { Earth3DCanvas } from '@/components/Earth3DCanvas';
import { useBackground } from '@/context/BackgroundStateContext';

/**
 * WorkstationBackground - 3D Earth embedded in subtle deep space
 *
 * Creates atmospheric environment that blends Earth → atmosphere → deep space
 * No flat black rectangle effect, natural spatial depth
 */
export const WorkstationBackground = () => {
  const { visibilityState } = useBackground();
  const spaceCanvasRef = useRef(null);

  // Earth visibility based on investigation state
  const earthOpacity = (() => {
    switch (visibilityState) {
      case 'empty':       return 0.80;
      case 'imageLoaded': return 0.60;
      case 'analyzing':   return 0.50;
      case 'findingSelected': return 0.40;
      case 'showMeWhy':   return 0.30;
      default:            return 0.80;
    }
  })();

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

      // Subtle orbital elements
      ctx.strokeStyle = "rgba(18, 165, 184, 0.12)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.ellipse(width * 0.75, height * 0.25, 200, 120, -Math.PI / 15, 0, Math.PI * 1.2);
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      
      {/* Deep Space Environment Layer */}
      <canvas 
        ref={spaceCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          opacity: earthOpacity * 0.7,
          transition: 'opacity 1.2s ease'
        }}
      />

      {/* 3D Earth Layer - Full viewport coverage, no clipping */}
      <div
        className="absolute inset-0 overflow-visible"
        style={{
          opacity: earthOpacity,
          transition: 'opacity 1.2s ease',
          // Subtle atmospheric fade - centered on Earth's actual position
          // Much gentler fade, less aggressive clipping
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 72% 28%, black 30%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.2) 95%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 60% 70% at 72% 28%, black 30%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.2) 95%, transparent 100%)'
        }}
      >
        {/*
          Real 3D Earth using existing Earth3DCanvas + Earth_1_12756.glb
          NO size prop = defaults to "large" for full viewport coverage
          stage="workstation" positions Earth upper-right with proper depth
        */}
        <Earth3DCanvas
          stage="workstation"
          visibilityState={visibilityState}
          className="pointer-events-auto"
        />
      </div>
    </div>
  );
};
