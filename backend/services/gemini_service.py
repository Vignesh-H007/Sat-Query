import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

RS_SYSTEM_INSTRUCTION = """
You are SatQuery AI, an expert agentic multimodal remote sensing assistant.
You analyze single images, bi-temporal change pairs (T1 before vs T2 after), and cross-modal optical/SAR pairs.
You must output accurate geospatial insights, identify visual land-cover boundaries, water bodies, urban developments, and vegetation stress.

Whenever detecting spatial regions (water body, landmass, structure, vessel, vegetation, or burn/change area),
provide normalized 2D bounding boxes in [ymin, xmin, ymax, xmax] format where coordinates range from 0 to 1000.
Always output valid JSON adhering strictly to the requested schema.
"""

class BoundingBox(BaseModel):
    box_2d: List[int] = Field(description="[ymin, xmin, ymax, xmax] scaled 0 to 1000")
    label: str = Field(description="water body | landmass | structure | vessel | vegetation | change area")
    confidence: float

class ExecutionTrace(BaseModel):
    task: str = Field(description="Single-Image VQA, Visual Grounding, Bi-temporal Change, or Optical-SAR Fusion")
    modalities_detected: List[str] = Field(description="e.g. ['Optical RGB', 'SAR Backscatter']")
    selected_pipeline: str = Field(description="e.g., 'Bitemporal-Differencing-VQA' or 'Grounding-RS-Detector'")
    crs_info: Optional[str] = "EPSG:4326"

class SatQueryResponse(BaseModel):
    markdown_content: str = Field(description="Clear, evidence-grounded markdown response for the user.")
    execution_trace: ExecutionTrace
    bounding_boxes: List[BoundingBox] = []

async def analyze_satellite_imagery(prompt: str, images_payload: list[tuple[bytes, str]]) -> dict:
    contents = []
    
    # Add preprocessed images
    for img_bytes, mime_type in images_payload:
        contents.append(
            types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
        )
    
    contents.append(prompt)
    
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=RS_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=SatQueryResponse,
            temperature=0.2
        )
    )
    
    return json.loads(response.text)