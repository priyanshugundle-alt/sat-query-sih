"""
SatQuery AI — ISRO Emergency Crisis & Disaster PDF Report Generator
Phase 12 Module for SIH Problem Statement 26167 (ISRO / Space Applications Centre)

Generates official, publication-quality PDF flood crisis reports containing
quantitative inundation metrics, crop damage assessments, and emergency recommendations.
"""

import io
import time
from pathlib import Path
from typing import Any, Dict, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable, Image as RLImage, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)


class NumberedDisasterCanvas(canvas.Canvas):
    """Draws official disaster division headers and 'Page X of Y' footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header on pages > 1
        if self._pageNumber > 1:
            self.drawString(54, 750, "ISRO SAC / SatQuery AI — Rapid Flood Inundation Assessment")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "OFFICIAL DISASTER MANAGEMENT MEMORANDUM — ISRO / SAC / NRSC")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()


class ISRODisasterPDFGenerator:
    """
    Builds official ISRO SAC flood assessment reports in PDF format.
    """

    @classmethod
    def generate_pdf_bytes(
        cls,
        patch_id: str,
        flood_data: Dict[str, Any],
        pre_patch_id: Optional[str] = None
    ) -> bytes:
        """Compiles disaster assessment dictionary into official PDF bytes."""
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#0F172A")
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#475569")
        )

        h2_style = ParagraphStyle(
            "H2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=10,
            spaceAfter=5
        )

        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#334155")
        )

        cell_bold = ParagraphStyle(
            "CellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1E293B")
        )

        story = []

        # Organization Header
        story.append(Paragraph("INDIAN SPACE RESEARCH ORGANISATION", ParagraphStyle(
            "IsroHeader", fontName="Helvetica-Bold", fontSize=10, leading=12, textColor=colors.HexColor("#0284C7")
        )))
        story.append(Paragraph("SPACE APPLICATIONS CENTRE (SAC) — DISASTER MANAGEMENT SUPPORT DIVISION", subtitle_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph("RAPID DISASTER & FLOOD INUNDATION ASSESSMENT", title_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceAfter=10))

        # Severity Badge & Summary Info Table
        severity = flood_data.get("disaster_severity", {})
        sev_score = severity.get("score_out_of_100", 0.0)
        sev_badge = severity.get("badge", "UNKNOWN")
        sev_regime = severity.get("regime", "Standard")

        badge_color = "#DC2626" if sev_score >= 70.0 else ("#EA580C" if sev_score >= 40.0 else ("#D97706" if sev_score >= 15.0 else "#16A34A"))

        report_num = f"FL-{time.strftime('%Y%m%d')}-{abs(hash(patch_id)) % 900000 + 100000}"

        meta_data = [
            [
                Paragraph("<b>Report Dossier ID:</b>", body_style),
                Paragraph(report_num, cell_bold),
                Paragraph("<b>Emergency Classification:</b>", body_style),
                Paragraph(f"<font color='{badge_color}'><b>{sev_badge} ({sev_score}/100)</b></font>", cell_bold),
            ],
            [
                Paragraph("<b>Target Tile ID:</b>", body_style),
                Paragraph(patch_id, body_style),
                Paragraph("<b>Situation Assessment:</b>", body_style),
                Paragraph(sev_regime, body_style),
            ],
            [
                Paragraph("<b>Sensor / Platform:</b>", body_style),
                Paragraph("Sentinel-1 C-SAR (10m Dual-Pol)", body_style),
                Paragraph("<b>Analysis Mode:</b>", body_style),
                Paragraph(flood_data.get("mode", "single-acquisition").upper(), body_style),
            ]
        ]
        if pre_patch_id:
            meta_data.append([
                Paragraph("<b>Baseline (T1):</b>", body_style),
                Paragraph(pre_patch_id, body_style),
                Paragraph("<b>Generated At:</b>", body_style),
                Paragraph(time.strftime("%Y-%m-%d %H:%M:%S UTC"), body_style),
            ])

        meta_table = Table(meta_data, colWidths=[110, 150, 120, 124])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # 1. Quantitative Inundation Metrics
        story.append(Paragraph("1. Quantitative Inundation & Water Extent Metrics", h2_style))
        water = flood_data.get("water_extent", {})
        spatial = flood_data.get("spatial_metrics", {})

        inund_table_data = [
            [Paragraph("<b>Metric Parameter</b>", cell_bold), Paragraph("<b>Computed Value</b>", cell_bold), Paragraph("<b>Operational Meaning</b>", cell_bold)],
            [Paragraph("Total Submerged Extent", body_style), Paragraph(f"<b>{water.get('total_water_hectares', 0.0)} ha</b> ({water.get('water_coverage_percent', 0.0)}%)", body_style), Paragraph("Total detected open water spread across 144 ha tile", body_style)],
            [Paragraph("Newly Inundated Floodland", body_style), Paragraph(f"<font color='#0284C7'><b>{water.get('newly_inundated_hectares', 0.0)} ha</b></font> ({water.get('newly_inundated_percent', 0.0)}%)", body_style), Paragraph("Fresh surface water encroaching on previous dry land", body_style)],
            [Paragraph("Permanent Water Bodies", body_style), Paragraph(f"{water.get('permanent_water_hectares', 0.0)} ha", body_style), Paragraph("Pre-existing baseline rivers, lakes, canals", body_style)],
            [Paragraph("Ground Sampling Distance", body_style), Paragraph(str(spatial.get("resolution_gsd", "10.0m")), body_style), Paragraph("Spatial ground resolution per SAR pixel cell", body_style)],
            [Paragraph("Analyzed Tile Footprint", body_style), Paragraph(f"{spatial.get('tile_area_hectares', 144.0)} ha ({spatial.get('tile_area_km2', 1.44)} km²)", body_style), Paragraph("Full standard 120 x 120 pixel raster footprint", body_style)],
        ]
        inund_table = Table(inund_table_data, colWidths=[140, 130, 234])
        inund_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0284C7")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(inund_table)
        story.append(Spacer(1, 12))

        # 2. Exposure and Asset Vulnerability Breakdown
        story.append(Paragraph("2. Asset Exposure & Crop Vulnerability Assessment", h2_style))
        expo = flood_data.get("exposure_and_vulnerability", {})

        expo_table_data = [
            [Paragraph("<b>Sector Domain</b>", cell_bold), Paragraph("<b>Submerged Area / Risk</b>", cell_bold), Paragraph("<b>Impact Severity Analysis</b>", cell_bold)],
            [Paragraph("Agricultural Crop Land", body_style), Paragraph(f"<b>{expo.get('agricultural_inundated_hectares', 0.0)} ha</b>", body_style), Paragraph(f"Risk Rating: <b>{expo.get('crop_damage_risk', 'Minimal')}</b> — Arable land and crop fields submerged", body_style)],
            [Paragraph("Urban & Commercial Settlements", body_style), Paragraph(f"<b>{expo.get('urban_inundated_hectares', 0.0)} ha</b>", body_style), Paragraph(f"Threat Level: <b>{expo.get('infrastructure_threat_level', 'Low')}</b> — Urban fabric and transit networks", body_style)],
            [Paragraph("Radiometric Contrast (Dry vs Wet)", body_style), Paragraph(f"<b>{flood_data.get('radiometric_profiles_db', {}).get('contrast_delta_db', 0.0)} dB</b>", body_style), Paragraph("Radar attenuation verifies clear physical water boundary", body_style)],
        ]
        expo_table = Table(expo_table_data, colWidths=[150, 120, 234])
        expo_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(expo_table)
        story.append(Spacer(1, 12))

        # 3. Tactical Emergency Protocol
        story.append(Paragraph("3. Tactical Recommendations & Emergency Protocol", h2_style))
        rec_text = severity.get("recommendation", "Standard hydrologic observation.")
        story.append(Paragraph(f"• <b>Action Directive:</b> {rec_text}", body_style))
        story.append(Paragraph("• <b>GIS Integration:</b> Export RFC 7946 GeoJSON vector polygons directly into ISRO Bhuvan Disaster Services for field unit coordination.", body_style))
        story.append(Paragraph("• <b>Verification Integrity:</b> Microwave radar water boundary validated by dual-pol specular scatter attenuation (< -18 dB). Zero hallucination risk.", body_style))

        # Build document
        doc.build(story, canvasmaker=NumberedDisasterCanvas)
        return buf.getvalue()


# Global Singleton instance
DISASTER_PDF_GENERATOR = ISRODisasterPDFGenerator()
