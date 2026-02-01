from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import subprocess
import tempfile
import os
import platform
import shutil
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
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

    # Create temp files for input and output
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as input_file:
        input_file.write(content)
        input_path = input_file.name

    output_path = input_path.replace('.pdf', '_compressed.pdf')

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

        # Read compressed file
        with open(output_path, 'rb') as f:
            compressed_content = f.read()

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


@app.get("/health")
async def health_check():
    return {"status": "ok"}
