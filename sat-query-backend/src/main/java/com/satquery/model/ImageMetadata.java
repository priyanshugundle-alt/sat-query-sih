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

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public Integer getBandCount() { return bandCount; }
    public void setBandCount(Integer bandCount) { this.bandCount = bandCount; }

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
}
