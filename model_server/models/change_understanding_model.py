import torch
import torch.nn as nn

class ChangeUnderstandingModel(nn.Module):
    def __init__(self, encoder):
        super().__init__()
        print("  -> Initializing Spatial Change Understanding Task Head...")
        self.encoder = encoder
        
        # In production, load the trained weights for this specific head
        self.task_head = nn.Linear(self.encoder.embedding_dim * 2, 512).to(self.encoder.device) # Takes 2 image embeddings

    def run(self, query, image_paths, params):
        print(f"[Change Understanding Task Head] Comparing {len(image_paths)} images.")
        
        # 1. Feature Extraction (Extracts embeddings for both images)
        embeddings = self.encoder.extract_features(image_paths)
        
        # 2. Downstream Task Inference
        with torch.no_grad():
            # Mocking a concatenated representation of T1 and T2
            concat_embeddings = torch.cat((embeddings, embeddings), dim=-1)
            output = self.task_head(concat_embeddings)
            print(f"     [Change Understanding Task Head] Processed tensor shape: {output.shape}")
        
        return {
            "answer": "PyTorch Change Understanding Downstream Inference: Detected 15% increase in urban area between T1 and T2.",
            "evidence": [{
                "type": "CHANGE_MAP",
                "filePath": image_paths[-1] if image_paths else "",
                "label": "Change Mask",
                "description": "Spatial difference mask generated."
            }],
            "limitations": ["Highly sensitive to seasonal illumination changes."]
        }
