import * as GeoTIFF from "geotiff";

/**
 * Parses a GeoTIFF or standard image file and creates an optimized DataURL preview.
 * Also extracts raster dimensions, band count, and metadata.
 */
export async function parseGeoTiffFile(file) {
  const isTiff = /\.tif(f)?$/i.test(file.name);

  if (!isTiff) {
    // For standard JPG / PNG files
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          previewUrl: url,
          width: img.naturalWidth || 512,
          height: img.naturalHeight || 512,
          bands: 3,
          format: file.type || "image/png",
          isGeoTiff: false,
          sensorPlatform: "Standard Aerial / Sensor",
          resolution: "0.5m GSD",
          crs: "EPSG:4326 (WGS 84)",
        });
      };
      img.onerror = () => {
        resolve({
          previewUrl: url,
          width: 512,
          height: 512,
          bands: 3,
          format: file.type || "image/png",
          isGeoTiff: false,
          sensorPlatform: "Standard Aerial / Sensor",
          resolution: "0.5m GSD",
          crs: "EPSG:4326 (WGS 84)",
        });
      };
      img.src = url;
    });
  }

  // Derive sensor and date heuristics from filename
  const isSar = /sar|radar|sentinel.?1|s1|vv|vh|asf/i.test(file.name);
  const isS2 = /sentinel.?2|s2|msi|msil2a/i.test(file.name);
  const sensorPlatform = isSar ? "Sentinel-1 C-SAR" : isS2 ? "Sentinel-2 MSI" : "Satellite Earth Observation";
  const dateMatch = file.name.match(/(20\d{2})[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])/);
  const acquisitionDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    const origWidth = image.getWidth();
    const origHeight = image.getHeight();
    const samplesPerPixel = image.getSamplesPerPixel() || 1;
    const geoKeys = image.getGeoKeys ? image.getGeoKeys() : null;

    let bboxStr = null;
    try {
      if (typeof image.getBoundingBox === "function") {
        const bbox = image.getBoundingBox();
        if (bbox && bbox.length === 4) {
          bboxStr = `[${bbox.map((n) => Number(n).toFixed(4)).join(", ")}]`;
        }
      }
    } catch (_) {}

    let resStr = "10.0m GSD";
    try {
      if (typeof image.getResolution === "function") {
        const res = image.getResolution();
        if (res && res.length >= 2) {
          const gsd = Math.abs(res[0]);
          resStr = `${gsd < 1.0 ? (gsd * 111320).toFixed(1) : gsd.toFixed(1)}m GSD`;
        }
      }
    } catch (_) {}

    // Resample if larger than 1024 for lightning-fast preview generation
    const targetWidth = Math.min(origWidth, 1024);
    const targetHeight = Math.min(origHeight, 1024);

    const rasters = await image.readRasters({
      interleave: false,
      width: targetWidth,
      height: targetHeight,
    });

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    const imgData = ctx.createImageData(targetWidth, targetHeight);
    const data = imgData.data;

    if (rasters.length >= 3) {
      // RGB Composite
      const r = rasters[0];
      const g = rasters[1];
      const b = rasters[2];

      const rMinMax = getContrastMinMax(r);
      const gMinMax = getContrastMinMax(g);
      const bMinMax = getContrastMinMax(b);

      for (let i = 0; i < r.length; i++) {
        const idx = i * 4;
        data[idx] = normalizeValue(r[i], rMinMax.min, rMinMax.max);
        data[idx + 1] = normalizeValue(g[i], gMinMax.min, gMinMax.max);
        data[idx + 2] = normalizeValue(b[i], bMinMax.min, bMinMax.max);
        data[idx + 3] = 255;
      }
    } else {
      // Single band (SAR backscatter, single MSI band, or panchromatic)
      const band = rasters[0];
      const { min, max } = getContrastMinMax(band);

      for (let i = 0; i < band.length; i++) {
        const idx = i * 4;
        const val = normalizeValue(band[i], min, max);
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const previewUrl = canvas.toDataURL("image/png");

    const isB02Only = /_b02/i.test(file.name) || (samplesPerPixel === 1 && !isSar);
    const capabilityProfile = {
      bandCount: samplesPerPixel,
      bandsDetected: isB02Only ? ["B02 (Blue)"] : (samplesPerPixel >= 3 ? ["B02 (Blue)", "B03 (Green)", "B04 (Red)", "B08 (NIR)"] : ["Single Channel"]),
      capabilities: {
        trueColour: samplesPerPixel >= 3,
        ndvi: !isB02Only && samplesPerPixel >= 3,
        ndwi: !isB02Only && samplesPerPixel >= 3,
        textureAnalysis: true,
        spatialContrast: true,
        fullLandcoverCertainty: !isB02Only && samplesPerPixel >= 3,
      },
      limitations: isB02Only ? [
        "Single Blue Band (B02) detected.",
        "NDVI & NIR vegetation metrics unavailable (Requires B04 Red + B08 NIR).",
        "Analysis grounded to surface brightness, spatial texture & relative contrast."
      ] : [],
      recommendedUpload: "Attach B02, B03, B04, B08 for full multispectral vegetation analysis."
    };

    return {
      previewUrl,
      width: origWidth,
      height: origHeight,
      bands: samplesPerPixel,
      format: "GeoTIFF",
      isGeoTiff: true,
      geoKeys,
      boundingBox: bboxStr,
      resolution: resStr,
      sensorPlatform,
      acquisitionDate,
      crs: geoKeys?.ProjectedCSTypeGeoKey ? `EPSG:${geoKeys.ProjectedCSTypeGeoKey}` : "EPSG:32633 (UTM Zone 33N)",
      bitDepth: "16-bit",
      colorSpace: samplesPerPixel === 1 ? (isB02Only ? "Grayscale (B02 Single-Band)" : "Grayscale (Single-Band)") : "RGB Composite",
      capabilityProfile,
    };
  } catch (error) {
    console.warn("Client-side GeoTIFF render fallback:", error);
    const fallbackUrl = createRasterPlaceholder(file.name, sensorPlatform);
    return {
      previewUrl: fallbackUrl,
      fallbackPreviewUrl: fallbackUrl,
      width: 120,
      height: 120,
      bands: isSar ? 1 : 4,
      format: "GeoTIFF",
      isGeoTiff: true,
      sensorPlatform,
      acquisitionDate,
      resolution: "10.0m GSD",
      crs: "EPSG:32633 (UTM Zone 33N)",
      error: error.message,
    };
  }
}

/**
 * 2% to 98% percentile linear contrast stretch
 * Prevents satellite imagery from appearing completely dark/black due to outlier pixels.
 */
function getContrastMinMax(array) {
  if (!array || array.length === 0) return { min: 0, max: 255 };

  const sampleSize = Math.min(array.length, 2000);
  const step = Math.max(1, Math.floor(array.length / sampleSize));
  const samples = [];

  for (let i = 0; i < array.length; i += step) {
    const val = array[i];
    if (val !== undefined && !isNaN(val) && isFinite(val) && val > 0) {
      samples.push(val);
    }
  }

  if (samples.length === 0) {
    // If all values are 0 or nodata
    return { min: 0, max: 255 };
  }

  samples.sort((a, b) => a - b);
  const p2 = samples[Math.floor(samples.length * 0.02)] || samples[0];
  const p98 = samples[Math.floor(samples.length * 0.98)] || samples[samples.length - 1];

  let min = p2;
  let max = p98;

  if (min >= max) {
    min = samples[0];
    max = samples[samples.length - 1];
  }

  if (min === max) {
    min = Math.max(0, min - 1);
    max = max + 1;
  }

  return { min, max };
}

function normalizeValue(val, min, max) {
  if (val === undefined || isNaN(val) || !isFinite(val)) return 0;
  if (val <= min) return 0;
  if (val >= max) return 255;
  const normalized = ((val - min) / (max - min)) * 255;
  return Math.max(0, Math.min(255, Math.round(normalized)));
}

/**
 * Generates an SVG/Canvas fallback raster card so images NEVER show as broken icons
 */
function createRasterPlaceholder(filename, sensor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Dark background
  ctx.fillStyle = "#0B0D0C";
  ctx.fillRect(0, 0, 512, 320);

  // Grid lines
  ctx.strokeStyle = "#1D211F";
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 320);
    ctx.stroke();
  }
  for (let y = 0; y < 320; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Crosshair
  ctx.strokeStyle = "#D49A3A";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(256 - 20, 160);
  ctx.lineTo(256 + 20, 160);
  ctx.moveTo(256, 160 - 20);
  ctx.lineTo(256, 160 + 20);
  ctx.stroke();

  // Radar circle
  ctx.strokeStyle = "rgba(212, 154, 58, 0.3)";
  ctx.beginPath();
  ctx.arc(256, 160, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Labels
  ctx.fillStyle = "#D49A3A";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GEOTIFF RASTER FOOTPRINT", 256, 120);

  ctx.fillStyle = "#F3F0E8";
  ctx.font = "11px monospace";
  ctx.fillText(sensor || "SATELLITE EARTH OBSERVATION", 256, 210);

  ctx.fillStyle = "#76AEB0";
  ctx.font = "10px monospace";
  const displayFn = filename.length > 35 ? filename.substring(0, 32) + "..." : filename;
  ctx.fillText(displayFn, 256, 230);

  return canvas.toDataURL("image/png");
}
