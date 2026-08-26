# Java Dependency Source Notes

## Jackson

Source: https://github.com/FasterXML/jackson

Jackson is a Java JSON processing suite with streaming and data-binding support. For SatQuery, use `jackson-databind` to map React/Java/model-endpoint JSON to Java domain classes. The project recommends Maven Central and documents 2.x and 3.x lines; choose one compatible line and use a BOM or consistent versions.

## SQLite JDBC

Source: https://github.com/xerial/sqlite-jdbc

Xerial SQLite JDBC is a Java JDBC driver that creates and accesses SQLite database files. It publishes the `org.xerial:sqlite-jdbc` dependency and packages native libraries for major operating systems. For SatQuery, Java uses it to persist request history, trace events, evidence references, and report metadata.

## GeoTools GeoTIFF

Source: https://docs.geotools.org/latest/userguide/library/coverage/geotiff.html

GeoTools `gt-geotiff` reads GeoTIFF and can expose coordinate reference system, envelope, and rendered image data. For SatQuery it is an optional but valuable dependency for normal GeoTIFF/TIFF metadata validation, including CRS and spatial coverage checks.

## Apache PDFBox

Source: https://pdfbox.apache.org/

Apache PDFBox creates and manipulates PDF documents. For SatQuery it can generate a human-readable Analysis Receipt after the structured JSON report is already produced.
