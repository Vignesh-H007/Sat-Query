import io
import numpy as np
from PIL import Image
import tifffile

def process_image_to_bytes(file_bytes: bytes, filename: str) -> tuple[bytes, str]:
    """
    Normalizes standard images or GeoTIFFs to 8-bit RGB JPEG bytes for Gemini API.
    Returns: (image_bytes, mime_type)
    """
    lower_name = filename.lower()
    
    if lower_name.endswith(('.tif', '.tiff')):
        try:
            # Read multi-band / 16-bit GeoTIFF via tifffile
            with io.BytesIO(file_bytes) as bio:
                arr = tifffile.imread(bio)
            
            # Squeeze extra dimensions if present (e.g., [1, H, W] -> [H, W])
            arr = np.squeeze(arr)
            
            if arr.ndim == 2:  # Grayscale / SAR single band
                # Normalize 2% - 98% percentile to avoid satellite nodata/outlier blowouts
                p2, p98 = np.percentile(arr, (2, 98))
                arr_clipped = np.clip(arr, p2, p98)
                norm = ((arr_clipped - p2) / (p98 - p2 + 1e-6) * 255).astype(np.uint8)
                img = Image.fromarray(norm).convert("RGB")
            elif arr.ndim >= 3:  # Multispectral: take first 3 bands (usually RGB or False Color)
                arr = arr[:, :, :3] if arr.shape[2] <= 4 else arr[:3, :, :].transpose(1, 2, 0)
                # Normalize per channel
                rgb_channels = []
                for c in range(3):
                    band = arr[:, :, c]
                    p2, p98 = np.percentile(band, (2, 98))
                    band_clipped = np.clip(band, p2, p98)
                    norm = ((band_clipped - p2) / (p98 - p2 + 1e-6) * 255).astype(np.uint8)
                    rgb_channels.append(norm)
                img = Image.fromarray(np.stack(rgb_channels, axis=-1))
            else:
                img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        except Exception:
            # Fallback to PIL standard open
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    else:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    output_buffer = io.BytesIO()
    img.save(output_buffer, format="JPEG", quality=90)
    return output_buffer.getvalue(), "image/jpeg"