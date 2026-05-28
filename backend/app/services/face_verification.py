from random import random


def simulate_face_verification() -> dict[str, str | bool]:
    confidence = round(0.72 + random() * 0.27, 2)
    approved = confidence >= 0.86
    return {
        "approved": approved,
        "confidence": f"{confidence:.2f}",
        "message": "Face match succeeded" if approved else "Face mismatch - additional verification required",
    }
