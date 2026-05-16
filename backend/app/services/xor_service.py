"""
xor_service.py - XOR Image Encryption/Decryption
==================================================
XOR encryption works by taking each pixel's byte value and
XOR-ing it with a repeating key. It's symmetric — the same
operation encrypts AND decrypts (XOR is its own inverse).

How it works:
  encrypted_byte = original_byte XOR key_byte
  decrypted_byte = encrypted_byte XOR key_byte  ← same operation!

This is real pixel-level encryption. The output can be viewed
as an image directly (it will look like noise/scrambled pixels).
"""

import numpy as np
from PIL import Image
import io
import time
import hashlib


def _prepare_key(key: str, length: int) -> np.ndarray:
    """
    Convert a string key into a repeating byte array of the required length.
    We hash the key first for better distribution, then tile it to fill the image.
    """
    # Hash the key to get a fixed-size byte sequence
    key_bytes = hashlib.sha256(key.encode()).digest()  # 32 bytes
    # Repeat (tile) the key to cover all pixels
    key_array = np.frombuffer(key_bytes, dtype=np.uint8)
    tiles = (length // len(key_array)) + 1
    return np.tile(key_array, tiles)[:length]


def xor_encrypt(image_bytes: bytes, key: str) -> dict:
    """
    Encrypt an image using XOR.

    Args:
        image_bytes: Raw image file bytes
        key: Encryption key (string)

    Returns:
        dict with encrypted image bytes, stats
    """
    start_time = time.time()

    # Open image and convert to RGBA for consistent processing
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    img_array = np.array(img, dtype=np.uint8)

    original_shape = img_array.shape  # (height, width, 4)
    flat = img_array.flatten()        # Flatten to 1D array of bytes

    # Generate the key array matching pixel count
    key_array = _prepare_key(key, len(flat))

    # ── THE CORE XOR OPERATION ──────────────────────────────────────────────
    encrypted_flat = np.bitwise_xor(flat, key_array)
    # ────────────────────────────────────────────────────────────────────────

    # Reshape back to image dimensions
    encrypted_array = encrypted_flat.reshape(original_shape).astype(np.uint8)

    # Calculate pixel change stats
    changed_pixels = np.sum(flat != encrypted_flat)
    total_pixels = len(flat)
    pixel_change_pct = (changed_pixels / total_pixels) * 100

    # Convert encrypted array back to image bytes (PNG format)
    encrypted_img = Image.fromarray(encrypted_array, mode="RGBA")
    output_buffer = io.BytesIO()
    encrypted_img.save(output_buffer, format="PNG")
    encrypted_bytes = output_buffer.getvalue()

    elapsed = time.time() - start_time

    return {
        "encrypted_bytes": encrypted_bytes,
        "encryption_time": round(elapsed * 1000, 2),   # in milliseconds
        "original_size": len(image_bytes),
        "encrypted_size": len(encrypted_bytes),
        "pixel_change_pct": round(pixel_change_pct, 2),
        "image_width": img.width,
        "image_height": img.height,
        "algorithm": "XOR",
    }


def xor_decrypt(encrypted_bytes: bytes, key: str) -> dict:
    """
    Decrypt an XOR-encrypted image.
    Since XOR is symmetric, this is IDENTICAL to encryption.

    Args:
        encrypted_bytes: Encrypted image file bytes
        key: Same key used during encryption

    Returns:
        dict with decrypted image bytes, stats
    """
    start_time = time.time()

    img = Image.open(io.BytesIO(encrypted_bytes)).convert("RGBA")
    img_array = np.array(img, dtype=np.uint8)

    original_shape = img_array.shape
    flat = img_array.flatten()

    key_array = _prepare_key(key, len(flat))

    # ── XOR DECRYPTION (same as encryption) ────────────────────────────────
    decrypted_flat = np.bitwise_xor(flat, key_array)
    # ────────────────────────────────────────────────────────────────────────

    decrypted_array = decrypted_flat.reshape(original_shape).astype(np.uint8)

    decrypted_img = Image.fromarray(decrypted_array, mode="RGBA")
    output_buffer = io.BytesIO()
    decrypted_img.save(output_buffer, format="PNG")
    decrypted_bytes = output_buffer.getvalue()

    elapsed = time.time() - start_time

    return {
        "decrypted_bytes": decrypted_bytes,
        "decryption_time": round(elapsed * 1000, 2),
        "algorithm": "XOR",
    }
