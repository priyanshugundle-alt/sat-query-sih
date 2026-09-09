import os
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


class BigEarthNetS2NPZDataset(Dataset):

    def __init__(
        self,
        metadata_path,
        npz_dir,
        split="train"
    ):
        self.df = pd.read_parquet(metadata_path)

        self.df = self.df[
            self.df["split"] == split
        ].reset_index(drop=True)

        self.npz_dir = npz_dir

        # Official Sentinel-2 band order
        self.bands = [
            "B01", "B02", "B03", "B04",
            "B05", "B06", "B07", "B08",
            "B8A", "B09", "B11", "B12"
        ]

        # Fixed official 19-class mapping
        self.classes = sorted(
            set(
                label
                for labels in self.df["labels"]
                for label in labels
            )
        )

        self.class_to_idx = {
            label: i
            for i, label in enumerate(self.classes)
        }

    def __len__(self):
        return len(self.df)

    def __getitem__(self, index):

        row = self.df.iloc[index]

        patch_id = row["patch_id"]

        npz_path = os.path.join(
            self.npz_dir,
            patch_id + ".npz"
        )

        data = np.load(
            npz_path,
            allow_pickle=True
        )

        # uint8 [12,120,120] -> float32 [0,1]
        image = data["image"].astype(
            np.float32
        ) / 255.0

        # Multi-label target
        target = np.zeros(
            len(self.classes),
            dtype=np.float32
        )

        for label in row["labels"]:
            target[
                self.class_to_idx[label]
            ] = 1.0

        image = torch.from_numpy(image)
        target = torch.from_numpy(target)

        return image, target


if __name__ == "__main__":

    metadata = r"D:\database\BigEarthNet-S2\metadata.parquet"

    npz_dir = (
        r"D:\database\BigEarthNet-S2"
        r"\preprocessed_test"
    )

    dataset = BigEarthNetS2NPZDataset(
        metadata,
        npz_dir,
        split="train"
    )

    x, y = dataset[0]

    print("Dataset size:", len(dataset))
    print("Number of classes:", len(dataset.classes))
    print("Band order:", dataset.bands)
    print("Image shape:", x.shape)
    print("Image dtype:", x.dtype)
    print("Image min:", x.min().item())
    print("Image max:", x.max().item())
    print("Target shape:", y.shape)
    print("Target dtype:", y.dtype)
    print("Positive labels:", int(y.sum()))
    print("Labels:", list(dataset.df.iloc[0]["labels"]))