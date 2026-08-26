# Innovation Strategy Research Notes

## SIH Problem Statement 26167

The supplied statement already requires remote-sensing adaptation, VQA plus captioning/grounding, change, optical-SAR, automatic specialist tool selection, evidence, confidence, execution summary, and reports. Innovations should therefore strengthen trust, geospatial validity, usability, or evaluation rather than duplicate these mandatory functions.

## Agentic AI for Remote Sensing: Technical Challenges and Research Directions

Source: https://arxiv.org/html/2604.24919v1

The paper argues that EO workflows depend on georeferenced, multimodal, temporally structured data and that operations such as reprojection, resampling, compositing, and aggregation can alter state and propagate errors. It recommends structured geospatial state, tool-aware reasoning, verifier-guided execution, and trajectory-level accountability beyond final-answer accuracy. This supports a SatQuery differentiation based on a visible **Geo-Validity Gate** and an auditable **analysis receipt** that records validation/transform steps.

## Towards Faithful Reasoning in Remote Sensing (ICLR 2026)

Source: https://proceedings.iclr.cc/paper_files/paper/2026/hash/0b8067e0598da978cf89f5fc12c0acc2-Abstract-Conference.html

The paper describes a need for verifiable, perceptually grounded multi-step reasoning in remote sensing because opaque end-to-end VLM outputs can be unverifiable. This supports a SatQuery feature that ties each answer claim to evidence and blocks unsupported claim wording.

## Earth-Agent (ICLR 2026)

Source: https://proceedings.iclr.cc/paper_files/paper/2026/hash/5b4a459db23e6db9be2a128380953d96-Abstract-Conference.html

Earth-Agent reports that current EO agent work remains early, often limited to RGB perception, shallow reasoning, and incomplete evaluation. It uses cross-modal tools and evaluates both reasoning trajectories and final outcomes. This supports SatQuery's differentiator of measuring routing/validation quality in addition to answer quality.

## Re-Aligning Language to Visual Objects with an Agentic Workflow

Source: https://arxiv.org/html/2503.23508v1

The paper motivates verification/reflection because VLMs can hallucinate inaccurate image descriptions. This supports using a small rule-based evidence verifier and a claim-to-evidence map rather than accepting every VLM sentence as trustworthy.

## GeoArbiter: Verifiability-Guided Grounding for Remote-Sensing MLLMs

Source: https://arxiv.org/abs/2608.00877

The paper reports that remote-sensing MLLMs can assert facts imagery cannot establish and that external geographic records can conflict with visible evidence. Its central principle is cross-modal verifiability: only use a source for attributes it can actually verify. This supports a SatQuery design that separates visual claims from metadata/geographic claims and deliberately challenges unverified claims.

## Reliability-Aware Foundation Models for Earth Observation

Source: https://openaccess.thecvf.com/content/CVPR2026W/EarthVision/html/Gonzalez-Calabuig_SHRUG-FM_Reliability-Aware_Foundation_Models_for_Earth_Observation_CVPRW_2026_paper.html

The paper describes reliability-aware EO models that identify and abstain from likely failures using input/embedding OOD signals and predictive uncertainty. This supports a SatQuery Investigator Mode that can say “insufficient evidence” or request an additional observation rather than forcing an answer.

## Uncertainty Quantification for Earth Observation

Source: https://arxiv.org/html/2412.06451v1

The paper distinguishes uncertainty arising from observations, model limitations, and training data. This supports surfacing distinct reasons for uncertainty in SatQuery rather than a single unexplained score.
