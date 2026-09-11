package com.satquery.processor;

import java.util.HashMap;
import java.util.Map;

/**
 * SatQuery AI — Geospatial Spectral Index Processor
 * Computes Remote Sensing Spectral Indices (NDVI, MNDWI, NDBI) 
 * for Sentinel-2 Multispectral & Multisensor imagery as per SIH Problem Statement.
 */
public class SpectralIndexProcessor {

    /**
     * Calculates Normalized Difference Vegetation Index (NDVI)
     * Formula: (NIR - RED) / (NIR + RED)
     */
    public static double calculateNdvi(double nir, double red) {
        if ((nir + red) == 0) return 0.0;
        return (nir - red) / (nir + red);
    }

    /**
     * Calculates Modified Normalized Difference Water Index (MNDWI)
     * Formula: (GREEN - SWIR) / (GREEN + SWIR)
     */
    public static double calculateMndwi(double green, double swir) {
        if ((green + swir) == 0) return 0.0;
        return (green - swir) / (green + swir);
    }

    /**
     * Calculates Normalized Difference Built-Up Index (NDBI)
     * Formula: (SWIR - NIR) / (SWIR + NIR)
     */
    public static double calculateNdbi(double swir, double nir) {
        if ((swir + nir) == 0) return 0.0;
        return (swir - nir) / (swir + nir);
    }

    /**
     * Evaluates multispectral bands and returns land cover breakdown.
     */
    public static Map<String, Object> analyzeBands(double red, double green, double blue, double nir, double swir) {
        double ndvi = calculateNdvi(nir, red);
        double mndwi = calculateMndwi(green, swir);
        double ndbi = calculateNdbi(swir, nir);

        String dominantClass = "AGRICULTURE / VEGETATION";
        if (mndwi > 0.2) {
            dominantClass = "SURFACE WATER BODY";
        } else if (ndbi > 0.1) {
            dominantClass = "URBAN BUILT-UP INFRASTRUCTURE";
        } else if (ndvi > 0.4) {
            dominantClass = "DENSE DENSE FOREST CANOPY";
        } else if (ndvi > 0.1) {
            dominantClass = "SPARSE VEGETATION / CROPLAND";
        } else {
            dominantClass = "BARE SOIL / OPEN LAND";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("ndvi", Math.round(ndvi * 1000.0) / 1000.0);
        result.put("mndwi", Math.round(mndwi * 1000.0) / 1000.0);
        result.put("ndbi", Math.round(ndbi * 1000.0) / 1000.0);
        result.put("dominantClass", dominantClass);
        result.put("status", "SUCCESS");
        return result;
    }
}
