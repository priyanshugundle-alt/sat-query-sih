import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Earth3DCanvas — Master 3D Earth Observation Engine
 * 
 * Capabilities:
 * - Persistent Three.js Scene, Camera, and Earth
 * - Normalized GLB loading for /assets/earth/Earth_1_12756.glb
 * - PBR directional sun lighting, natural day/night terminator, and Rayleigh scattering atmospheric limb
 * - Reusable spherical coordinate targeting: focusCoordinates(lat, lon, zoom)
 * - Mouse & Touch interactive revolvable globe (click and drag to rotate)
 * - Calibrated India centering on page open
 * - Clean photorealistic planet with no artificial pin/pointer overlay
 * - Continuous, reversible scroll-driven camera physics
 */
export function Earth3DCanvas({
  stage = "hero", // 'hero' | 'vqa' | 'grounding' | 'nepal' | 'sar' | 'evidence' | 'final_cta' | 'workstation'
  targetCoords = null,
  zoomProgress = 0,
  className = "",
  size = "large", // "large" for landing, "small" for workstation background
  visibilityState = "empty", // empty, imageLoaded, analyzing, findingSelected, showMeWhy
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const earthGroupRef = useRef(null);
  const animFrameRef = useRef(null);
  const reduced = useReducedMotion();

  // Reduced motion and visibility handling
  const pausedRef = useRef(false);

  // Mouse drag & interaction tracking
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const isUserInteracting = useRef(false);
  const spinVelocity = useRef({ x: 0, y: 0 });
  const lastInteractionTime = useRef(0);

  // Pause animation when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    pausedRef.current = document.hidden;
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Target world radius
  const WORLD_RADIUS = 2.25;

  // Transform states for smooth damping - centered directly on India (20.59° N, 78.96° E)
  const currentRotation = useRef({ x: 0.38, y: 1.50 });
  const targetRotation = useRef({ x: 0.38, y: 1.50 });
  const currentCameraPos = useRef(new THREE.Vector3(0, 0, 5.2));
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 5.2));
  const currentEarthPos = useRef(new THREE.Vector3(0.85, 0, 0));
  const targetEarthPos = useRef(new THREE.Vector3(0.85, 0, 0));

  // Rotate Earth to center specific lat/lon toward camera
  const focusCoordinates = useCallback((lat, lon, zoom = 0) => {
    // Calibrated for Earth_1_12756.glb: centers target lat/lon directly towards camera
    const rotY = ((180 - lon) - 15.0) * (Math.PI / 180);
    const rotX = (lat * (Math.PI / 180)) * 1.05;
    targetRotation.current = { x: rotX, y: rotY };
    const dist = 5.4 - zoom * 2.2;
    targetCameraPos.current.set(0, 0, dist);
  }, []);

  // Update target transforms based on stage
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

    if (stage === "hero") {
      // Hero: Earth prominently framed, India facing directly at the user
      focusCoordinates(20.5937, 78.9629, 0.25);
      targetEarthPos.current.set(isMobile ? 0 : 0.85, isMobile ? -0.20 : 0, 0);
    } else if (stage === "workstation") {
      targetEarthPos.current.set(isMobile ? 0.5 : 1.7, isMobile ? 0.3 : 0.5, 0);
      targetCameraPos.current.set(0, 0, 6.2);
      targetRotation.current = { x: 0.20, y: -2.80 };
    } else if (stage === "vqa" || stage === "grounding") {
      focusCoordinates(19.0760, 72.8777, zoomProgress || 0.65);
      targetEarthPos.current.set(isMobile ? 0 : -0.85, 0.05, 0);
    } else if (stage === "nepal") {
      focusCoordinates(28.15, 85.34, zoomProgress || 0.7);
      targetEarthPos.current.set(isMobile ? 0 : -0.85, 0.05, 0);
    } else if (stage === "sar") {
      focusCoordinates(28.15, 85.34, zoomProgress || 0.45);
      targetEarthPos.current.set(isMobile ? 0 : 0.95, 0, -0.2);
    } else if (stage === "evidence" || stage === "technical") {
      targetEarthPos.current.set(isMobile ? 0 : -1.15, 0, -0.3);
      targetCameraPos.current.set(0, 0, 5.5);
    } else if (stage === "final_cta") {
      targetEarthPos.current.set(0, 0.1, 0);
      targetCameraPos.current.set(0, 0, 4.8);
    }

    if (targetCoords) {
      focusCoordinates(targetCoords.lat, targetCoords.lon, zoomProgress || 0.6);
    }
  }, [stage, targetCoords, zoomProgress, focusCoordinates]);

  // Three.js Scene Setup & Model Loading
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    // 2. Renderer with transparent background for atmospheric blending
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x000000, 0);
    
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Realistic Sunlight & Ambient Illumination
    const ambientLight = new THREE.AmbientLight(0xdde8f5, 1.3);
    scene.add(ambientLight);

    // Front-top directional light ensuring India and the visible hemisphere are in vivid daylight
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 3.6);
    sunLight.position.set(0, 3.2, 5.5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x386b9c, 0.9);
    fillLight.position.set(4.0, -1.0, 3.0);
    scene.add(fillLight);

    // 4. Earth Root Group
    const earthGroup = new THREE.Group();
    earthGroup.position.copy(currentEarthPos.current);
    earthGroup.rotation.x = currentRotation.current.x;
    earthGroup.rotation.y = currentRotation.current.y;
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // 4a. 3D Atmospheric Sphere around Earth (smooth Rayleigh scattering limb)
    const atmosphereGeometry = new THREE.SphereGeometry(WORLD_RADIUS * 1.025, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x3a88d8) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor, clamp(intensity * 0.75, 0.0, 0.8));
        }
      `
    });
    
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // 5. Load GLB Earth Model
    const loader = new GLTFLoader();
    const assetPath = "/assets/earth/Earth_1_12756.glb";

    loader.load(
      assetPath,
      (gltf) => {
        const earthModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(earthModel);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const normalizedScale = (WORLD_RADIUS * 2) / (maxDim || 1000);

        earthModel.scale.set(normalizedScale, normalizedScale, normalizedScale);
        earthModel.position.set(0, 0, 0);

        earthModel.traverse((child) => {
          if (child.isMesh) {
            child.material.roughness = 0.58;
            child.material.metalness = 0.05;
            if (child.material.map) {
              child.material.map.anisotropy = 16;
              child.material.map.colorSpace = THREE.SRGBColorSpace;
              child.material.map.needsUpdate = true;
            }
          }
        });

        earthGroup.add(earthModel);
      },
      undefined,
      (error) => {
        console.warn("GLB load fallback to procedural Earth sphere:", error);
        const sphereGeo = new THREE.SphereGeometry(WORLD_RADIUS, 64, 64);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0x142b3d,
          roughness: 0.7,
          metalness: 0.15,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        earthGroup.add(sphereMesh);
      }
    );

    // 6. Interactive Raycasting & Mouse / Touch Revolving Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const checkHover = (clientX, clientY) => {
      if (!container || !camera || !earthGroup) return false;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(earthGroup.children, true);
      return intersects.length > 0;
    };

    const onPointerDown = (e) => {
      // Left click or touch only
      if (e.button !== undefined && e.button !== 0) return;

      isDragging.current = true;
      isUserInteracting.current = true;
      lastInteractionTime.current = performance.now();
      prevMousePos.current = { x: e.clientX, y: e.clientY };
      spinVelocity.current = { x: 0, y: 0 };

      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {}
      container.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (isDragging.current) {
        const deltaX = e.clientX - prevMousePos.current.x;
        const deltaY = e.clientY - prevMousePos.current.y;

        // Smooth rotation sensitivity
        const sensitivity = 0.0055;
        targetRotation.current.y += deltaX * sensitivity;
        targetRotation.current.x += deltaY * sensitivity;
        // Clamp vertical tilt to prevent inverted polar spin
        targetRotation.current.x = Math.max(-1.25, Math.min(1.25, targetRotation.current.x));

        // Track velocity for inertia release
        spinVelocity.current = {
          x: deltaX * 0.0035,
          y: deltaY * 0.0035,
        };

        prevMousePos.current = { x: e.clientX, y: e.clientY };
        lastInteractionTime.current = performance.now();
      } else {
        const overEarth = checkHover(e.clientX, e.clientY);
        container.style.cursor = overEarth ? "grab" : "default";
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      lastInteractionTime.current = performance.now();
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (err) {}
      const overEarth = checkHover(e.clientX, e.clientY);
      container.style.cursor = overEarth ? "grab" : "default";
    };

    const onDoubleClick = (e) => {
      if (checkHover(e.clientX, e.clientY)) {
        if (stage === "hero") {
          focusCoordinates(20.5937, 78.9629, 0.25);
        } else {
          targetRotation.current = { x: 0.16, y: -2.40 };
          targetCameraPos.current.set(0, 0, 5.2);
        }
        spinVelocity.current = { x: 0, y: 0 };
        isUserInteracting.current = false;
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("dblclick", onDoubleClick);

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 8. Render & Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      if (reduced) {
        renderer.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      if (pausedRef.current) {
        renderer.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const time = clock.getElapsedTime();

      // Inertia & Momentum physics when user releases drag
      if (!isDragging.current) {
        if (Math.abs(spinVelocity.current.x) > 0.00003 || Math.abs(spinVelocity.current.y) > 0.00003) {
          targetRotation.current.y += spinVelocity.current.x;
          targetRotation.current.x += spinVelocity.current.y;
          targetRotation.current.x = Math.max(-1.25, Math.min(1.25, targetRotation.current.x));
          spinVelocity.current.x *= 0.94; // fluid friction damping
          spinVelocity.current.y *= 0.94;
        } else {
          spinVelocity.current = { x: 0, y: 0 };
        }

        // Resume subtle planetary drift after 3.5s idle
        const timeSinceTouch = performance.now() - lastInteractionTime.current;
        if (timeSinceTouch > 3500) {
          isUserInteracting.current = false;
          targetRotation.current.y += 0.0007;
        }
      }

      currentEarthPos.current.lerp(targetEarthPos.current, 0.045);
      earthGroup.position.copy(currentEarthPos.current);

      currentCameraPos.current.lerp(targetCameraPos.current, 0.045);
      camera.position.copy(currentCameraPos.current);

      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;

      earthGroup.rotation.x = currentRotation.current.x;
      earthGroup.rotation.y = currentRotation.current.y;

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

  }, [WORLD_RADIUS, reduced]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing ${className}`}
      style={
        size === "small"
          ? {
              position: "absolute",
              top: "5%",
              right: "5%",
              width: "15vw",
              height: "15vw",
              opacity: (() => {
                switch (visibilityState) {
                  case "empty":
                    return 0.45;
                  case "imageLoaded":
                    return 0.30;
                  case "analyzing":
                    return 0.25;
                  case "findingSelected":
                    return 0.20;
                  case "showMeWhy":
                    return 0.05;
                  default:
                    return 0.45;
                }
              })(),
            }
          : {}
      }
    />
  );
}

export default Earth3DCanvas;
