"""
SatQuery AI — API Request and Response Schemas
Pydantic data models for REST endpoints.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="API operational status")
    version: str = Field("1.0.0", description="SatQuery AI API version")
    device: str = Field(..., description="PyTorch compute device (cuda / cpu)")
    device_name: Optional[str] = Field(None, description="GPU device name if available")
    model_a_loaded: bool = Field(..., description="Whether Model A ResNet-18 is loaded")
    model_a_checkpoint: Optional[str] = Field(None, description="Active checkpoint path")
    encoder_loaded: bool = Field(..., description="Whether SAR Feature Encoder is loaded")
    dataset_found: bool = Field(..., description="Whether BigEarthNet-S1 dataset was found")
    dataset_path: str = Field(..., description="Path to dataset directory")


class GeoCheckItem(BaseModel):
    name: str
    passed: bool
    details: Optional[Dict[str, Any]] = None


class GeoValidityDetail(BaseModel):
    status: str
    checks: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None


class QueryResponse(BaseModel):
    answer: str = Field(..., description="Synthesized AI response to user query")
    intent: str = Field(..., description="Parsed task intent (e.g. sar_classification, change_detection)")
    selected_model: str = Field(..., description="Specialist model routed to handle query")
    uncertainty_level: str = Field(..., description="Evidence rating: Verified, Likely, Uncertain, Insufficient Evidence")
    confidence: float = Field(..., description="Confidence score [0.0 - 1.0]")
    evidence_claims: List[Dict[str, Any]] = Field(default_factory=list, description="Ground-truth mapped physical evidence claims")
    audit_receipt_id: str = Field(..., description="Deterministic audit receipt identifier (SQ-YYYYMMDD-XXXXXX)")
    total_latency_ms: float = Field(..., description="Total execution time in milliseconds")
    model_raw_output: Optional[Dict[str, Any]] = Field(None, description="Raw specialist model outputs")


class ChangeDetectionResponse(BaseModel):
    task: str = Field("bi_temporal_change_detection", description="Task identifier")
    has_changed: bool = Field(..., description="Whether significant change was detected")
    semantic_similarity: float = Field(..., description="Cosine similarity between T1 and T2 512-dim embeddings")
    changed_surface_percentage: float = Field(..., description="Percentage of pixels exceeding amplitude change threshold")
    change_severity: str = Field(..., description="Severity level: None/Minimal, Moderate, High")
    mean_backscatter_delta_db: float = Field(..., description="Mean absolute backscatter amplitude change across VH & VV")
    confidence: float = Field(..., description="Confidence score")
    explanation: str = Field(..., description="Natural language interpretation of detected bi-temporal changes")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Detailed sensor evidence breakdown")
    processing_time_ms: Optional[float] = Field(None, description="Execution time in milliseconds")


class EncodeResponse(BaseModel):
    embedding_dim: int = Field(512, description="Dimension of output feature embedding")
    l2_norm: float = Field(1.0, description="L2 norm of the unit-normalized embedding vector")
    embedding: List[float] = Field(..., description="512-dimensional floating point feature vector")
    processing_time_ms: float = Field(..., description="Execution time in milliseconds")


class PatchSample(BaseModel):
    patch_id: str = Field(..., description="Unique patch name (e.g. S1A_IW_GRDH_1SDV_2017..._patch_0_0)")
    acquisition: str = Field(..., description="Sentinel-1 acquisition ID")
    vh_path: str = Field(..., description="Path to VH GeoTIFF")
    vv_path: str = Field(..., description="Path to VV GeoTIFF")
    labels: List[str] = Field(default_factory=list, description="Ground truth CORINE land cover labels")


class PatchSamplesResponse(BaseModel):
    total_available: int = Field(..., description="Total number of patches discovered in BigEarthNet-S1")
    samples: List[PatchSample] = Field(..., description="List of sample patches for testing and UI display")


class ReceiptSummary(BaseModel):
    receipt_id: str
    timestamp: str
    query: str
    intent: str
    selected_model: str
    uncertainty_level: str
    confidence: float
    elapsed_ms: float


class ReceiptsListResponse(BaseModel):
    total_receipts: int
    receipts: List[ReceiptSummary]


class MultiModalQueryResponse(BaseModel):
    answer: str = Field(..., description="Synthesized cross-sensor AI answer")
    fused_answer: str = Field(..., description="Detailed multi-modal joint fusion narrative")
    sar_answer: str = Field(..., description="SAR-only specialist answer (Model A)")
    optical_answer: str = Field(..., description="Optical-only specialist answer (Model B)")
    joint_confidence: float = Field(..., description="Fused cross-sensor confidence score [0.0 - 1.0]")
    sar_confidence: float = Field(..., description="Model A SAR specialist confidence")
    optical_confidence: float = Field(..., description="Model B optical specialist confidence")
    consensus_classes: List[str] = Field(default_factory=list, description="Land-cover classes confirmed by both sensors")
    cross_sensor_proof: List[Dict[str, Any]] = Field(default_factory=list, description="Physical cross-sensor corroboration evidence")
    sensor_fusion_meta: Dict[str, Any] = Field(default_factory=dict, description="Fusion engine metadata")
    audit_receipt_id: str = Field(..., description="Audit trail identifier")
    total_latency_ms: float = Field(..., description="End-to-end processing time in milliseconds")


class DemoPreset(BaseModel):
    id: str = Field(..., description="Unique preset identifier")
    name: str = Field(..., description="Human-readable preset title")
    description: str = Field(..., description="Full scenario description for the judge")
    query: str = Field(..., description="Natural language query to submit")
    category: str = Field(..., description="Preset category: SAR, Change, Multimodal, Encoding")
    endpoint: str = Field(..., description="API endpoint path")
    badge: str = Field(..., description="Visual badge text (e.g. ISRO Demo, SIH Judge)")


class DemoPresetsResponse(BaseModel):
    total: int
    presets: List[DemoPreset]


class SessionTurnSchema(BaseModel):
    turn_index: int
    query: str
    answer: str
    intent: str
    selected_model: str
    confidence: float
    uncertainty_level: str
    audit_receipt_id: str
    latency_ms: float
    timestamp: float


class SessionInfoResponse(BaseModel):
    session_id: str = Field(..., description="Unique session identifier (UUID)")
    created_at: float = Field(..., description="Unix timestamp session was created")
    last_active: float = Field(..., description="Unix timestamp of last activity")
    total_queries: int = Field(..., description="Number of queries in this session")
    last_intent: str = Field(..., description="Intent of the last query")
    last_confidence: float = Field(..., description="Confidence score of last result")
    last_patch_id: Optional[str] = Field(None, description="Last SAR patch used (retained for follow-ups)")
    turns: List[SessionTurnSchema] = Field(default_factory=list, description="Full conversation history")


class SessionListResponse(BaseModel):
    active_sessions: int
    sessions: List[Dict[str, Any]]


class BenchmarkMetric(BaseModel):
    name: str
    value: Any
    unit: str = ""
    status: str = "ok"  # "ok", "warn", "fail"


class BenchmarkResponse(BaseModel):
    run_id: str = Field(..., description="Unique benchmark run identifier")
    timestamp: str = Field(..., description="ISO timestamp of benchmark run")
    num_patches_evaluated: int
    total_duration_sec: float
    metrics: List[BenchmarkMetric] = Field(default_factory=list)
    category_results: Dict[str, Any] = Field(default_factory=dict)
    passed: bool = Field(..., description="Overall pass/fail based on minimum thresholds")
    html_report_url: str = Field("/api/benchmark/report", description="URL to styled HTML report")


# ==========================================
# PHASE 9 SCHEMAS: VECTOR SEARCH & EXPLAINABILITY
# ==========================================

class SimilarPatchItem(BaseModel):
    patch_id: str = Field(..., description="Patch identifier")
    similarity: float = Field(..., description="Cosine similarity score [0.0 - 1.0]")
    similarity_pct: float = Field(..., description="Similarity match percentage")
    acquisition: str = Field(..., description="Sentinel-1 acquisition name")
    labels: List[str] = Field(default_factory=list, description="CORINE ground truth land-cover labels")
    preview_url: str = Field(..., description="Relative URL to 3-channel preview PNG")
    matched_classes: Optional[List[str]] = Field(None, description="Matched target classes if queried by class")


class VectorSearchResponse(BaseModel):
    query_patch_id: Optional[str] = None
    total_results: int
    search_time_ms: float
    results: List[SimilarPatchItem]


class SearchStatsResponse(BaseModel):
    total_indexed_vectors: int
    embedding_dimension: int
    device: str
    build_time_sec: float
    cached_on_disk: bool


class SaliencyMetaResponse(BaseModel):
    patch_id: str
    target_class: str
    confidence: float
    saliency_png_url: str


# ==========================================
# PHASE 10 SCHEMAS: GEOSPATIAL ROI & DOSSIER
# ==========================================

class ROIAnalysisRequest(BaseModel):
    patch_id: Optional[str] = Field(None, description="Known patch ID to analyze")
    bbox: List[int] = Field(..., description="[x1, y1, x2, y2] bounding box on 120x120 raster grid")
    t2_patch_id: Optional[str] = Field(None, description="Optional T2 patch ID for temporal change delta")


class BBoxPixels(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    width: int
    height: int


class SpatialMetrics(BaseModel):
    pixel_count: int
    resolution_m: float
    area_m2: float
    area_hectares: float


class PolarizationStats(BaseModel):
    mean: float
    std: float
    min: float
    max: float


class SurfaceRoughness(BaseModel):
    regime: str
    description: str
    mechanism: str
    roughness_index: float


class DielectricMoisture(BaseModel):
    moisture_index: float
    moisture_level: str
    interpretation: str


class TemporalChangeROI(BaseModel):
    delta_vh_db: float
    delta_vv_db: float
    significant_change: bool
    change_direction: str


class ROIAnalysisResponse(BaseModel):
    status: str = "success"
    patch_id: Optional[str] = None
    bbox_pixels: BBoxPixels
    spatial_metrics: SpatialMetrics
    polarization_vh_db: PolarizationStats
    polarization_vv_db: PolarizationStats
    cross_polarization_ratio_db: float
    surface_roughness: SurfaceRoughness
    dielectric_moisture_proxy: DielectricMoisture
    temporal_change: Optional[TemporalChangeROI] = None


class DossierExportResponse(BaseModel):
    status: str
    zip_path: str
    filename: str
    size_bytes: int
    size_mb: float
    generated_at: str
    included_artifacts: List[Dict[str, Any]]


# ==========================================
# PHASE 11 SCHEMAS: GIS GEOJSON & MODEL REGISTRY
# ==========================================

class GeoJSONExportResponse(BaseModel):
    type: str = "FeatureCollection"
    name: str
    crs: Dict[str, Any]
    features: List[Dict[str, Any]]


class ModelModeRequest(BaseModel):
    mode: str = Field(..., description="'sar_only', 'optical_only', or 'joint_fusion'")


class ModelModeResponse(BaseModel):
    status: str = "success"
    active_mode: str
    description: str
    message: Optional[str] = None


class ModelRegisterRequest(BaseModel):
    model_id: str = Field(..., description="Unique model identifier, e.g. 'model_b_resnet50'")
    display_name: str = Field(..., description="Human-readable model name")
    checkpoint_path: str = Field(..., description="Absolute path to .pt / .pth checkpoint")
    modality: str = Field("Optical (Sentinel-2)", description="Sensor modality")
    architecture: str = Field("Custom Model", description="Model architecture")


class ModelRegistryStatusResponse(BaseModel):
    active_mode: str
    available_modes: List[str]
    registered_models: Dict[str, Any]
    joint_vector_dimension: int
    device: str
    gpu_name: str


# ==========================================
# PHASE 12 SCHEMAS: DISASTER & FLOOD INUNDATION
# ==========================================

class FloodAnalysisRequest(BaseModel):
    patch_id: str = Field(..., description="Post-flood crisis patch ID")
    pre_patch_id: Optional[str] = Field(None, description="Optional pre-flood baseline patch ID for bi-temporal delta")
    vv_threshold_db: Optional[float] = Field(-18.0, description="VV decibel water cutoff threshold (default: -18.0 dB)")


class FloodAnalysisResponse(BaseModel):
    status: str = "success"
    patch_id: str
    pre_patch_id: Optional[str] = None
    mode: str
    thresholds_used_db: Dict[str, Any]
    spatial_metrics: Dict[str, Any]
    water_extent: Dict[str, Any]
    exposure_and_vulnerability: Dict[str, Any]
    disaster_severity: Dict[str, Any]
    radiometric_profiles_db: Dict[str, Any]


# ==========================================
# PHASE 13 SCHEMAS: AOI STRIP MOSAIC & EDGE OPTIMIZER
# ==========================================

class MosaicRequest(BaseModel):
    patch_ids: List[str] = Field(..., min_items=1, description="List of patch IDs to stitch into mosaic")


class MosaicResponse(BaseModel):
    status: str = "success"
    total_tiles: int
    tile_ids: List[str]
    mosaic_dimensions: Dict[str, Any]
    spatial_envelope_wgs84: Dict[str, Any]
    regional_analytics: Dict[str, Any]
    preview_url: str


class EdgeBenchmarkRequest(BaseModel):
    iterations: int = Field(25, ge=5, le=100, description="Benchmark inference iterations")


class EdgeBenchmarkResponse(BaseModel):
    status: str = "success"
    iterations_tested: int
    target_hardware: str
    model_architecture: str
    parameter_count: int
    memory_footprint: Dict[str, Any]
    inference_latency_ms: Dict[str, Any]
    edge_readiness: Dict[str, Any]


class EdgeStatusResponse(BaseModel):
    engine: str
    checkpoint_found: bool
    checkpoint_path: str
    formats_supported: List[str]
    recommended_target: str


# ==========================================
# PHASE 14 SCHEMAS: TIME-SERIES, STAC & MISSION ALERTS
# ==========================================

class TimeSeriesRequest(BaseModel):
    patch_ids: Optional[List[str]] = Field(None, description="Optional list of multi-date patch IDs")
    primary_patch_id: Optional[str] = Field(None, description="Anchor patch ID to synthesize or retrieve trajectory for")


class TimeSeriesResponse(BaseModel):
    status: str = "success"
    total_observations: int
    date_range: Dict[str, Any]
    polarimetric_baseline: Dict[str, Any]
    trajectory_points: List[Dict[str, Any]]
    anomalies_detected: List[Dict[str, Any]]
    trajectory_assessment: Dict[str, Any]


class STACSearchRequest(BaseModel):
    bbox: Optional[List[float]] = Field(None, description="Bounding box [min_lon, min_lat, max_lon, max_lat]")
    datetime: Optional[str] = Field(None, description="ISO datetime or range e.g. 2017-01-01/2018-01-01")
    query: Optional[str] = Field(None, description="Natural language or property query string")
    limit: int = Field(20, ge=1, le=100, description="Max results returned")


class MissionAlertRequest(BaseModel):
    patch_id: str = Field(..., description="Target patch ID under surveillance")
    delta_vv_db: float = Field(0.0, description="Measured co-pol VV delta in dB")
    delta_vh_db: float = Field(0.0, description="Measured cross-pol VH delta in dB")
    delta_rvi: float = Field(0.0, description="Measured Radar Vegetation Index delta")
    affected_area_ha: float = Field(0.0, description="Calculated affected area in hectares")
    land_cover_context: Optional[str] = Field(None, description="Dominant land cover class")


class MissionAlertResponse(BaseModel):
    bulletin_id: str
    classification: str
    alert_code: str
    title: str
    event_type: str
    timestamp_utc: str
    sensor: str
    monitored_patch_id: str
    target_location: Dict[str, float]
    telemetry_metrics: Dict[str, Any]
    physical_evidence: str
    operational_directives: List[str]
    cryptographic_verification: Dict[str, str]

# ==========================================
# PHASE 15 SCHEMAS: MULTIMODAL S1+S2 FUSION & QWEN 2.5-VL ADAPTER
# ==========================================

class S1S2FusionRequest(BaseModel):
    s1_patch_id: str = Field(..., description="Target Sentinel-1 SAR patch ID")
    s2_tile_id: Optional[str] = Field(None, description="Optional paired Sentinel-2 optical tile ID")
    fusion_strategy: str = Field("cross_attention", description="Fusion method: 'cross_attention', 'concatenation', or 'hadamard_gated'")
    cloud_coverage_pct: float = Field(5.0, ge=0.0, le=100.0, description="Optical cloud obstruction percentage")
    user_query: Optional[str] = Field("Analyze joint radar penetration and optical vegetation vitality.", description="User reasoning query")


class S1S2FusionResponse(BaseModel):
    status: str = "success"
    s1_patch_id: str
    s2_tile_id: str
    fusion_strategy: str
    cloud_coverage_pct: float
    cross_sensor_metrics: Dict[str, Any]
    fused_class_predictions: List[Dict[str, Any]]
    cross_sensor_proof: List[Dict[str, str]]
    joint_embedding_dim: int
    vlm_prompt_preview: Dict[str, Any]


class QwenVLProjectRequest(BaseModel):
    s1_patch_id: str = Field(..., description="Sentinel-1 SAR patch ID")
    user_query: str = Field("Provide ISRO tactical mission assessment based on SAR and Optical telemetry.", description="VLM instruction query")
    cloud_flag: bool = Field(False, description="Flag indicating whether optical clouds obstruct scene")


class QwenVLProjectResponse(BaseModel):
    status: str = "success"
    patch_id: str
    model_target: str
    visual_prefix_tokens_shape: List[int]
    visual_prefix_token_sample: List[float]
    token_energy_norm: float
    system_prompt: str
    formatted_user_prompt: str
    grounding_tags: List[str]


class S1ExportResponse(BaseModel):
    status: str = "success"
    model_name: str
    contract_version: str
    export_dir: str
    contract_json_path: str
    extractor_script_path: str
    bundle_zip_path: str
    specifications: Dict[str, Any]
