from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import subprocess
import tempfile
import os
import platform
import shutil
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF2.in API",
    description="API for PDF compression and other operations",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# Security constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
PDF_MAGIC_BYTES = b'%PDF'


def get_ghostscript_command():
    """Get the Ghostscript command for the current platform."""
    if platform.system() == 'Windows':
        # Try common Windows Ghostscript names (check PATH first)
        for cmd in ['gswin64c', 'gswin32c', 'gs']:
            found = shutil.which(cmd)
            if found:
                return found
        # Check common installation paths
        common_paths = [
            r'C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.05.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.04.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.01.2\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.00.0\bin\gswin64c.exe',
            r'C:\Program Files (x86)\gs\gs10.06.0\bin\gswin32c.exe',
            r'C:\Program Files (x86)\gs\gs10.04.0\bin\gswin32c.exe',
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path
        return None
    else:
        # Unix-like systems
        return shutil.which('gs')

# CORS for Next.js frontend
# In production, set ALLOWED_ORIGINS env var (comma-separated)
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Original-Size", "X-Compressed-Size"],
)


@app.on_event("startup")
async def startup_event():
    gs_cmd = get_ghostscript_command()
    if gs_cmd:
        logger.info(f"Ghostscript found at: {gs_cmd}")
    else:
        logger.warning("Ghostscript not found! Compression will not work.")

# Ghostscript quality presets
QUALITY_SETTINGS = {
    "low": "/screen",      # 72 dpi, smallest file
    "medium": "/ebook",    # 150 dpi, balanced
    "high": "/printer",    # 300 dpi, best quality
}


@app.post("/api/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form("medium")
):
    if quality not in QUALITY_SETTINGS:
        raise HTTPException(status_code=400, detail="Invalid quality setting")

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    start_time = time.time()

    # Check if Ghostscript is available
    gs_cmd = get_ghostscript_command()
    logger.info(f"Ghostscript command: {gs_cmd}")
    if not gs_cmd:
        raise HTTPException(
            status_code=500,
            detail="Ghostscript is not installed. Please install Ghostscript from https://ghostscript.com/releases/gsdnld.html"
        )

    # Read uploaded file
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    # Validate PDF magic bytes
    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    read_time = time.time()
    logger.info(f"TIMING: File read completed in {read_time - start_time:.3f}s, size: {len(content)} bytes")

    # Create temp files for input and output
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as input_file:
        input_file.write(content)
        input_path = input_file.name

    output_path = input_path.replace('.pdf', '_compressed.pdf')
    write_time = time.time()
    logger.info(f"TIMING: Temp file written in {write_time - read_time:.3f}s")

    try:
        # Run Ghostscript compression
        gs_command = [
            gs_cmd,
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={QUALITY_SETTINGS[quality]}',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            f'-sOutputFile={output_path}',
            input_path
        ]

        logger.info(f"Running command: {' '.join(gs_command)}")

        result = subprocess.run(
            gs_command,
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        logger.info(f"Ghostscript return code: {result.returncode}")
        if result.stderr:
            logger.info(f"Ghostscript stderr: {result.stderr}")
        if result.stdout:
            logger.info(f"Ghostscript stdout: {result.stdout}")

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Ghostscript compression failed: {result.stderr}"
            )

        gs_time = time.time()
        logger.info(f"TIMING: Ghostscript completed in {gs_time - write_time:.3f}s")

        # Read compressed file
        with open(output_path, 'rb') as f:
            compressed_content = f.read()

        total_time = time.time()
        logger.info(f"TIMING: Total processing time: {total_time - start_time:.3f}s")

        # Return compressed PDF
        return Response(
            content=compressed_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="compressed_{file.filename}"',
                'X-Original-Size': str(len(content)),
                'X-Compressed-Size': str(len(compressed_content)),
            }
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Compression timed out")

    finally:
        # Cleanup temp files
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)


@app.post("/api/lock")
async def lock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not password or len(password) < 1:
        raise HTTPException(status_code=400, detail="Password is required")

    # Read uploaded file
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    # Validate PDF magic bytes
    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    # Create temp files
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as input_file:
        input_file.write(content)
        input_path = input_file.name

    output_path = input_path.replace('.pdf', '_locked.pdf')

    try:
        # Use Ghostscript to encrypt the PDF
        gs_cmd = get_ghostscript_command()
        if not gs_cmd:
            raise HTTPException(status_code=500, detail="Ghostscript is not installed")

        gs_command = [
            gs_cmd,
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            f'-sOwnerPassword={password}',
            f'-sUserPassword={password}',
            '-dEncryptionR=3',
            '-dKeyLength=128',
            '-dPermissions=-3904',
            f'-sOutputFile={output_path}',
            input_path
        ]

        result = subprocess.run(
            gs_command,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to lock PDF: {result.stderr}")

        with open(output_path, 'rb') as f:
            locked_content = f.read()

        return Response(
            content=locked_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="locked_{file.filename}"',
            }
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Operation timed out")

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)


@app.post("/api/unlock")
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    # Read uploaded file
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    # Validate PDF magic bytes
    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    # Create temp files
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as input_file:
        input_file.write(content)
        input_path = input_file.name

    output_path = input_path.replace('.pdf', '_unlocked.pdf')

    try:
        # Use Ghostscript to decrypt the PDF
        gs_cmd = get_ghostscript_command()
        if not gs_cmd:
            raise HTTPException(status_code=500, detail="Ghostscript is not installed")

        gs_command = [
            gs_cmd,
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            f'-sPDFPassword={password}',
            f'-sOutputFile={output_path}',
            input_path
        ]

        result = subprocess.run(
            gs_command,
            capture_output=True,
            text=True,
            timeout=120
        )

        logger.info(f"Unlock return code: {result.returncode}")
        if result.stdout:
            logger.info(f"Unlock stdout: {result.stdout}")
        if result.stderr:
            logger.info(f"Unlock stderr: {result.stderr}")

        # Check for password errors - Ghostscript may return 0 even on password failure
        # Check both stdout and stderr as Ghostscript output varies
        all_output = ((result.stdout or '') + (result.stderr or '')).lower()
        password_error_keywords = ['password did not work', 'cannot decrypt', 'password', 'decrypt', 'encrypted', 'invalid', 'authentication']

        if any(keyword in all_output for keyword in password_error_keywords):
            raise HTTPException(status_code=400, detail="Incorrect password")

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to unlock PDF: {result.stderr or 'Unknown error'}")

        # Verify output file was created and has content
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=400, detail="Incorrect password")

        with open(output_path, 'rb') as f:
            unlocked_content = f.read()

        return Response(
            content=unlocked_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="unlocked_{file.filename}"',
            }
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Operation timed out")

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
