-- A. Create the analysis request
INSERT INTO analysis_requests (
    query_id, query_text, dataset_context, selected_task,
    selected_handler, selected_model, status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- B. Save uploaded image metadata
INSERT INTO image_assets (
    image_id, query_id, file_name, file_path, file_format,
    file_size_bytes, width, height, band_count, modality,
    acquisition_date, crs, bounding_box, georeferenced, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- C. Save a trace event
INSERT INTO trace_events (
    trace_id, query_id, event_order, event_name, detail,
    tool_name, parameter_summary, event_status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- D. Save an evidence item
INSERT INTO evidence_items (
    evidence_id, query_id, evidence_type, file_path, label,
    description, source_modality, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- E. Complete the request after analysis
UPDATE analysis_requests
SET
    selected_task = ?,
    selected_handler = ?,
    selected_model = ?,
    status = ?,
    answer_text = ?,
    confidence_state = ?,
    limitations_json = ?,
    completed_at = ?
WHERE query_id = ?;

-- F. Save report record
INSERT INTO reports (
    report_id, query_id, report_type, file_path, generated_at
) VALUES (?, ?, ?, ?, ?);

-- G. Load history for React
SELECT
    query_id, query_text, selected_task, selected_handler,
    status, confidence_state, created_at, completed_at
FROM analysis_requests
ORDER BY created_at DESC
LIMIT ?;

-- H. Load full analysis detail
SELECT
    query_id, query_text, dataset_context, selected_task,
    selected_handler, selected_model, status, answer_text,
    confidence_state, limitations_json, created_at, completed_at
FROM analysis_requests
WHERE query_id = ?;

-- I. Load execution trace in correct order
SELECT
    event_order, event_name, detail, tool_name,
    parameter_summary, event_status, created_at
FROM trace_events
WHERE query_id = ?
ORDER BY event_order ASC;

-- J. Load evidence for an analysis
SELECT
    evidence_type, file_path, label, description, source_modality
FROM evidence_items
WHERE query_id = ?
ORDER BY created_at ASC;

-- K. Save benchmark run
INSERT INTO benchmark_runs (
    benchmark_run_id, dataset_name, split_name, sample_id, query_id,
    expected_answer, predicted_answer, metric_name, metric_value,
    selected_task, model_name, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
