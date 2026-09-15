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
 * - 3D Surface-attached pulsing amber scientific pin
 * - Orbiting satellite model with observation trajectory
 * - Reversible, continuous scroll-driven camera physics (lerp & damping)
 */
export function Earth3DCanvas({
  stage = "hero", // 'hero' | 'vqa' | 'grounding' | 'nepal' | 'sar' | 'evidence' | 'final_cta' | 'workstation'
  targetCoords = null,
  zoomProgress = 0,
  className = "",
  size = "large", // "large" for landing, "small" for workstation background
  visibilityState = "empty", // empty, imageLoaded, analyzing, findingSelected, showMeWhy
}) {
  console.log('Earth3DCanvas RENDER', { stage, size, visibilityState, className });
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const earthGroupRef = useRef(null);
  const pinGroupRef = useRef(null);
  const animFrameRef = useRef(null);
  const reduced = useReducedMotion();
  // Reduced motion and visibility handling
  const pausedRef = useRef(false);

// Pause animation when tab is hidden
useEffect(() => {
  const handleVisibility = () => {
    pausedRef.current = document.hidden;
  };
  document.addEventListener('visibilitychange', handleVisibility);
  // Set initial state
  pausedRef.current = document.hidden;
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);

// Target world radius
const WORLD_RADIUS = 2.25;


  // Transform states for smooth damping - centered directly on India (20.59° N, 78.96° E)
  // Mesh orientation formula: rotY = -(lon + 45)° = -(78.96 + 45)° = -123.96° = -2.16 rad
  const currentRotation = useRef({ x: 0.16, y: -2.16 });
  const targetRotation = useRef({ x: 0.16, y: -2.16 });
  const currentCameraPos = useRef(new THREE.Vector3(0, 0, 5.2));
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 5.2));
  const currentEarthPos = useRef(new THREE.Vector3(1.15, 0.05, 0));
  const targetEarthPos = useRef(new THREE.Vector3(1.15, 0.05, 0));

  // Convert lat/lon to 3D Cartesian coordinates on sphere matching Earth_1_12756.glb orientation
  const latLonToVector3 = useCallback((lat, lon, radius = WORLD_RADIUS) => {
    const latRad = lat * (Math.PI / 180);
    const theta = (45 - lon) * (Math.PI / 180);
    const hRadius = radius * Math.cos(latRad);
    const x = hRadius * Math.cos(theta);
    const y = radius * Math.sin(latRad);
    const z = hRadius * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }, [WORLD_RADIUS]);

  // Rotate Earth to center specific lat/lon toward camera
  const focusCoordinates = useCallback((lat, lon, zoom = 0) => {
    const rotY = -((lon + 45) * (Math.PI / 180));
    const rotX = (lat * (Math.PI / 180)) * 0.45;
    targetRotation.current = { x: rotX, y: rotY };
    const dist = 5.4 - zoom * 2.2;
    targetCameraPos.current.set(0, 0, dist);
  }, []);

  // Update target transforms based on stage
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

    if (stage === "hero") {
      // Hero: Earth prominently framed on the right side, pinned and centered directly on India
      focusCoordinates(20.5937, 78.9629, 0.25);
      targetEarthPos.current.set(isMobile ? 0 : 1.15, isMobile ? -0.30 : 0.05, 0);
    } else if (stage === "workstation") {
      // Workstation: Earth visible upper-right, ~20-30% visual presence
      targetEarthPos.current.set(isMobile ? 0.5 : 1.7, isMobile ? 0.3 : 0.5, 0);
      targetCameraPos.current.set(0, 0, 6.2);
      targetRotation.current = { x: 0.20, y: -2.80 };
    } else if (stage === "vqa" || stage === "grounding") {
      // Mumbai: 19.0760° N, 72.8777° E
      focusCoordinates(19.0760, 72.8777, zoomProgress || 0.65);
      targetEarthPos.current.set(isMobile ? 0 : -0.85, 0.05, 0);
    } else if (stage === "nepal") {
      // Syabru Besi, Nepal: 28.15° N, 85.34° E
      focusCoordinates(28.15, 85.34, zoomProgress || 0.7);
      targetEarthPos.current.set(isMobile ? 0 : -0.85, 0.05, 0);
    } else if (stage === "sar") {
      // Optical + SAR swath
      focusCoordinates(28.15, 85.34, zoomProgress || 0.45);
      targetEarthPos.current.set(isMobile ? 0 : 0.95, 0, -0.2);
    } else if (stage === "evidence" || stage === "technical") {
      // Evidence & Technical signal background anchor
      targetEarthPos.current.set(isMobile ? 0 : -1.15, 0, -0.3);
      targetCameraPos.current.set(0, 0, 5.5);
    } else if (stage === "final_cta") {
      // Final CTA: Earth large and centered
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
    
    // Transparent background - no flat black rectangle
    renderer.setClearColor(0x000000, 0);
    
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Realistic Sunlight & Ambient Illumination (Land is clear, radiant and rich)
    const ambientLight = new THREE.AmbientLight(0xdde8f5, 1.2);
    scene.add(ambientLight);

    // Sun positioned from the front-top to illuminate the Indian subcontinent & Asia with golden daylit clarity
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 3.4);
    sunLight.position.set(-1.0, 3.5, 5.5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x386b9c, 0.8);
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

    console.log('✓ Added 3D atmospheric sphere around Earth');

    // 5. Pin Root Group
    const pinGroup = new THREE.Group();
    earthGroup.add(pinGroup);
    pinGroupRef.current = pinGroup;

    const create3DPin = (lat, lon, label) => {
      while (pinGroup.children.length > 0) {
        pinGroup.remove(pinGroup.children[0]);
      }

      const pinPos = latLonToVector3(lat, lon, WORLD_RADIUS * 1.008);
      const pinSubGroup = new THREE.Group();
      pinSubGroup.position.copy(pinPos);
      pinSubGroup.lookAt(new THREE.Vector3(0, 0, 0));

      // Luminous white core dot
      const coreGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      pinSubGroup.add(coreMesh);

      // Amber luminous beacon halo
      const dotGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xD49A3A, transparent: true, opacity: 0.9 });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      pinSubGroup.add(dotMesh);

      // Primary pulsing radar ring
      const ringGeo = new THREE.RingGeometry(0.08, 0.11, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xE4B65A,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = "pulseRing";
      pinSubGroup.add(ringMesh);

      // Secondary radar wave ring
      const ringGeo2 = new THREE.RingGeometry(0.14, 0.17, 32);
      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0xD49A3A,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
      ringMesh2.name = "pulseRing2";
      pinSubGroup.add(ringMesh2);

      // Crosshairs
      const lineMat = new THREE.LineBasicMaterial({ color: 0xD49A3A, transparent: true, opacity: 0.85 });
      const linePoints = [
        new THREE.Vector3(-0.20, 0, 0), new THREE.Vector3(0.20, 0, 0),
        new THREE.Vector3(0, -0.20, 0), new THREE.Vector3(0, 0.20, 0),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const crosshair = new THREE.LineSegments(lineGeo, lineMat);
      pinSubGroup.add(crosshair);

      pinGroup.add(pinSubGroup);
    };

    // 6. Load GLB Earth Model
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
        create3DPin(20.5937, 78.9629, "INDIA");
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
        create3DPin(20.5937, 78.9629, "INDIA");
      }
    );

    // 8. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 9. Render & Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
  // If reduced motion is preferred, skip updates that cause motion
  if (reduced) {
    renderer.render(scene, camera);
    animFrameRef.current = requestAnimationFrame(animate);
    return;
  }
  // If tab is hidden, pause dynamic updates but still render static frame
  if (pausedRef.current) {
    renderer.render(scene, camera);
    animFrameRef.current = requestAnimationFrame(animate);
    return;
  }

  const time = clock.getElapsedTime();

  currentEarthPos.current.lerp(targetEarthPos.current, 0.045);
  earthGroup.position.copy(currentEarthPos.current);

  currentCameraPos.current.lerp(targetCameraPos.current, 0.045);
  camera.position.copy(currentCameraPos.current);

  currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.04;
  currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.04;

  // Subtle, realistic planetary movement that keeps the landmass centered in view
  const slowDrift = (stage === "hero" || stage === "final_cta" || stage === "workstation") ? Math.sin(time * 0.15) * 0.08 : 0;

  earthGroup.rotation.x = currentRotation.current.x;
  earthGroup.rotation.y = currentRotation.current.y + slowDrift;

  if (pinGroup) {
    const pulse = (Math.sin(time * 3.6) + 1) * 0.5;
    pinGroup.traverse((child) => {
      if (child.name === "pulseRing") {
        child.scale.set(1 + pulse * 0.45, 1 + pulse * 0.45, 1);
        child.material.opacity = 0.95 - pulse * 0.55;
      }
      if (child.name === "pulseRing2") {
        child.scale.set(1 + pulse * 0.65, 1 + pulse * 0.65, 1);
        child.material.opacity = 0.65 - pulse * 0.5;
      }
    });
  }

  renderer.render(scene, camera);
  animFrameRef.current = requestAnimationFrame(animate);
};
  // start the animation loop
  animate();

  // cleanup on unmount
  return () => {
    window.removeEventListener("resize", handleResize);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (renderer.domElement && container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };

  }, [WORLD_RADIUS, latLonToVector3]);

  // Update Pin when target coordinates or stage change
  useEffect(() => {
    if (!pinGroupRef.current) return;
    const pinGroup = pinGroupRef.current;

    while (pinGroup.children.length > 0) {
      pinGroup.remove(pinGroup.children[0]);
    }

    let lat = 20.5937;
    let lon = 78.9629;
    let label = "INDIA";

    if (stage === "hero") {
      lat = 20.5937;
      lon = 78.9629;
      label = "INDIA";
    } else if (stage === "vqa" || stage === "grounding") {
      lat = 19.0760;
      lon = 72.8777;
      label = "MUMBAI";
    } else if (stage === "nepal" || stage === "sar") {
      lat = 28.15;
      lon = 85.34;
      label = "SYABRU BESI / NEPAL";
    } else if (targetCoords) {
      lat = targetCoords.lat;
      lon = targetCoords.lon;
      label = targetCoords.label || "TARGET";
    }

    const pinPos = latLonToVector3(lat, lon, WORLD_RADIUS * 1.008);
    const pinSubGroup = new THREE.Group();
    pinSubGroup.position.copy(pinPos);
    pinSubGroup.lookAt(new THREE.Vector3(0, 0, 0));

    // Luminous white core dot
    const coreGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    pinSubGroup.add(coreMesh);

    // Amber luminous beacon halo
    const dotGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xD49A3A, transparent: true, opacity: 0.9 });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    pinSubGroup.add(dotMesh);

    // Primary pulsing radar ring
    const ringGeo = new THREE.RingGeometry(0.08, 0.11, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xE4B65A,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = "pulseRing";
    pinSubGroup.add(ringMesh);

    // Secondary radar wave ring
    const ringGeo2 = new THREE.RingGeometry(0.14, 0.17, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xD49A3A,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.name = "pulseRing2";
    pinSubGroup.add(ringMesh2);

    // Crosshairs
    const lineMat = new THREE.LineBasicMaterial({ color: 0xD49A3A, transparent: true, opacity: 0.85 });
    const linePoints = [
      new THREE.Vector3(-0.20, 0, 0), new THREE.Vector3(0.20, 0, 0),
      new THREE.Vector3(0, -0.20, 0), new THREE.Vector3(0, 0.20, 0),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const crosshair = new THREE.LineSegments(lineGeo, lineMat);
    pinSubGroup.add(crosshair);

    pinGroup.add(pinSubGroup);
  }, [stage, targetCoords, WORLD_RADIUS, latLonToVector3]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative overflow-hidden pointer-events-none ${className}`}
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
