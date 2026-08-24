package com.satquery.model;

public class ImageAsset {
    private String imageId;
    private String fileName;
    private String filePath;
    private ImageMetadata metadata;

    public ImageAsset() {}

    public ImageAsset(String imageId, String fileName, String filePath, ImageMetadata metadata) {
        this.imageId = imageId;
        this.fileName = fileName;
        this.filePath = filePath;
        this.metadata = metadata;
    }

    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public ImageMetadata getMetadata() { return metadata; }
    public void setMetadata(ImageMetadata metadata) { this.metadata = metadata; }
}
