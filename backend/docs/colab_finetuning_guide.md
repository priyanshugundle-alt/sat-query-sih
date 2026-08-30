# SatQuery AI — Google Colab Fine-Tuning Guide (Free GPU)

This guide walks you through fine-tuning **Qwen2-VL-7B-Instruct** on your formatted satellite datasets (**VRSBench**, **RSVQA**, **CDVQA**, **BigEarthNet-v2.0**) using Google Colab's free GPU.

---

## Step 1: Open Google Colab
1. Go to [Google Colab](https://colab.research.google.com).
2. Click on **Upload** tab.
3. Select the file: `backend/scripts/qwen2_vl_qlora_finetune.ipynb` from this project.

---

## Step 2: Upload Formatted Datasets
1. On the left sidebar of Colab, click the **Files** icon (folder icon).
2. Upload the formatted dataset files from `backend/sample-data/formatted_jsonl/`:
   - `vrsbench_formatted.jsonl`
   - `rsvqa_formatted.jsonl`
   - `cdvqa_formatted.jsonl`
   - `bigearthnet_formatted.jsonl`

---

## Step 3: Enable GPU & Run
1. In Colab menu, select **Runtime -> Change runtime type**.
2. Under **Hardware accelerator**, select **T4 GPU** (or A100 GPU if available).
3. Click **Save**.
4. Click **Runtime -> Run all** (Ctrl + F9).

---

## Step 4: Download Trained Adapter Weights
1. Once training finishes (~15-20 mins), a folder named `qwen2_vl_satquery_adapter` will appear in the Files panel.
2. Download `qwen2_vl_satquery_adapter` and place it inside your project's `backend/trained_models/` folder.
