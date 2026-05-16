"""
aes_service.py - AES-256 Image Encryption/Decryption
======================================================
AES (Advanced Encryption Standard) with 256-bit keys in CBC mode.

How it works:
1. The image bytes are read as raw data.
2. A random 16-byte IV (Initialization Vector) is generated.
3. The data is padded to a multiple of 16 bytes (AES block size).
4. AES-256 encryption is applied in CBC mode.
5. The IV is prepended to the ciphertext (needed for decryption).

The encrypted output is a BINARY file — it doesn't look like an image.
For the UI preview, we generate a VISUAL simulation (scrambled pixels).

Key Derivation:
  We use PBKDF2 (Password-Based Key Derivation Function 2) to convert
  the user's password string into a proper 256-bit (32-byte) AES key.
"""

import os
import io
import time
import hashlib
import numpy as np
from PIL import Image
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


# AES constants
AES_KEY_SIZE = 32    # 256 bits = 32 bytes
AES_BLOCK_SIZE = 16  # AES block size is always 128 bits = 16 bytes
PBKDF2_ITERATIONS = 100_000
SALT = b"ImageEncryptSalt"  # Fixed salt for demo; in production, use random + store it


def _derive_key(password: str) -> bytes:
    """
    Derive a 256-bit AES key from a password using PBKDF2-HMAC-SHA256.
    This is much more secure than using the raw password as the key.
    """
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        SALT,
        PBKDF2_ITERATIONS,
        dklen=AES_KEY_SIZE,
    )


def _generate_visual_scramble(image_bytes: bytes) -> bytes:
    """
    Generate a VISUAL SIMULATION of the encrypted image for UI preview.
    This is NOT the real AES ciphertext — it's a scrambled pixel view
    that LOOKS encrypted for demonstration purposes.

    Real AES ciphertext is binary data, not a valid image.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    img_array = np.array(img, dtype=np.uint8)
    h, w, c = img_array.shape

    # Create a visually scrambled version:
    # 1. Shuffle pixel blocks
    flat = img_array.reshape(-1, c)
    rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility
    rng.shuffle(flat)

    # 2. Apply random XOR noise for extra visual effect
    noise = rng.integers(0, 255, flat.shape, dtype=np.uint8)
    scrambled = np.bitwise_xor(flat, noise).reshape(h, w, c).astype(np.uint8)

    output = io.BytesIO()
    Image.fromarray(scrambled, "RGBA").save(output, format="PNG")
    return output.getvalue()


def aes_encrypt(image_bytes: bytes, password: str) -> dict:
    """
    Encrypt an image using AES-256-CBC.

    Process:
    1. Derive 256-bit key from password
    2. Generate random 16-byte IV
    3. Pad image data to AES block boundary
    4. Encrypt with AES-256-CBC
    5. Output: IV (16 bytes) + Ciphertext

    Args:
        image_bytes: Raw image file bytes
        password: User-provided password/key

    Returns:
        dict with encrypted bytes (real), visual preview bytes, stats
    """
    start_time = time.time()

    # Derive the AES key from the password
    aes_key = _derive_key(password)

    # Generate a cryptographically random IV
    iv = os.urandom(AES_BLOCK_SIZE)

    # ── REAL AES-256-CBC ENCRYPTION ─────────────────────────────────────────
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)
    padded_data = pad(image_bytes, AES_BLOCK_SIZE)  # PKCS7 padding
    ciphertext = cipher.encrypt(padded_data)
    # ────────────────────────────────────────────────────────────────────────

    # Prepend IV to ciphertext (needed for decryption)
    aes_payload = iv + ciphertext

    # Generate visual scramble for UI preview
    visual_preview = _generate_visual_scramble(image_bytes)

    # Embed the AES payload at the end of the visual preview PNG
    # PNG ends with IEND chunk: 4 bytes length (0), 4 bytes type ('IEND'), 4 bytes CRC
    encrypted_output = visual_preview + aes_payload

    # Get image dimensions for stats
    img = Image.open(io.BytesIO(image_bytes))

    elapsed = time.time() - start_time

    return {
        "encrypted_bytes": encrypted_output,        # Real AES ciphertext
        "pure_aes_payload": aes_payload,            # Just IV + ciphertext
        "visual_preview": visual_preview,           # For UI display only
        "encryption_time": round(elapsed * 1000, 2),
        "original_size": len(image_bytes),
        "encrypted_size": len(encrypted_output),
        "pure_aes_size": len(aes_payload),
        "key_size_bits": AES_KEY_SIZE * 8,          # 256
        "iv": iv.hex(),                             # For display purposes
        "image_width": img.width,
        "image_height": img.height,
        "algorithm": "AES-256-CBC",
    }


def aes_decrypt(encrypted_bytes: bytes, password: str) -> dict:
    """
    Decrypt an AES-256-CBC encrypted image.

    Process:
    1. Extract IV from first 16 bytes
    2. Derive same key from password
    3. Decrypt ciphertext
    4. Remove padding to get original image bytes

    Args:
        encrypted_bytes: Encrypted data (IV + ciphertext)
        password: Same password used during encryption

    Returns:
        dict with decrypted image bytes, stats
    """
    start_time = time.time()

    # If the user uploaded the steganographic PNG, the actual AES payload
    # is appended after the PNG's IEND chunk.
    # The IEND chunk signature + CRC is b'IEND\xaeB`\x82'
    iend_marker = b"IEND\xaeB`\x82"
    idx = encrypted_bytes.find(iend_marker)
    if idx != -1:
        # Extract everything after the IEND chunk (which includes the 8 marker bytes)
        payload = encrypted_bytes[idx + 8:]
        if len(payload) > 0:
            encrypted_bytes = payload

    # Extract IV (first 16 bytes) and ciphertext (the rest)
    iv = encrypted_bytes[:AES_BLOCK_SIZE]
    ciphertext = encrypted_bytes[AES_BLOCK_SIZE:]

    # Derive the same key from the same password
    aes_key = _derive_key(password)

    # ── REAL AES-256-CBC DECRYPTION ─────────────────────────────────────────
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)
    padded_plaintext = cipher.decrypt(ciphertext)
    image_bytes = unpad(padded_plaintext, AES_BLOCK_SIZE)  # Remove padding
    # ────────────────────────────────────────────────────────────────────────

    elapsed = time.time() - start_time

    return {
        "decrypted_bytes": image_bytes,
        "decryption_time": round(elapsed * 1000, 2),
        "algorithm": "AES-256-CBC",
    }
