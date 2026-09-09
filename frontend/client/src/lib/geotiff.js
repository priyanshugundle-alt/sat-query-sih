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
        });
      };
      img.src = url;
    });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    const width = image.getWidth();
    const height = image.getHeight();
    const samplesPerPixel = image.getSamplesPerPixel() || 3;
    const geoKeys = image.getGeoKeys ? image.getGeoKeys() : null;
    
    // Extract comprehensive metadata
    const fileDirectory = image.getFileDirectory();
    let bbox = null;
    let resolution = null;
    
    try {
      if (image.getBoundingBox) {
        bbox = image.getBoundingBox();
      }
      if (image.getResolution) {
        resolution = image.getResolution();
      }
    } catch (e) {
      console.warn("Could not extract bbox/resolution", e);
    }

    const metadata = {
      geoKeys,
      bbox,
      resolution,
      modelTiepoint: fileDirectory.ModelTiepoint,
      modelPixelScale: fileDirectory.ModelPixelScale,
      epsg: geoKeys ? geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey : null,
      fileDirectory: fileDirectory // Raw tags
    };

    // Read raster data
    const rasters = await image.readRasters({ interleave: false });
    
    // Create an offscreen canvas to render pixel data
    // Scale up tiny images to at least 512px for better clarity when previewing
    const minPreviewSize = 512;
    let targetWidth = width;
    let targetHeight = height;
    
    if (width < minPreviewSize || height < minPreviewSize) {
      const scale = Math.max(minPreviewSize / width, minPreviewSize / height);
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    }
    
    // Cap maximum size to 1024 to prevent memory issues
    targetWidth = Math.min(targetWidth, 1024);
    targetHeight = Math.min(targetHeight, 1024);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    if (rasters.length >= 3) {
      // RGB channels (bands 0, 1, 2 or NIR/Red/Green)
      const r = rasters[0];
      const g = rasters[1];
      const b = rasters[2];

      const rMinMax = getMinMax(r);
      const gMinMax = getMinMax(g);
      const bMinMax = getMinMax(b);

      for (let i = 0; i < r.length; i++) {
        const idx = i * 4;
        data[idx] = normalizeValue(r[i], rMinMax.min, rMinMax.max);
        data[idx + 1] = normalizeValue(g[i], gMinMax.min, gMinMax.max);
        data[idx + 2] = normalizeValue(b[i], bMinMax.min, bMinMax.max);
        data[idx + 3] = 255;
      }
    } else {
      // Single band (e.g. SAR backscatter or panchromatic / elevation)
      const band = rasters[0];
      const { min, max } = getMinMax(band);

      for (let i = 0; i < band.length; i++) {
        const idx = i * 4;
        const val = normalizeValue(band[i], min, max);
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    // Scale to preview canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imgData, 0, 0);

    // Use high-quality bicubic interpolation for the upscale
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    const previewUrl = canvas.toDataURL("image/png");

    return {
      previewUrl,
      width,
      height,
      bands: samplesPerPixel,
      format: "GeoTIFF (Raster Grid)",
      isGeoTiff: true,
      metadata,
    };
  } catch (error) {
    console.warn("Client-side GeoTIFF render fallback:", error);
    // Fallback placeholder with GeoTIFF styling
    return {
      previewUrl: null,
      width: 512,
      height: 512,
      bands: 3,
      format: "GeoTIFF (Unrendered)",
      isGeoTiff: true,
      error: error.message,
    };
  }
}

function getMinMax(array) {
  // Collect a sample of valid pixels
  const samples = [];
  const sampleStep = Math.max(1, Math.floor(array.length / 10000));
  
  for (let i = 0; i < array.length; i += sampleStep) {
    const val = array[i];
    if (val !== undefined && !isNaN(val) && val > 0) { // Ignore 0/nodata values
      samples.push(val);
    }
  }

  if (samples.length === 0) return { min: 0, max: 255 };

  // Sort the samples to find percentiles
  samples.sort((a, b) => a - b);
  
  // Use 2nd and 98th percentile to ignore extreme dark/bright outliers
  const minIdx = Math.floor(samples.length * 0.02);
  const maxIdx = Math.floor(samples.length * 0.98);
  
  let min = samples[minIdx];
  let max = samples[maxIdx];

  if (min === max || min === undefined) {
    min = 0;
    max = 255;
  }
  return { min, max };
}

function normalizeValue(val, min, max) {
  if (max === min) return 128;
  const normalized = ((val - min) / (max - min)) * 255;
  return Math.max(0, Math.min(255, Math.round(normalized)));
}
