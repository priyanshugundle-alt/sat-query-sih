import argparse
import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision.models import resnet18
from bigearthnet_npz_dataset import BigEarthNetS2NPZDataset

parser = argparse.ArgumentParser()
parser.add_argument("--metadata", required=True)
parser.add_argument("--npz_dir", required=True)
parser.add_argument("--split", choices=["train", "validation", "test"], required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--batch_size", type=int, default=16)
args = parser.parse_args()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
checkpoint_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "best_model.pth")

ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)

model = resnet18(weights=None)
model.conv1 = nn.Conv2d(12, 64, kernel_size=7, stride=2, padding=3, bias=False)
model.fc = nn.Linear(model.fc.in_features, 19)
model.load_state_dict(ckpt["model_state_dict"])
model = model.to(device).eval()

extractor = nn.Sequential(
    model.conv1, model.bn1, model.relu, model.maxpool,
    model.layer1, model.layer2, model.layer3, model.layer4,
    model.avgpool, nn.Flatten()
).to(device).eval()

metadata = pd.read_parquet(args.metadata)
dataset = BigEarthNetS2NPZDataset(args.metadata, args.npz_dir, split=args.split)
loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False,
                    num_workers=0, pin_memory=True)

features, labels = [], []

with torch.no_grad():
    for i, (x, y) in enumerate(loader):
        x = x.to(device, non_blocking=True)
        with torch.amp.autocast("cuda", enabled=torch.cuda.is_available()):
            z = extractor(x)
        features.append(z.float().cpu().numpy())
        labels.append(y.cpu().numpy())
        if i % 1000 == 0:
            print(f"{args.split}: {i}/{len(loader)}")

features = np.concatenate(features)
labels = np.concatenate(labels)

split_df = metadata[metadata["split"] == args.split].reset_index(drop=True)
if len(split_df) != len(features):
    raise RuntimeError(f"Metadata/sample mismatch: {len(split_df)} vs {len(features)}")

patch_ids = split_df["patch_id"].astype(str).to_numpy()
os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
np.savez_compressed(args.output, features=features, labels=labels, patch_ids=patch_ids)

print("Saved:", args.output)
print("Feature shape:", features.shape)
print("Label shape:", labels.shape)
print("Patch IDs:", patch_ids.shape)
