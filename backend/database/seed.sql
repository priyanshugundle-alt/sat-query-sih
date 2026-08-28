PRAGMA foreign_keys = ON;

-- Delete existing seed data to allow repeated run
DELETE FROM benchmark_runs;
DELETE FROM reports;
DELETE FROM evidence_items;
DELETE FROM trace_events;
DELETE FROM image_assets;
DELETE FROM analysis_requests;
DELETE FROM model_registry;
DELETE FROM adaptation_runs;

-- Seed Model Registry
INSERT INTO model_registry (model_name, version, endpoint, supported_tasks, availability)
VALUES ('UniRSAdapter', 'v1', 'http://localhost:5000/analyze', 'VQA,GROUNDING,CHANGE_ANALYSIS', 'DEMO');

INSERT INTO model_registry (model_name, version, endpoint, supported_tasks, availability)
VALUES ('EarthGptAdapter', 'v1', 'http://localhost:5000/analyze', 'FUSION_ANALYSIS', 'DEMO');

INSERT INTO model_registry (model_name, version, endpoint, supported_tasks, availability)
VALUES ('ChangeQaAdapter', 'v1', 'http://localhost:5000/analyze', 'CHANGE_ANALYSIS', 'DEMO');

-- Seed Adaptation Runs (BigEarthNet)
INSERT INTO adaptation_runs (adaptation_run_id, dataset_name, split_name, baseline_metric, adapted_metric, configuration, created_at)
VALUES ('adapt-run-01', 'BigEarthNet v2.0 S2', 'held-out-test', 0.74, 0.88, '{"epochs":10, "lr":0.0001, "backbone":"resnet18", "batch_size":64}', '2026-08-28T18:00:00Z');


-- 1. Insert Local Test Analysis Request
INSERT INTO analysis_requests (
    query_id, query_text, dataset_context, selected_task,
    selected_handler, selected_model, status, answer_text,
    confidence_state, limitations_json, created_at, completed_at
) VALUES (
    'LOCAL_TEST_QUERY_001',
    'Has land cover changed on the agricultural boundary?',
    'NORMAL_SATELLITE',
    'CHANGE_ANALYSIS',
    'ChangeHandler',
    'satquery-temporal-diff-v3',
    'SUCCESS',
    'DEMO_MODE_ONLY: Built-up agricultural sprawl expanded by +127 structures (14.5% change) within bounds.',
    'HIGH',
    '["Shade angles match built-up signatures in temporal comparisons. Review recommended on change map overlay."]',
    '2026-08-25T12:00:00Z',
    '2026-08-25T12:00:01Z'
);

-- 2. Insert two temporal image assets sharing the same query ID
INSERT INTO image_assets (
    image_id, query_id, file_name, file_path, file_format,
    file_size_bytes, width, height, band_count, modality,
    acquisition_date, crs, bounding_box, georeferenced, created_at
) VALUES (
    'img-slot-1-test',
    'LOCAL_TEST_QUERY_001',
    'sentinel2_optical_t1.tif',
    'TEST_EVIDENCE_PATH/uploads/sentinel2_optical_t1.tif',
    'GEOTIFF',
    1048576,
    2048,
    2048,
    3,
    'OPTICAL',
    '2026-01-12',
    'EPSG:4326',
    '[72.82, 18.96, 72.89, 19.04]',
    1,
    '2026-08-25T11:55:00Z'
);

INSERT INTO image_assets (
    image_id, query_id, file_name, file_path, file_format,
    file_size_bytes, width, height, band_count, modality,
    acquisition_date, crs, bounding_box, georeferenced, created_at
) VALUES (
    'img-slot-2-test',
    'LOCAL_TEST_QUERY_001',
    'sentinel2_optical_t2.tif',
    'TEST_EVIDENCE_PATH/uploads/sentinel2_optical_t2.tif',
    'GEOTIFF',
    1048576,
    2048,
    2048,
    3,
    'OPTICAL',
    '2026-06-20',
    'EPSG:4326',
    '[72.82, 18.96, 72.89, 19.04]',
    1,
    '2026-08-25T11:56:00Z'
);

-- 3. Insert Trace Events with event_order preserved
INSERT INTO trace_events (
    trace_id, query_id, event_order, event_name, detail,
    tool_name, parameter_summary, event_status, created_at
) VALUES (
    'trace-01',
    'LOCAL_TEST_QUERY_001',
    1,
    'IMAGE_VALIDATION',
    'Validated GeoTIFF headers. CRS and boundaries match.',
    'InputValidator',
    '{}',
    'SUCCESS',
    '2026-08-25T12:00:00.100Z'
);

INSERT INTO trace_events (
    trace_id, query_id, event_order, event_name, detail,
    tool_name, parameter_summary, event_status, created_at
) VALUES (
    'trace-02',
    'LOCAL_TEST_QUERY_001',
    2,
    'WORKFLOW_ROUTING',
    'Detected bi-temporal inputs. Classification matches ChangeHandler.',
    'AgentController',
    '{"modality":"OPTICAL"}',
    'SUCCESS',
    '2026-08-25T12:00:00.200Z'
);

INSERT INTO trace_events (
    trace_id, query_id, event_order, event_name, detail,
    tool_name, parameter_summary, event_status, created_at
) VALUES (
    'trace-03',
    'LOCAL_TEST_QUERY_001',
    3,
    'MODEL_EXECUTION',
    'Temporal diff maps generated successfully.',
    'ModelClient',
    '{"changeThreshold":0.5}',
    'SUCCESS',
    '2026-08-25T12:00:00.600Z'
);

-- 4. Insert Evidence Items linking back to query ID
INSERT INTO evidence_items (
    evidence_id, query_id, evidence_type, file_path, label,
    description, source_modality, created_at
) VALUES (
    'evidence-01',
    'LOCAL_TEST_QUERY_001',
    'CHANGE_MAP',
    'TEST_EVIDENCE_PATH/outputs/change_map_view.png',
    'Bi-temporal Sprawl Change Map',
    'Highlights 14.5% agricultural built-up expansion.',
    'OPTICAL',
    '2026-08-25T12:00:00.700Z'
);

-- 5. Insert Report record
INSERT INTO reports (
    report_id, query_id, report_type, file_path, generated_at
) VALUES (
    'rep-test-001',
    'LOCAL_TEST_QUERY_001',
    'PDF',
    'outputs/report-LOCAL_TEST_QUERY_001.pdf',
    '2026-08-25T12:00:01.200Z'
);

-- 6. Insert Benchmark Run optionally linking to request
INSERT INTO benchmark_runs (
    benchmark_run_id, dataset_name, split_name, sample_id, query_id,
    expected_answer, predicted_answer, metric_name, metric_value,
    selected_task, model_name, created_at
) VALUES (
    'bench-run-test-01',
    'CDVQA',
    'val',
    'cdvqa-01',
    'LOCAL_TEST_QUERY_001',
    'Agricultural built-up sprawl increased significantly.',
    'Agricultural built-up sprawl increased by 14.5% between Jan and June.',
    'BLEU_SCORE',
    1.00,
    'CHANGE_ANALYSIS',
    'satquery-temporal-diff-v3',
    '2026-08-25T12:00:01.500Z'
);
