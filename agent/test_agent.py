"""
SatQuery AI — Comprehensive Unit Test Suite for Phase 5 Central AI Agent
Tests intent parsing, specialist tool routing (Model A vs Change Detector),
Geo-Validity rejection of invalid inputs, evidence verification, and audit receipts.
"""

import sys
import time
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from agent.orchestrator import SatQueryAgent
from agent.config import TaskIntent, UncertaintyLevel


def test_central_agent_suite():
    print("=" * 70)
    print("SATQUERY AI — PHASE 5: CENTRAL AI AGENT ORCHESTRATION TESTS")
    print("=" * 70)

    agent = SatQueryAgent()

    # 1. Intent Parsing Tests
    print("\n[1/5] Testing Natural Language Intent Parsing...")
    intent_1 = agent.parse_intent("What type of land cover or vegetation is present in this SAR image?")
    intent_2 = agent.parse_intent("Detect temporal changes between these two satellite captures over time.")
    intent_3 = agent.parse_intent("Extract the 512-dimensional semantic feature embedding vector.")
    intent_4 = agent.parse_intent("Validate the raster coordinate reference system and metadata integrity.")

    assert intent_1 == TaskIntent.SAR_CLASSIFICATION, f"Expected SAR_CLASSIFICATION, got {intent_1}"
    assert intent_2 == TaskIntent.CHANGE_DETECTION, f"Expected CHANGE_DETECTION, got {intent_2}"
    assert intent_3 == TaskIntent.SAR_FEATURE_EXTRACTION, f"Expected SAR_FEATURE_EXTRACTION, got {intent_3}"
    assert intent_4 == TaskIntent.GEO_VALIDATION_ONLY, f"Expected GEO_VALIDATION_ONLY, got {intent_4}"
    print("      Intent classification for 4 distinct query types — PASS")

    # 2. Model A Routing Test
    print("\n[2/5] Testing Model A Routing (Land Cover Query on Real Patch)...")
    sample_patch_dir = Path(r"D:\SIH\BigEarthNet-S1\S1A_IW_GRDH_1SDV_20170613T165043\S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39")
    vh_file = sample_patch_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39_VH.tif"
    vv_file = sample_patch_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39_VV.tif"

    response = agent.process_query(
        query="What is the primary land-cover type in this Sentinel-1 acquisition?",
        vh_path=vh_file,
        vv_path=vv_file
    )
    print(f"      Selected Specialist: {response['selected_model']}")
    print(f"      Uncertainty Level:   {response['uncertainty_level']}")
    print(f"      Agent Answer:        {response['answer']}")
    print(f"      Audit Receipt ID:    {response['audit_receipt_id']}")

    assert response["selected_model"] == "Model-A-ResNet18-SAR", "Agent failed to route to Model A!"
    assert response["audit_receipt_id"].startswith("SQ-"), "Receipt ID format invalid!"
    print("      Model A Routing & Answer Synthesis — PASS")

    # 3. Bi-Temporal Change Detection Routing Test
    print("\n[3/5] Testing Bi-Temporal Change Detection Routing...")
    patch_2_dir = Path(r"D:\SIH\BigEarthNet-S1\S1A_IW_GRDH_1SDV_20170613T165043\S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40")
    t2_vh = patch_2_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40_VH.tif"
    t2_vv = patch_2_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40_VV.tif"

    change_response = agent.process_query(
        query="Compare these two dates and detect if any land use change occurred.",
        vh_path=vh_file,
        vv_path=vv_file,
        t2_vh_path=t2_vh,
        t2_vv_path=t2_vv
    )
    print(f"      Selected Specialist: {change_response['selected_model']}")
    print(f"      Agent Change Output: {change_response['answer']}")
    print(f"      Total Latency:       {change_response['total_latency_ms']} ms")

    assert change_response["selected_model"] == "SARChangeDetector", "Agent failed to route to Change Detector!"
    print("      Change Detector Routing — PASS")

    # 4. Geo-Validity Gate Rejection Test (Corrupted / Incompatible inputs)
    print("\n[4/5] Testing Geo-Validity Gate Rejection of Invalid Rasters...")
    invalid_response = agent.process_query(
        query="Classify this image",
        vh_path=Path("D:/SIH/non_existent_band.tif"),
        vv_path=vv_file
    )
    print(f"      Rejection Output:    {invalid_response['answer']}")
    print(f"      Uncertainty Status:  {invalid_response['uncertainty_level']}")

    assert invalid_response["uncertainty_level"] == UncertaintyLevel.INSUFFICIENT_EVIDENCE.value
    assert "rejected by Geo-Validity Gate" in invalid_response["answer"]
    print("      Geo-Validity Gate Rejection — PASS")

    # 5. Audit Receipt Persistence Check
    print("\n[5/5] Testing Audit Trace Persistence on Disk...")
    receipt_dir = agent.config.audit_log_dir
    receipt_files = list(receipt_dir.glob("receipt_*.json"))
    assert len(receipt_files) >= 3, "Audit receipts were not written to disk!"
    print(f"      Verified {len(receipt_files)} audit receipts saved in {receipt_dir} — PASS")

    print("\n" + "=" * 70)
    print("ALL PHASE 5 CENTRAL AI AGENT ORCHESTRATION TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_central_agent_suite()
