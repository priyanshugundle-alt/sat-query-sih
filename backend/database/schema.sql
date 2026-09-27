PRAGMA foreign_keys = ON;

-- 1. Analysis Requests Table
CREATE TABLE IF NOT EXISTS analysis_requests (
    query_id TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    dataset_context TEXT NOT NULL DEFAULT 'NORMAL_SATELLITE',
    selected_task TEXT,
    selected_handler TEXT,
    selected_model TEXT,
    status TEXT NOT NULL,
    answer_text TEXT,
    confidence_state TEXT,
    limitations_json TEXT,
    investigator_json TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- 2. Image Assets Table
CREATE TABLE IF NOT EXISTS image_assets (
    image_id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_format TEXT,
    file_size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    band_count INTEGER,
    modality TEXT,
    acquisition_date TEXT,
    crs TEXT,
    bounding_box TEXT,
    georeferenced INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE CASCADE
);

-- 3. Trace Events Table
CREATE TABLE IF NOT EXISTS trace_events (
    trace_id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    event_order INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    detail TEXT,
    tool_name TEXT,
    parameter_summary TEXT,
    event_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE CASCADE
);

-- 4. Evidence Items Table
CREATE TABLE IF NOT EXISTS evidence_items (
    evidence_id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    file_path TEXT,
    label TEXT,
    description TEXT,
    source_modality TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE CASCADE
);

-- 5. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    report_id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    report_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE CASCADE
);

-- 6. Benchmark Runs Table
CREATE TABLE IF NOT EXISTS benchmark_runs (
    benchmark_run_id TEXT PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    split_name TEXT NOT NULL,
    sample_id TEXT NOT NULL,
    query_id TEXT,
    expected_answer TEXT,
    predicted_answer TEXT,
    metric_name TEXT,
    metric_value REAL,
    selected_task TEXT,
    model_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE SET NULL
);

-- Indexes for performance & ordering
CREATE INDEX IF NOT EXISTS idx_requests_created_at
ON analysis_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_images_query_id
ON image_assets(query_id);

CREATE INDEX IF NOT EXISTS idx_trace_query_id_order
ON trace_events(query_id, event_order);

CREATE INDEX IF NOT EXISTS idx_evidence_query_id
ON evidence_items(query_id);

CREATE INDEX IF NOT EXISTS idx_reports_query_id
ON reports(query_id);

-- 7. Model Registry Table
CREATE TABLE IF NOT EXISTS model_registry (
    model_name TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    endpoint TEXT,
    supported_tasks TEXT,
    availability TEXT NOT NULL
);

-- 8. Adaptation Runs Table
CREATE TABLE IF NOT EXISTS adaptation_runs (
    adaptation_run_id TEXT PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    split_name TEXT NOT NULL,
    baseline_metric REAL,
    adapted_metric REAL,
    configuration TEXT,
    created_at TEXT NOT NULL
);

-- 9. Database views for PDF-alignment
CREATE VIEW IF NOT EXISTS analysis_runs AS SELECT 
    query_id, query_text, dataset_context, selected_task, selected_handler, selected_model, status, answer_text, confidence_state, limitations_json, investigator_json, created_at, completed_at
    FROM analysis_requests;

CREATE VIEW IF NOT EXISTS input_assets AS SELECT 
    image_id, query_id, file_name, file_path, file_format, file_size_bytes, width, height, band_count, modality, acquisition_date, crs, bounding_box, georeferenced, created_at
    FROM image_assets;

CREATE VIEW IF NOT EXISTS evidence_artifacts AS SELECT 
    evidence_id, query_id, evidence_type, file_path, label, description, source_modality, created_at
    FROM evidence_items;

-- 10. Space Registry Table (For 10 HF ZeroGPU Spaces Routing & Circuit Breaker)
CREATE TABLE IF NOT EXISTS space_registry (
    space_id TEXT PRIMARY KEY,
    space_name TEXT NOT NULL,
    space_url TEXT NOT NULL,
    account_email TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    consecutive_failures INTEGER DEFAULT 0,
    exhausted_until TEXT,
    last_ping_at TEXT,
    created_at TEXT NOT NULL
);

-- 11. Job Stages Table (For Stateful Multi-Stage Handover & Resumption)
CREATE TABLE IF NOT EXISTS job_stages (
    job_id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    current_stage TEXT NOT NULL,
    stage_data_json TEXT,
    last_active_space TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (query_id) REFERENCES analysis_requests(query_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_space_status ON space_registry(status);
CREATE INDEX IF NOT EXISTS idx_job_query_id ON job_stages(query_id);


