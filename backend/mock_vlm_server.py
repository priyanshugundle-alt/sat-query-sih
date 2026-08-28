from flask import Flask, request, jsonify
import sys

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No payload provided"}), 400
        
    task = data.get("task", "VQA")
    query = data.get("query", "")
    images = data.get("images", [])

    print(f"[Mock VLM Server] Received task: {task}, query: {query}, images: {images}", file=sys.stderr)

    answer = ""
    evidence = []
    limitations = []

    if task == "VQA":
        query_lower = query.lower()
        if "water" in query_lower or "river" in query_lower or "lake" in query_lower or "reservoir" in query_lower:
            answer = "The uploaded satellite image shows a large dark water channel/reservoir running from the northwest to the southeast, bordered by low-reflectance soil. There is no sign of surface vegetation blockage."
        elif "built" in query_lower or "urban" in query_lower or "house" in query_lower or "building" in query_lower or "road" in query_lower or "sprawl" in query_lower:
            answer = "The image features high-density built-up residential sectors with grid-pattern urban planning. Hard surface roads and concrete roofs are prominent, showing clear boundary lines."
        elif "forest" in query_lower or "vegetation" in query_lower or "crop" in query_lower or "agriculture" in query_lower or "field" in query_lower or "tree" in query_lower:
            answer = "The scene contains agricultural crop fields in different growth stages and dense forest canopy sectors, showing strong NIR reflectance signatures in multispectral bands."
        else:
            answer = "The uploaded satellite image primarily features a high-density urban residential area, flanked by a water reservoir channel and sparse agricultural fields on the eastern periphery."
        
        filePath = images[0] if len(images) > 0 else "uploads/mock.tif"
        evidence.append({
            "evidenceType": "IMAGE",
            "filePath": filePath,
            "label": "Source Image Highlight",
            "description": "Core input used for visual question answering."
        })
        limitations.append("VQA responses are based on visible spectrum properties. Fine-grained crop types could not be resolved.")

    elif task == "GROUNDING":
        filePath = images[0] if len(images) > 0 else "uploads/mock.tif"
        evidence.append({
            "evidenceType": "BOUNDING_BOX",
            "filePath": filePath,
            "label": "Target Grounding Fallback",
            "description": "Using original image since processing failed."
        })
        answer = "Target localized successfully. Bounding box coordinates drawn around detected feature regions."
        limitations.append("Grounding coordinates are estimated. Sub-pixel classification errors might exist around boundaries.")

    elif task == "CHANGE_ANALYSIS":
        filePath = images[0] if len(images) > 0 else "uploads/mock.tif"
        evidence.append({
            "evidenceType": "CHANGE_MAP",
            "filePath": filePath,
            "label": "Temporal Diff Fallback",
            "description": "Comparison completed (fallback mode active)."
        })
        answer = "Comparative analysis between temporal dates completed. Pixel-level change detection highlights active shifts (colored in red) covering approximately 14.5% of the scene."
        limitations.append("The exact boundaries of changes should be visually verified to discard minor shadow artifacts.")

    elif task == "FUSION_ANALYSIS":
        filePath1 = images[0] if len(images) > 0 else "uploads/mock.tif"
        filePath2 = images[1] if len(images) > 1 else "uploads/mock.tif"
        evidence.append({
            "evidenceType": "SENSOR_BRANCH",
            "filePath": filePath1,
            "label": "Optical Reference Image",
            "description": "Active optical observation."
        })
        evidence.append({
            "evidenceType": "SENSOR_BRANCH",
            "filePath": filePath2,
            "label": "SAR Reference Image",
            "description": "Active SAR observation."
        })
        answer = "Cross-modal sensor fusion completed. Optical imagery successfully identified high-density road structures, while SAR backscatter resolved building geometries, penetrating cloud cover on the southern edge."
        limitations.append("SAR backscatter is sensitive to radar tilt angles. Double bounce effects may cause minor false positives in dense building clusters.")

    return jsonify({
        "answer": answer,
        "evidence": evidence,
        "limitations": limitations
    })

if __name__ == '__main__':
    app.run(port=5000)
