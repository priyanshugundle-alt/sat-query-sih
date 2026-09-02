package com.satquery.gdal;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Path;

public class GdalProcessor {

    public GeoRasterMetadata inspect(Path path) {
        return inspect(path.toFile());
    }

    public GeoRasterMetadata inspect(com.satquery.model.ImageAsset asset) {
        if (asset == null) return inspect((File) null);
        File file = asset.getFilePath() != null ? new File(asset.getFilePath()) : null;
        GeoRasterMetadata metadata = inspect(file);

        if (asset.getMetadata() != null) {
            com.satquery.model.ImageMetadata im = asset.getMetadata();
            if (im.getCrs() != null) metadata.setCrs(im.getCrs());
            if (im.getWidth() > 0) metadata.setWidth(im.getWidth());
            if (im.getHeight() > 0) metadata.setHeight(im.getHeight());
            if (im.getBandCount() != null && im.getBandCount() > 0) metadata.setBandCount(im.getBandCount());
            if (im.getBitDepth() != null) metadata.setBitDepth(im.getBitDepth());
            if (im.getResolution() != null) metadata.setResolution(im.getResolution());

            if (im.getBoundingBox() != null && im.getBoundingBox().startsWith("[")) {
                try {
                    String clean = im.getBoundingBox().replaceAll("[\\[\\] ]", "");
                    String[] parts = clean.split(",");
                    if (parts.length == 4) {
                        metadata.setMinLon(Double.parseDouble(parts[0]));
                        metadata.setMinLat(Double.parseDouble(parts[1]));
                        metadata.setMaxLon(Double.parseDouble(parts[2]));
                        metadata.setMaxLat(Double.parseDouble(parts[3]));
                        metadata.setBoundingBox(im.getBoundingBox());
                        metadata.setGeoreferenced(true);
                    }
                } catch (Exception ignored) {}
            }
        }
        return metadata;
    }

    public GeoRasterMetadata inspect(File file) {
        GeoRasterMetadata metadata = new GeoRasterMetadata();
        if (file == null || !file.exists()) {
            metadata.setWidth(1024);
            metadata.setHeight(1024);
            metadata.setMinLon(72.8000);
            metadata.setMinLat(18.9000);
            metadata.setMaxLon(72.9000);
            metadata.setMaxLat(19.0000);
            metadata.setBoundingBox("[72.8000, 18.9000, 72.9000, 19.0000]");
            return metadata;
        }

        String fileName = file.getName().toLowerCase();
        boolean isTiff = fileName.endsWith(".tif") || fileName.endsWith(".tiff");

        // 1. TIFF IFD Header Parsing for GeoTIFF Tags
        if (isTiff) {
            parseTiffGeoTags(file, metadata);
        }

        // 2. ImageIO raster pixel inspection
        try {
            BufferedImage img = ImageIO.read(file);
            if (img != null) {
                if (metadata.getWidth() <= 0) metadata.setWidth(img.getWidth());
                if (metadata.getHeight() <= 0) metadata.setHeight(img.getHeight());

                ColorModel cm = img.getColorModel();
                if (cm != null) {
                    if (metadata.getBandCount() <= 0) {
                        metadata.setBandCount(cm.getNumComponents());
                    }
                    metadata.setBitDepth(cm.getPixelSize() + "-bit");
                }

                // Compute spectral indices & land cover ratios from raster pixel values
                computeSpectralMetrics(img, metadata);
            }
        } catch (Exception e) {
            System.err.println("[GdalProcessor] Raster pixel reading exception: " + e.getMessage());
        }

        // Fallback default coordinates if not georeferenced
        if (!metadata.isGeoreferenced() || (metadata.getMinLon() == 0.0 && metadata.getMaxLon() == 0.0)) {
            metadata.setMinLon(72.8000);
            metadata.setMinLat(18.9000);
            metadata.setMaxLon(72.9000);
            metadata.setMaxLat(19.0000);
            metadata.setBoundingBox("[72.8000, 18.9000, 72.9000, 19.0000]");
        } else {
            metadata.setBoundingBox(String.format("[%.4f, %.4f, %.4f, %.4f]",
                    metadata.getMinLon(), metadata.getMinLat(), metadata.getMaxLon(), metadata.getMaxLat()));
        }

        if (metadata.getWidth() <= 0) metadata.setWidth(1024);
        if (metadata.getHeight() <= 0) metadata.setHeight(1024);

        return metadata;
    }

    private void parseTiffGeoTags(File file, GeoRasterMetadata metadata) {
        try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
            byte[] header = new byte[8];
            raf.readFully(header);

            ByteOrder byteOrder;
            if (header[0] == 0x49 && header[1] == 0x49) {
                byteOrder = ByteOrder.LITTLE_ENDIAN;
            } else if (header[0] == 0x4D && header[1] == 0x4D) {
                byteOrder = ByteOrder.BIG_ENDIAN;
            } else {
                return;
            }

            ByteBuffer buf = ByteBuffer.wrap(header).order(byteOrder);
            int magic = buf.getShort(2) & 0xFFFF;
            if (magic != 42) {
                return;
            }

            long firstIfdOffset = buf.getInt(4) & 0xFFFFFFFFL;
            raf.seek(firstIfdOffset);

            byte[] ifdHeader = new byte[2];
            raf.readFully(ifdHeader);
            buf = ByteBuffer.wrap(ifdHeader).order(byteOrder);
            int numEntries = buf.getShort() & 0xFFFF;

            boolean hasGeoTags = false;
            double scaleX = 0.0, scaleY = 0.0;
            double tieX = 0.0, tieY = 0.0;

            for (int i = 0; i < numEntries; i++) {
                byte[] entryBytes = new byte[12];
                raf.readFully(entryBytes);
                buf = ByteBuffer.wrap(entryBytes).order(byteOrder);

                int tag = buf.getShort(0) & 0xFFFF;
                int type = buf.getShort(2) & 0xFFFF;
                long count = buf.getInt(4) & 0xFFFFFFFFL;
                long valOffset = buf.getInt(8) & 0xFFFFFFFFL;

                // Tag 256: ImageWidth
                if (tag == 256) {
                    metadata.setWidth((int) (type == 3 ? valOffset & 0xFFFF : valOffset));
                }
                // Tag 257: ImageLength
                else if (tag == 257) {
                    metadata.setHeight((int) (type == 3 ? valOffset & 0xFFFF : valOffset));
                }
                // Tag 258: BitsPerSample
                else if (tag == 258) {
                    int bps = (int) (type == 3 ? valOffset & 0xFFFF : valOffset);
                    metadata.setBitDepth(bps + "-bit");
                }
                // Tag 277: SamplesPerPixel
                else if (tag == 277) {
                    metadata.setBandCount((int) valOffset);
                }
                // Tag 33550: ModelPixelScaleTag
                else if (tag == 33550 && count >= 2 && valOffset < file.length()) {
                    hasGeoTags = true;
                    long savedPos = raf.getFilePointer();
                    raf.seek(valOffset);
                    byte[] doubleBuf = new byte[16];
                    raf.readFully(doubleBuf);
                    ByteBuffer dBuf = ByteBuffer.wrap(doubleBuf).order(byteOrder);
                    scaleX = dBuf.getDouble();
                    scaleY = dBuf.getDouble();
                    raf.seek(savedPos);
                }
                // Tag 33922: ModelTiepointTag
                else if (tag == 33922 && count >= 6 && valOffset < file.length()) {
                    hasGeoTags = true;
                    long savedPos = raf.getFilePointer();
                    raf.seek(valOffset);
                    byte[] doubleBuf = new byte[48];
                    raf.readFully(doubleBuf);
                    ByteBuffer dBuf = ByteBuffer.wrap(doubleBuf).order(byteOrder);
                    dBuf.getDouble(); // I
                    dBuf.getDouble(); // J
                    dBuf.getDouble(); // K
                    tieX = dBuf.getDouble();
                    tieY = dBuf.getDouble();
                    raf.seek(savedPos);
                }
                // Tag 34735: GeoKeyDirectoryTag
                else if (tag == 34735) {
                    hasGeoTags = true;
                }
            }

            if (hasGeoTags) {
                metadata.setGeoreferenced(true);
                metadata.setCrs("EPSG:4326 (WGS 84)");

                if (scaleX > 0) {
                    double gsdMeters = scaleX < 1.0 ? scaleX * 111320.0 : scaleX;
                    metadata.setResolution(String.format("%.1fm GSD", gsdMeters));
                }

                if (tieX != 0.0 || tieY != 0.0) {
                    int w = metadata.getWidth() > 0 ? metadata.getWidth() : 1024;
                    int h = metadata.getHeight() > 0 ? metadata.getHeight() : 1024;
                    double sX = scaleX > 0 ? scaleX : 0.0001;
                    double sY = scaleY > 0 ? scaleY : 0.0001;

                    metadata.setMinLon(tieX);
                    metadata.setMaxLat(tieY);
                    metadata.setMaxLon(tieX + w * sX);
                    metadata.setMinLat(tieY - h * sY);
                }
            }
        } catch (Exception e) {
            System.err.println("[GdalProcessor] TIFF header parse exception: " + e.getMessage());
        }
    }

    private void computeSpectralMetrics(BufferedImage img, GeoRasterMetadata metadata) {
        int w = img.getWidth();
        int h = img.getHeight();
        int step = Math.max(1, (w * h) / 10000); // Downsample sampling grid for performance

        double sumNdvi = 0.0;
        double sumMndwi = 0.0;
        double sumNdbi = 0.0;

        int waterPixels = 0;
        int vegPixels = 0;
        int builtPixels = 0;
        int sampledCount = 0;

        for (int y = 0; y < h; y += (int) Math.sqrt(step)) {
            for (int x = 0; x < w; x += (int) Math.sqrt(step)) {
                int rgb = img.getRGB(x, y);
                double r = (rgb >> 16) & 0xFF;
                double g = (rgb >> 8) & 0xFF;
                double b = rgb & 0xFF;

                // Spectral proxies: Green as vegetation/water proxy, Red as soil/built-up, Blue as water absorption
                double nirProxy = Math.max(g * 1.2, r * 0.8);
                double swirProxy = Math.max(r * 1.1, g * 0.9);

                // NDVI = (NIR - Red) / (NIR + Red)
                double ndvi = (nirProxy + r > 0) ? (nirProxy - r) / (nirProxy + r) : 0.0;

                // MNDWI = (Green - SWIR) / (Green + SWIR)
                double mndwi = (g + swirProxy > 0) ? (g - swirProxy) / (g + swirProxy) : 0.0;

                // NDBI = (SWIR - NIR) / (SWIR + NIR)
                double ndbi = (swirProxy + nirProxy > 0) ? (swirProxy - nirProxy) / (swirProxy + nirProxy) : 0.0;

                sumNdvi += ndvi;
                sumMndwi += mndwi;
                sumNdbi += ndbi;
                sampledCount++;

                if (b > r * 1.05 && b > g * 0.95) {
                    waterPixels++;
                } else if (g > r * 1.05 && g > b * 1.05) {
                    vegPixels++;
                } else if (r > 1.1 * g && r > b) {
                    builtPixels++;
                }
            }
        }

        if (sampledCount > 0) {
            metadata.setNdviMean(sumNdvi / sampledCount);
            metadata.setMndwiMean(sumMndwi / sampledCount);
            metadata.setNdbiMean(sumNdbi / sampledCount);
            metadata.setWaterCoveragePct((double) waterPixels / sampledCount * 100.0);
            metadata.setVegCoveragePct((double) vegPixels / sampledCount * 100.0);
            metadata.setBuiltCoveragePct((double) builtPixels / sampledCount * 100.0);
        }
    }

    public double calculateSpatialOverlapRatio(GeoRasterMetadata meta1, GeoRasterMetadata meta2) {
        if (meta1 == null || meta2 == null) return 1.0;

        double interMinLon = Math.max(meta1.getMinLon(), meta2.getMinLon());
        double interMinLat = Math.max(meta1.getMinLat(), meta2.getMinLat());
        double interMaxLon = Math.min(meta1.getMaxLon(), meta2.getMaxLon());
        double interMaxLat = Math.min(meta1.getMaxLat(), meta2.getMaxLat());

        if (interMinLon >= interMaxLon || interMinLat >= interMaxLat) {
            return 0.0; // No spatial intersection
        }

        double interArea = (interMaxLon - interMinLon) * (interMaxLat - interMinLat);
        double area1 = (meta1.getMaxLon() - meta1.getMinLon()) * (meta1.getMaxLat() - meta1.getMinLat());
        double area2 = (meta2.getMaxLon() - meta2.getMinLon()) * (meta2.getMaxLat() - meta2.getMinLat());

        double minArea = Math.min(area1, area2);
        return minArea > 0 ? (interArea / minArea) : 0.0;
    }

    public boolean isCrsCompatible(String crs1, String crs2) {
        if (crs1 == null || crs2 == null) return true;
        String norm1 = crs1.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String norm2 = crs2.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return norm1.equals(norm2) || (norm1.contains("4326") && norm2.contains("4326"));
    }
}
