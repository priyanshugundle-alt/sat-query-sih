import torch
import torch.nn as nn

class QwenFeatureExtractor(nn.Module):
    """
    The Base Image Encoder (Eyes).
    In production, this will load the Qwen-VL vision backbone weights.
    For now, it mocks the extraction of a 768-dimensional embedding vector per image.
    """
    def __init__(self, device="cpu"):
        super().__init__()
        self.device = device
        self.embedding_dim = 768
        print(f"  -> Loading Base Qwen Vision Encoder onto {self.device}...")
        
        # In production, this might be:
        # self.vision_model = AutoModel.from_pretrained("Qwen/Qwen-VL", trust_remote_code=True).visual
        
        # Mock projection layer just so this is a valid PyTorch module
        self.mock_projection = nn.Linear(3, self.embedding_dim)

    def extract_features(self, image_paths):
        """
        Takes a list of image paths and returns a simulated embedding tensor.
        Shape: [batch_size, embedding_dim]
        """
        print(f"     [Encoder] Extracting features for {len(image_paths)} image(s)...")
        batch_size = len(image_paths) if image_paths else 1
        
        # Mocking an image tensor extraction (e.g. random noise representing visual features)
        # In production, you would load the PIL Image, transform it, and pass through self.vision_model
        dummy_embeddings = torch.randn(batch_size, self.embedding_dim, device=self.device)
        return dummy_embeddings
