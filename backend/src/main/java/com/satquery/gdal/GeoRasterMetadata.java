package com.satquery.gdal;

public class GeoRasterMetadata {
    private int width;
    private int height;
    private int bandCount;
    private String bitDepth;
    private String crs;
    private String resolution;
    private boolean georeferenced;
    private double minLon;
    private double minLat;
    private double maxLon;
    private double maxLat;
    private String boundingBox;
    private double ndviMean;
    private double mndwiMean;
    private double ndbiMean;
    private double waterCoveragePct;
    private double vegCoveragePct;
    private double builtCoveragePct;
    private String sensorPlatform;
    private double cloudCoverPercent;
    private double sunElevationAngle;

    public GeoRasterMetadata() {
        this.crs = "EPSG:4326 (WGS 84)";
        this.resolution = "10.0m GSD";
        this.bitDepth = "8-bit";
        this.bandCount = 3;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getBandCount() {
        return bandCount;
    }

    public void setBandCount(int bandCount) {
        this.bandCount = bandCount;
    }

    public String getBitDepth() {
        return bitDepth;
    }

    public void setBitDepth(String bitDepth) {
        this.bitDepth = bitDepth;
    }

    public String getCrs() {
        return crs;
    }

    public void setCrs(String crs) {
        this.crs = crs;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public boolean isGeoreferenced() {
        return georeferenced;
    }

    public void setGeoreferenced(boolean georeferenced) {
        this.georeferenced = georeferenced;
    }

    public double getMinLon() {
        return minLon;
    }

    public void setMinLon(double minLon) {
        this.minLon = minLon;
    }

    public double getMinLat() {
        return minLat;
    }

    public void setMinLat(double minLat) {
        this.minLat = minLat;
    }

    public double getMaxLon() {
        return maxLon;
    }

    public void setMaxLon(double maxLon) {
        this.maxLon = maxLon;
    }

    public double getMaxLat() {
        return maxLat;
    }

    public void setMaxLat(double maxLat) {
        this.maxLat = maxLat;
    }

    public String getBoundingBox() {
        if (boundingBox == null) {
            return String.format("[%.4f, %.4f, %.4f, %.4f]", minLon, minLat, maxLon, maxLat);
        }
        return boundingBox;
    }

    public void setBoundingBox(String boundingBox) {
        this.boundingBox = boundingBox;
    }

    public double getNdviMean() {
        return ndviMean;
    }

    public void setNdviMean(double ndviMean) {
        this.ndviMean = ndviMean;
    }

    public double getMndwiMean() {
        return mndwiMean;
    }

    public void setMndwiMean(double mndwiMean) {
        this.mndwiMean = mndwiMean;
    }

    public double getNdbiMean() {
        return ndbiMean;
    }

    public void setNdbiMean(double ndbiMean) {
        this.ndbiMean = ndbiMean;
    }

    public double getWaterCoveragePct() {
        return waterCoveragePct;
    }

    public void setWaterCoveragePct(double waterCoveragePct) {
        this.waterCoveragePct = waterCoveragePct;
    }

    public double getVegCoveragePct() {
        return vegCoveragePct;
    }

    public void setVegCoveragePct(double vegCoveragePct) {
        this.vegCoveragePct = vegCoveragePct;
    }

    public double getBuiltCoveragePct() {
        return builtCoveragePct;
    }

    public void setBuiltCoveragePct(double builtCoveragePct) {
        this.builtCoveragePct = builtCoveragePct;
    }

    public String getSensorPlatform() {
        return sensorPlatform;
    }

    public void setSensorPlatform(String sensorPlatform) {
        this.sensorPlatform = sensorPlatform;
    }

    public double getCloudCoverPercent() {
        return cloudCoverPercent;
    }

    public void setCloudCoverPercent(double cloudCoverPercent) {
        this.cloudCoverPercent = cloudCoverPercent;
    }

    public double getSunElevationAngle() {
        return sunElevationAngle;
    }

    public void setSunElevationAngle(double sunElevationAngle) {
        this.sunElevationAngle = sunElevationAngle;
    }
}
