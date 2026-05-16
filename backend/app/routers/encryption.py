"""
encryption.py - Encryption API Routes
======================================
These endpoints handle:
  - POST /api/encryption/encrypt  → encrypt an uploaded image
  - POST /api/encryption/decrypt  → decrypt an uploaded encrypted file
  - GET  /api/encryption/generate-key → generate a random secure key
  - POST /api/encryption/key-strength  → evaluate key/password strength
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, Response

from app.services import xor_service, aes_service
from app.utils.image_utils import (
    validate_image,
    bytes_to_base64,
    generate_random_key,
    get_key_strength,
)

router = APIRouter()


# ─── ENCRYPT ─────────────────────────────────────────────────────────────────

@router.post("/encrypt")
async def encrypt_image(
    file: UploadFile = File(..., description="Image file to encrypt"),
    algorithm: str = Form(..., description="'xor' or 'aes'"),
    key: str = Form(..., description="Encryption key/password"),
):
    """
    Encrypt an uploaded image using the specified algorithm.

    Returns base64-encoded previews + download data + stats.
    """
    # Read uploaded file bytes
    image_bytes = await file.read()

    # Validate the image
    validation = validate_image(image_bytes)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])

    if not key.strip():
        raise HTTPException(status_code=400, detail="Encryption key cannot be empty.")

    algorithm = algorithm.lower().strip()

    try:
        if algorithm == "xor":
            result = xor_service.xor_encrypt(image_bytes, key)
            encrypted_preview_b64 = bytes_to_base64(result["encrypted_bytes"])

            return JSONResponse({
                "success": True,
                "algorithm": "XOR",
                "encrypted_preview": encrypted_preview_b64,   # Visual: real XOR image
                "encrypted_data": bytes_to_base64(result["encrypted_bytes"], "image/png"),
                "stats": {
                    "encryption_time_ms": result["encryption_time"],
                    "original_size_bytes": result["original_size"],
                    "encrypted_size_bytes": result["encrypted_size"],
                    "pixel_change_pct": result["pixel_change_pct"],
                    "image_width": result["image_width"],
                    "image_height": result["image_height"],
                    "algorithm": result["algorithm"],
                },
            })

        elif algorithm == "aes":
            result = aes_service.aes_encrypt(image_bytes, key)

            return JSONResponse({
                "success": True,
                "algorithm": "AES-256-CBC",
                "encrypted_preview": bytes_to_base64(result["visual_preview"]),   # Visual simulation
                "encrypted_data": bytes_to_base64(result["encrypted_bytes"], "image/png"),
                "pure_aes_data": bytes_to_base64(result["pure_aes_payload"], "application/octet-stream"),
                "stats": {
                    "encryption_time_ms": result["encryption_time"],
                    "original_size_bytes": result["original_size"],
                    "encrypted_size_bytes": result["encrypted_size"],
                    "key_size_bits": result["key_size_bits"],
                    "iv": result["iv"],
                    "image_width": result["image_width"],
                    "image_height": result["image_height"],
                    "algorithm": result["algorithm"],
                },
            })

        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm '{algorithm}'. Use 'xor' or 'aes'.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")


# ─── DECRYPT ─────────────────────────────────────────────────────────────────

@router.post("/decrypt")
async def decrypt_image(
    file: UploadFile = File(..., description="Encrypted file to decrypt"),
    algorithm: str = Form(..., description="'xor' or 'aes'"),
    key: str = Form(..., description="Decryption key/password"),
):
    """
    Decrypt an encrypted image file.

    For XOR: accepts the XOR-encrypted PNG file.
    For AES: accepts the raw AES binary file (IV + ciphertext).
    """
    encrypted_bytes = await file.read()

    if not key.strip():
        raise HTTPException(status_code=400, detail="Decryption key cannot be empty.")

    algorithm = algorithm.lower().strip()

    # Auto-detect AES steganography even if user forgot to change the dropdown from XOR
    iend_marker = b"IEND\xaeB`\x82"
    idx = encrypted_bytes.find(iend_marker)
    if idx != -1 and len(encrypted_bytes) > idx + 8:
        # If there are bytes after the IEND chunk, it MUST be our AES payload
        algorithm = "aes"

    try:
        if algorithm == "xor":
            result = xor_service.xor_decrypt(encrypted_bytes, key)
            decrypted_b64 = bytes_to_base64(result["decrypted_bytes"])

            return JSONResponse({
                "success": True,
                "algorithm": "XOR",
                "decrypted_image": decrypted_b64,
                "stats": {
                    "decryption_time_ms": result["decryption_time"],
                    "algorithm": result["algorithm"],
                },
            })

        elif algorithm == "aes":
            result = aes_service.aes_decrypt(encrypted_bytes, key)
            decrypted_b64 = bytes_to_base64(result["decrypted_bytes"])

            return JSONResponse({
                "success": True,
                "algorithm": "AES-256-CBC",
                "decrypted_image": decrypted_b64,
                "stats": {
                    "decryption_time_ms": result["decryption_time"],
                    "algorithm": result["algorithm"],
                },
            })

        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm '{algorithm}'.")

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Decryption error (wrong key?): {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")


# ─── GENERATE KEY ────────────────────────────────────────────────────────────

@router.get("/generate-key")
def generate_key(length: int = 32):
    """Generate a cryptographically secure random key."""
    if length < 8 or length > 128:
        raise HTTPException(status_code=400, detail="Key length must be between 8 and 128.")
    key = generate_random_key(length)
    return {"key": key, "length": len(key)}


# ─── KEY STRENGTH ────────────────────────────────────────────────────────────

@router.post("/key-strength")
async def check_key_strength(key: str = Form(...)):
    """Evaluate the strength of a key/password."""
    strength = get_key_strength(key)
    return strength
