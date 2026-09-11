package com.satquery.processor;

import java.util.HashMap;
import java.util.Map;

/**
 * SatQuery AI — Spatial Area & Polygon Measurement Engine
 * Calculates real-world ground area in Square Meters, Hectares, and Square Kilometers 
 * for localized satellite bounding boxes based on GSD spatial resolution.
 */
public class SpatialAreaCalculator {

    private static final double DEFAULT_GSD_METERS = 10.0; // Sentinel-2 10m GSD

    /**
     * Calculates real ground coverage area for a given bounding box [x1, y1, x2, y2]
     * 
     * @param x1 Normalized min X (0.0 - 1.0)
     * @param y1 Normalized min Y (0.0 - 1.0)
     * @param x2 Normalized max X (0.0 - 1.0)
     * @param y2 Normalized max Y (0.0 - 1.0)
     * @param imageWidth Image pixel width (e.g. 1024)
     * @param imageHeight Image pixel height (e.g. 1024)
     * @param gsdMeters Ground sampling distance in meters per pixel (default 10.0m)
     */
    public static Map<String, Object> calculateBoundingBoxArea(
            double x1, double y1, double x2, double y2, 
            int imageWidth, int imageHeight, double gsdMeters) {

        if (gsdMeters <= 0) gsdMeters = DEFAULT_GSD_METERS;
        if (imageWidth <= 0) imageWidth = 1024;
        if (imageHeight <= 0) imageHeight = 1024;

        double deltaX = Math.abs(x2 - x1);
        double deltaY = Math.abs(y2 - y1);

        double boundingBoxPixelWidth = deltaX * imageWidth;
        double boundingBoxPixelHeight = deltaY * imageHeight;

        double groundWidthMeters = boundingBoxPixelWidth * gsdMeters;
        double groundHeightMeters = boundingBoxPixelHeight * gsdMeters;

        double areaSqMeters = groundWidthMeters * groundHeightMeters;
        double areaHectares = areaSqMeters / 10000.0;
        double areaSqKm = areaSqMeters / 1000000.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("areaSqMeters", Math.round(areaSqMeters * 100.0) / 100.0);
        metrics.put("areaHectares", Math.round(areaHectares * 100.0) / 100.0);
        metrics.put("areaSqKm", Math.round(areaSqKm * 1000.0) / 1000.0);
        metrics.put("groundWidthMeters", Math.round(groundWidthMeters * 10.0) / 10.0);
        metrics.put("groundHeightMeters", Math.round(groundHeightMeters * 10.0) / 10.0);
        metrics.put("resolutionGsd", gsdMeters + "m GSD");
        return metrics;
    }
}
