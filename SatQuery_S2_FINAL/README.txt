# SatQuery AI - Final Sentinel-2 Model

## Final model
- Architecture: ResNet-18
- Input: 12 Sentinel-2 bands, 120x120
- Output classes: 19
- Feature embedding: 512-D
- Training: random spatial augmentation + softened class balancing
- Best validation Macro F1: 0.6738697290
- Best checkpoint epoch: 8
- Final untouched test Macro F1: 0.6332
- Final untouched test Micro F1: 0.7424

## Model file
`model/best_model.pth`

This is the final trained S2 checkpoint. Do not retrain it unless explicitly required.

## Official band order stored in checkpoint
B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B11, B12

## What is included
- `model/best_model.pth` - final trained checkpoint
- `code/bigearthnet_npz_dataset.py` - matching dataset loader
- `code/extract_512d_features.py` - extracts 512-D embeddings
- `code/train_classbalanced.py` - exact final training provenance
- `code/train_augmented.py` - earlier augmentation experiment reference

## 512-D extraction
From the package's `code` directory, with the required Python environment:

python extract_512d_features.py --metadata "D:\path\metadata.parquet" --npz_dir "D:\path\preprocessed_test" --split train --output "train_features.npz"

Use `validation` and `test` similarly.

## Important
The BigEarthNet-S2 dataset and preprocessed NPZ files are NOT included in this ZIP.
The model checkpoint is the final handover artifact.

For SatQuery fusion, this S2 encoder produces a 512-D embedding that can be fused with the friend's S1 512-D embedding.
