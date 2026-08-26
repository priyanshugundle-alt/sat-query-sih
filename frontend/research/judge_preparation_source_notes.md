# Judge Preparation Research Notes

## Official BigEarthNet v2.0

- Source: https://bigearth.net/
- BigEarthNet v2.0 reports 549,488 paired Sentinel-1 and Sentinel-2 image patches.
- Sentinel-2 patches have pixel-level reference maps and multi-label land-cover labels derived from CORINE Land Cover data.
- Corresponding Sentinel-1 patches were selected with close temporal proximity to the Sentinel-2 coverage.
- The official site provides pretrained S2, S1, and S1+S2 model resources, along with data, metadata, split, and pipeline links.

## Official VRSBench repository

- Source: https://github.com/lx709/VRSBench
- VRSBench reports 29,614 remote-sensing images, 29,614 detailed captions, 52,472 object references, and 123,221 visual question-answer pairs.
- It supports image captioning, visual grounding, and VQA evaluation.
- Its README states that final VQA evaluation uses a GPT-based protocol to account for synonyms in open-set answers; SatQuery should not claim plain exact-match accuracy if it adopts that protocol.

## Official RSVQA project page

- Source: https://rsvqa.sylvainlobry.com/
- RSVQA is designed for natural-language questions over remote-sensing images and uses image/question/answer triplets.
- The project explains that it has low- and high-resolution data variants and examples include presence, count, and area questions.
- The project page provides the RSVQAxBEN dataset link, which connects the RSVQA line of work to BigEarthNet.

## CDVQA primary paper

- Source: https://ieeexplore.ieee.org/document/9901476
- CDVQA is a change-detection-based VQA task over two aerial images captured at different times, with a natural-language question about their content change.
- The primary paper reports 2,968 publicly available image pairs and more than 122,000 question-answer pairs generated from semantic change information.
- Question types include whether a change occurred, increase/decrease, what a class changed to, largest/smallest change, and change-ratio questions.
- The paper's benchmark uses multitemporal aerial RGB inputs; this does not replace the project requirement to handle normal satellite input formats in real mode.

## BigEarthNet.txt primary paper

- Source: https://arxiv.org/abs/2603.29630
- BigEarthNet.txt reports 464,044 co-registered Sentinel-1 SAR and Sentinel-2 multispectral images with 9.6 million text annotations.
- The annotations include geographically anchored captions, VQA pairs, and referring-expression detection instructions.
- Its authors describe 15 tasks across captioning, binary/MCQ VQA, and referring-expression detection, with a manually verified benchmark split.
- The paper reports that domain fine-tuning using BigEarthNet.txt produced consistent performance gains across its considered tasks; SatQuery can use this as motivation for adaptation but must report its own measured results.

## Supplied SIH Problem Statement 26167

- Source: /home/ubuntu/upload/pasted_content.txt
- Mandatory scope includes remote-sensing adaptation, single-image VQA plus captioning/scene description or grounding, bi-temporal change analysis, optical-SAR paired analysis, and agentic task/model orchestration.
- Normal geospatial inputs are GeoTIFF/TIFF. PNG/JPEG are permitted only for prescribed public benchmark contexts.
- The statement requires task classification, validation of image number/modality/format/metadata/compatibility, selection from a predefined tool registry, evidence/confidence and an auditable execution summary.
- Final evaluation uses prescribed public benchmark test subsets and an ISRO/SAC evaluation dataset; reference annotations are not disclosed to teams.
