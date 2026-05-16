# CipherLens — Image Encryption & Decryption System

A cybersecurity-themed web application for encrypting and decrypting images using **XOR** and **AES-256-CBC**. Built for academic demonstration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Crypto | PyCryptodome (AES-256-CBC) |
| Images | Pillow + NumPy |
| Charts | Recharts |

## Project Structure

```
image-encryption-app/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── encryption.py        # /api/encryption/* endpoints
│   │   │   └── analytics.py         # /api/analytics/* endpoints
│   │   ├── services/
│   │   │   ├── xor_service.py       # XOR encryption logic
│   │   │   └── aes_service.py       # AES-256-CBC logic
│   │   └── utils/
│   │       └── image_utils.py       # Validation, key tools
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Router setup
    │   ├── main.jsx                 # React entry point
    │   ├── index.css                # Global cyberpunk styles
    │   ├── components/
    │   │   ├── Layout.jsx           # Shared page wrapper
    │   │   ├── Sidebar.jsx          # Navigation sidebar
    │   │   └── TopBar.jsx           # Top navigation bar
    │   ├── pages/
    │   │   ├── Dashboard.jsx        # Home / overview
    │   │   ├── EncryptionPage.jsx   # Encrypt & decrypt tool
    │   │   └── AnalyticsPage.jsx    # Benchmark & charts
    │   └── services/
    │       └── api.js               # Axios API calls
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## Setup Instructions

### 1. Clone / Navigate to Project
```bash
cd "image-encryption-app"
```

### 2. Backend Setup (Python)

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000  
API docs (Swagger UI): http://localhost:8000/docs

### 3. Frontend Setup (Node.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## How It Works

### XOR Encryption
- Each pixel byte is XOR-ed with a repeating key byte stream
- The key string is hashed with SHA-256 to produce 32 bytes, then tiled
- XOR is symmetric: `encrypt(encrypt(data, key), key) == data`
- The encrypted output **is** a valid PNG image (looks like noise)

### AES-256-CBC Encryption
- Password → 256-bit key via **PBKDF2-HMAC-SHA256** (100,000 iterations)
- Random 16-byte **IV** generated per encryption
- Data padded with **PKCS7**, then encrypted in **CBC mode**
- Output: `IV (16 bytes) + Ciphertext`
- The UI shows a **visual simulation** (the real ciphertext is binary)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/encryption/encrypt` | Encrypt image (XOR or AES) |
| POST | `/api/encryption/decrypt` | Decrypt image |
| GET | `/api/encryption/generate-key` | Generate secure random key |
| POST | `/api/encryption/key-strength` | Evaluate key strength |
| POST | `/api/analytics/benchmark` | Benchmark XOR vs AES |
| GET | `/api/analytics/algorithms` | Algorithm info cards |

## Supported Image Formats
- PNG
- JPG / JPEG
- BMP

Max file size: **10 MB**

## Pages

1. **Dashboard** — Overview, algorithm comparison cards, how-it-works guide
2. **Encrypt/Decrypt** — Upload image, select algorithm, encrypt, preview, download, decrypt
3. **Analytics** — Run benchmark, view timing/size charts, key strength analysis

## Notes for Presentation

- XOR is included for **educational visualization** only (not secure for real use)
- AES-256-CBC is **real cryptographic encryption** (industry standard)
- The AES "encrypted preview" in the UI is a **visual simulation** — the downloaded `.bin` file contains real ciphertext
- Decryption with the wrong key raises an error (padding validation fails)
