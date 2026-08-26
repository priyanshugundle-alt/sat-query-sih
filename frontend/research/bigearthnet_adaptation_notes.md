# BigEarthNet Adaptation Findings

- BigEarthNet v2.0 provides 549,488 paired Sentinel-1 and Sentinel-2 image patches with multi-label land-cover labels.
- The official site provides Sentinel-1, Sentinel-2, and paired S1+S2 dataset variants, metadata, reference maps, and pretrained models.
- The official pretrained-model organization provides S1-only, S2-only, and S1+S2 weights for several architectures, including a relatively lightweight ResNet-18 option.
- A feasible minimum experiment is to fine-tune or adapt a small S2 visual classifier component on a limited documented subset for multi-label land-cover prediction, then compare held-out baseline and adapted performance.
- The final Java system should treat the trained component as a local model service behind `HttpModelClient`; Java remains responsible for routing, validation, trace, and reports.

Sources:
- https://bigearth.net/
- https://huggingface.co/BIFOLD-BigEarthNetv2-0
