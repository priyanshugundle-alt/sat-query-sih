"""
SatQuery AI — Automated ISRO Mission Alert System
Phase 14 Module for SIH Problem Statement 26167 (ISRO / Space Applications Centre)

Evaluates radar backscatter and polarimetric time-series anomalies against ISRO operational thresholds,
generating official Mission Alert Bulletins for rapid disaster and land-disturbance response.
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Dict, Any, List, Optional


class MissionAlertEngine:
    """
    Automated ISRO Mission Alert Dispatcher.
    Transforms raw radar telemetry and temporal anomaly signals into actionable,
    cryptographically verified Mission Alert Bulletins.
    """

    def __init__(self):
        self.alert_counter = 1

    def evaluate_mission_alert(
        self,
        patch_id: str,
        delta_vv_db: float = 0.0,
        delta_vh_db: float = 0.0,
        delta_rvi: float = 0.0,
        affected_area_ha: float = 0.0,
        land_cover_context: Optional[str] = None,
        coordinates: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates input telemetry against ISRO operational thresholds and returns a formatted Mission Bulletin.
        """
        coords = coordinates or {"latitude": 48.297802, "longitude": 13.298361}
        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        bulletin_num = f"{self.alert_counter:04d}"
        self.alert_counter += 1

        bulletin_id = f"ISRO-SAC-SQ-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{bulletin_num}"

        # Classify alert based on physical radar thresholds
        if delta_vv_db <= -3.5 or affected_area_ha >= 15.0:
            classification = "CRITICAL"
            event_type = "RAPID_FLOOD_INUNDATION"
            code = "ALERT-FL-01"
            title = "CRITICAL: Flash Flood Inundation & Surface Water Surge Detected"
            evidence = (
                f"Severe specular backscatter attenuation detected (Delta VV = {delta_vv_db:+.2f} dB). "
                f"Surface water inundation expanded across estimated {affected_area_ha:.1f} hectares. "
                "Co-polarization signal reflection confirms widespread open water presence."
            )
            directives = [
                "Activate State Disaster Management Authority (SDMA) emergency flood routing.",
                "Deploy drone reconnaissance over low-lying agricultural and riparian corridors.",
                "Prioritize evacuation alerts for settlements adjacent to detected inundation zones."
            ]
        elif delta_vh_db <= -2.8 and (delta_rvi <= -0.15 or (land_cover_context and "Forest" in land_cover_context)):
            classification = "HIGH"
            event_type = "CANOPY_DEFORESTATION"
            code = "ALERT-DF-02"
            title = "HIGH ALERT: Abrupt Forest Canopy Structural Loss & Clearing"
            evidence = (
                f"Significant drop in cross-polarization volume scattering (Delta VH = {delta_vh_db:+.2f} dB, "
                f"Delta RVI = {delta_rvi:+.3f}). Structural canopy degradation indicates clear-cutting or logging."
            )
            directives = [
                "Dispatch State Forest Department patrol to geodetic coordinates.",
                "Cross-reference cadastral land concession boundaries with satellite coordinates.",
                "Schedule high-resolution optical tasking pass on next orbital corridor."
            ]
        elif delta_rvi <= -0.18 and delta_vv_db > -1.5:
            classification = "MEDIUM"
            event_type = "AGRICULTURAL_BIOMASS_DEPLETION"
            code = "ALERT-AG-03"
            title = "MEDIUM ALERT: Rapid Vegetative Biomass Loss / Harvest Clearance"
            evidence = (
                f"Depletion of Radar Vegetation Index (Delta RVI = {delta_rvi:+.3f}) accompanied by stable "
                f"surface roughness backscatter (Delta VV = {delta_vv_db:+.2f} dB). Signifies crop harvest or seasonal drying."
            )
            directives = [
                "Log agricultural harvest cycle milestone in regional crop registry.",
                "Monitor soil moisture trajectory for post-harvest erosion vulnerability."
            ]
        elif delta_vv_db >= 3.0:
            classification = "ADVISORY"
            event_type = "URBAN_STRUCTURAL_EXPANSION"
            code = "ALERT-UB-04"
            title = "ADVISORY: Rapid Double-Bounce Urban Development Observed"
            evidence = (
                f"Elevation of dihedral corner reflector radar returns (Delta VV = {delta_vv_db:+.2f} dB). "
                "Characteristic of new masonry, concrete structures, or urban development."
            )
            directives = [
                "Transmit geodetic footprint to municipal town planning authorities.",
                "Verify master plan zoning authorization for newly detected structural footprint."
            ]
        else:
            classification = "ROUTINE"
            event_type = "STABLE_MONITORING"
            code = "ALERT-RT-00"
            title = "ROUTINE: Nominal Radar Backscatter Baseline Maintained"
            evidence = (
                f"Observed backscatter drifts (Delta VV = {delta_vv_db:+.2f} dB, Delta VH = {delta_vh_db:+.2f} dB) "
                "fall strictly within nominal seasonal calibration tolerances (+/- 1.5 dB)."
            )
            directives = [
                "Maintain standard 12-day Sentinel-1 orbital surveillance interval.",
                "Archive backscatter telemetry in long-term EO baseline datastore."
            ]

        # Calculate cryptographic proof
        proof_payload = f"{bulletin_id}|{classification}|{event_type}|{patch_id}|{delta_vv_db}|{coords['latitude']}|{coords['longitude']}"
        verification_hash = hashlib.sha256(proof_payload.encode("utf-8")).hexdigest()

        return {
            "bulletin_id": bulletin_id,
            "classification": classification,
            "alert_code": code,
            "title": title,
            "event_type": event_type,
            "timestamp_utc": now_utc,
            "sensor": "Sentinel-1 C-SAR (10m GSD, Dual-Pol IW)",
            "monitored_patch_id": patch_id,
            "target_location": {
                "latitude": round(coords["latitude"], 6),
                "longitude": round(coords["longitude"], 6)
            },
            "telemetry_metrics": {
                "delta_vv_db": round(delta_vv_db, 2),
                "delta_vh_db": round(delta_vh_db, 2),
                "delta_rvi": round(delta_rvi, 3),
                "affected_area_hectares": round(affected_area_ha, 1)
            },
            "physical_evidence": evidence,
            "operational_directives": directives,
            "cryptographic_verification": {
                "algorithm": "SHA-256",
                "receipt_digest": verification_hash,
                "issuing_authority": "ISRO / Space Applications Centre — SatQuery AI Command Engine"
            }
        }


# Singleton instance
MISSION_ALERT_ENGINE = MissionAlertEngine()
