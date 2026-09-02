package com.satquery.model;

public class ImageMetadata {
    private String format;
    private int width;
    private int height;
    private Integer bandCount;
    private String modality;        // OPTICAL, MULTISPECTRAL, SAR, UNKNOWN
    private String acquisitionDate;
    private String crs;
    private String boundingBox;
    private boolean georeferenced;

    private String resolution;       // e.g., "10.0m GSD"
    private String fileSize;         // e.g., "4.2 MB"
    private long fileSizeBytes;
    private String bitDepth;         // e.g., "8-bit", "16-bit"
    private String colorSpace;       // e.g., "sRGB", "Grayscale", "Multispectral"
    private String sensorPlatform;   // e.g., "Sentinel-2 MSI", "Landsat-9 OLI", "PlanetScope"
    private Double cloudCoverPercent;// e.g., 2.4
    private Double ndviMean;         // e.g., 0.65

    public ImageMetadata() {}

    public ImageMetadata(String format, int width, int height, Integer bandCount, String modality, 
                         String acquisitionDate, String crs, String boundingBox, boolean georeferenced) {
        this.format = format;
        this.width = width;
        this.height = height;
        this.bandCount = bandCount;
        this.modality = modality;
        this.acquisitionDate = acquisitionDate;
        this.crs = crs;
        this.boundingBox = boundingBox;
        this.georeferenced = georeferenced;
    }

    public ImageMetadata(String format, int width, int height, Integer bandCount, String modality, 
                         String acquisitionDate, String crs, String boundingBox, boolean georeferenced,
                         String resolution, String fileSize, long fileSizeBytes, String bitDepth, String colorSpace) {
        this(format, width, height, bandCount, modality, acquisitionDate, crs, boundingBox, georeferenced);
        this.resolution = resolution;
        this.fileSize = fileSize;
        this.fileSizeBytes = fileSizeBytes;
        this.bitDepth = bitDepth;
        this.colorSpace = colorSpace;
    }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public Integer getBandCount() { return bandCount; }
    public void setBandCount(Integer bandCount) { this.bandCount = bandCount; }

    public Integer getBands() { return bandCount != null ? bandCount : 3; }

    public String getModality() { return modality; }
    public void setModality(String modality) { this.modality = modality; }

    public String getAcquisitionDate() { return acquisitionDate; }
    public void setAcquisitionDate(String acquisitionDate) { this.acquisitionDate = acquisitionDate; }

    public String getCrs() { return crs; }
    public void setCrs(String crs) { this.crs = crs; }

    public String getBoundingBox() { return boundingBox; }
    public void setBoundingBox(String boundingBox) { this.boundingBox = boundingBox; }

    public boolean isGeoreferenced() { return georeferenced; }
    public void setGeoreferenced(boolean georeferenced) { this.georeferenced = georeferenced; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getBitDepth() { return bitDepth; }
    public void setBitDepth(String bitDepth) { this.bitDepth = bitDepth; }

    public String getColorSpace() { return colorSpace; }
    public void setColorSpace(String colorSpace) { this.colorSpace = colorSpace; }

    public String getSensorPlatform() { return sensorPlatform; }
    public void setSensorPlatform(String sensorPlatform) { this.sensorPlatform = sensorPlatform; }

    public Double getCloudCoverPercent() { return cloudCoverPercent; }
    public void setCloudCoverPercent(Double cloudCoverPercent) { this.cloudCoverPercent = cloudCoverPercent; }

    public Double getNdviMean() { return ndviMean; }
    public void setNdviMean(Double ndviMean) { this.ndviMean = ndviMean; }
}
