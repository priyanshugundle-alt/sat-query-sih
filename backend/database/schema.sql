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
