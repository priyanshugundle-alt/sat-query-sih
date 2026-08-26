package com.satquery.persistence;

import com.satquery.database.DatabaseManager;
import com.satquery.model.ImageAsset;
import com.satquery.model.ImageMetadata;
import java.sql.*;
import java.time.Instant;

public class ImageAssetRepository {

    public void save(ImageAsset asset) {
        String sql = "INSERT OR REPLACE INTO image_assets (image_id, query_id, file_name, file_path, file_format, " +
                "file_size_bytes, width, height, band_count, modality, acquisition_date, crs, bounding_box, " +
                "georeferenced, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, asset.getImageId());
            pstmt.setString(2, "UNASSIGNED"); // Default to placeholder during raw upload
            pstmt.setString(3, asset.getFileName());
            pstmt.setString(4, asset.getFilePath());
            
            ImageMetadata meta = asset.getMetadata();
            if (meta != null) {
                pstmt.setString(5, meta.getFormat());
                pstmt.setLong(6, 1024L * 1024L); // 1MB mock size
                pstmt.setInt(7, meta.getWidth());
                pstmt.setInt(8, meta.getHeight());
                pstmt.setInt(9, meta.getBandCount() != null ? meta.getBandCount() : 3);
                pstmt.setString(10, meta.getModality());
                pstmt.setString(11, meta.getAcquisitionDate());
                pstmt.setString(12, meta.getCrs());
                pstmt.setString(13, meta.getBoundingBox());
                pstmt.setInt(14, meta.isGeoreferenced() ? 1 : 0);
            } else {
                pstmt.setNull(5, Types.VARCHAR);
                pstmt.setLong(6, 0L);
                pstmt.setInt(7, 0);
                pstmt.setInt(8, 0);
                pstmt.setInt(9, 3);
                pstmt.setNull(10, Types.VARCHAR);
                pstmt.setNull(11, Types.VARCHAR);
                pstmt.setNull(12, Types.VARCHAR);
                pstmt.setNull(13, Types.VARCHAR);
                pstmt.setInt(14, 0);
            }
            pstmt.setString(15, Instant.now().toString());
            
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error saving image asset: " + e.getMessage());
        }
    }

    public ImageAsset findById(String imageId) {
        String sql = "SELECT * FROM image_assets WHERE image_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, imageId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    ImageMetadata meta = new ImageMetadata(
                            rs.getString("file_format"),
                            rs.getInt("width"),
                            rs.getInt("height"),
                            rs.getInt("band_count"),
                            rs.getString("modality"),
                            rs.getString("acquisition_date"),
                            rs.getString("crs"),
                            rs.getString("bounding_box"),
                            rs.getInt("georeferenced") == 1
                    );
                    return new ImageAsset(
                            rs.getString("image_id"),
                            rs.getString("file_name"),
                            rs.getString("file_path"),
                            meta
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error retrieving image asset: " + e.getMessage());
        }
        return null;
    }
}
