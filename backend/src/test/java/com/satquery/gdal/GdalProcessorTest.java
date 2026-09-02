package com.satquery.gdal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;

import static org.junit.jupiter.api.Assertions.*;

public class GdalProcessorTest {

    private GdalProcessor processor;

    @BeforeEach
    public void setUp() {
        processor = new GdalProcessor();
    }

    @Test
    public void testInspectFallbackForMissingFile() {
        GeoRasterMetadata meta = processor.inspect(new File("non_existent_file.tif"));
        assertNotNull(meta);
        assertEquals(1024, meta.getWidth());
        assertEquals(1024, meta.getHeight());
        assertNotNull(meta.getBoundingBox());
    }

    @Test
    public void testCalculateSpatialOverlapRatioFullOverlap() {
        GeoRasterMetadata m1 = new GeoRasterMetadata();
        m1.setMinLon(72.80);
        m1.setMinLat(18.90);
        m1.setMaxLon(72.90);
        m1.setMaxLat(19.00);

        GeoRasterMetadata m2 = new GeoRasterMetadata();
        m2.setMinLon(72.80);
        m2.setMinLat(18.90);
        m2.setMaxLon(72.90);
        m2.setMaxLat(19.00);

        double overlap = processor.calculateSpatialOverlapRatio(m1, m2);
        assertEquals(1.0, overlap, 0.001);
    }

    @Test
    public void testCalculateSpatialOverlapRatioZeroOverlap() {
        GeoRasterMetadata m1 = new GeoRasterMetadata();
        m1.setMinLon(10.0);
        m1.setMinLat(10.0);
        m1.setMaxLon(11.0);
        m1.setMaxLat(11.0);

        GeoRasterMetadata m2 = new GeoRasterMetadata();
        m2.setMinLon(50.0);
        m2.setMinLat(50.0);
        m2.setMaxLon(51.0);
        m2.setMaxLat(51.0);

        double overlap = processor.calculateSpatialOverlapRatio(m1, m2);
        assertEquals(0.0, overlap, 0.001);
    }

    @Test
    public void testCalculateSpatialOverlapRatioPartialOverlap() {
        GeoRasterMetadata m1 = new GeoRasterMetadata();
        m1.setMinLon(0.0);
        m1.setMinLat(0.0);
        m1.setMaxLon(10.0);
        m1.setMaxLat(10.0);

        GeoRasterMetadata m2 = new GeoRasterMetadata();
        m2.setMinLon(5.0);
        m2.setMinLat(5.0);
        m2.setMaxLon(15.0);
        m2.setMaxLat(15.0);

        double overlap = processor.calculateSpatialOverlapRatio(m1, m2);
        assertTrue(overlap > 0.0 && overlap < 1.0);
    }

    @Test
    public void testIsCrsCompatible() {
        assertTrue(processor.isCrsCompatible("EPSG:4326 (WGS 84)", "EPSG:4326"));
        assertTrue(processor.isCrsCompatible("EPSG:32643", "EPSG:32643"));
        assertFalse(processor.isCrsCompatible("EPSG:4326", "EPSG:3857"));
    }
}
