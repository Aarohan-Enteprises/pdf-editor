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
import glob as glob_module

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
        for cmd in ['gswin64c', 'gswin32c', 'gs']:
            found = shutil.which(cmd)
            if found:
                return found
        common_paths = [
            r'C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.05.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.04.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe',
            r'C:\Program Files (x86)\gs\gs10.06.0\bin\gswin32c.exe',
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path
        return None
    else:
        return shutil.which('gs')


def get_libreoffice_command():
    """Get the LibreOffice command for the current platform."""
    if platform.system() == 'Windows':
        for cmd in ['soffice', 'soffice.exe']:
            found = shutil.which(cmd)
            if found:
                return found
        search_patterns = [
            r'C:\Program Files\LibreOffice*\program\soffice.exe',
            r'C:\Program Files (x86)\LibreOffice*\program\soffice.exe',
        ]
        for pattern in search_patterns:
            matches = glob_module.glob(pattern)
            if matches:
                return matches[0]
        return None
    else:
        return shutil.which('soffice') or shutil.which('libreoffice')


# CORS for Next.js frontend
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form("medium")
):
    """Compress a PDF file using Ghostscript."""
    gs_cmd = get_ghostscript_command()
    if not gs_cmd:
        raise HTTPException(
            status_code=500,
            detail="Ghostscript is not installed. PDF compression requires Ghostscript."
        )

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF document")

    quality_settings = {
        "low": "/screen",
        "medium": "/ebook",
        "high": "/printer",
        "maximum": "/prepress"
    }

    if quality not in quality_settings:
        raise HTTPException(status_code=400, detail=f"Invalid quality. Choose from: {list(quality_settings.keys())}")

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, 'input.pdf')
    output_path = os.path.join(temp_dir, 'output.pdf')

    try:
        with open(input_path, 'wb') as f:
            f.write(content)

        gs_command = [
            gs_cmd,
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={quality_settings[quality]}',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            f'-sOutputFile={output_path}',
            input_path
        ]

        result = subprocess.run(gs_command, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Compression failed: {result.stderr}")

        with open(output_path, 'rb') as f:
            compressed_content = f.read()

        output_filename = file.filename.rsplit('.', 1)[0] + '-compressed.pdf'

        return Response(
            content=compressed_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{output_filename}"',
                'X-Original-Size': str(len(content)),
                'X-Compressed-Size': str(len(compressed_content)),
            }
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Compression timed out")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    """Convert a DOCX file to PDF using LibreOffice."""
    lo_cmd = get_libreoffice_command()
    if not lo_cmd:
        raise HTTPException(
            status_code=500,
            detail="LibreOffice is not installed. DOCX to PDF conversion requires LibreOffice."
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(('.docx', '.doc')):
        raise HTTPException(status_code=400, detail="File must be a Word document (.doc or .docx)")

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, 'input.docx')

    try:
        with open(input_path, 'wb') as f:
            f.write(content)

        lo_command = [
            lo_cmd,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', temp_dir,
            input_path
        ]

        result = subprocess.run(lo_command, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.stderr}")

        output_path = os.path.join(temp_dir, 'input.pdf')

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion failed: output PDF not created")

        with open(output_path, 'rb') as f:
            pdf_content = f.read()

        output_filename = file.filename.rsplit('.', 1)[0] + '.pdf'

        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{output_filename}"',
            }
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Conversion timed out")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/api/engines")
async def get_available_engines():
    """Get available conversion engines and their status."""
    lo_cmd = get_libreoffice_command()
    gs_cmd = get_ghostscript_command()

    return {
        "docx_to_pdf": {
            "libreoffice": {
                "available": lo_cmd is not None,
                "path": lo_cmd
            }
        },
        "compression": {
            "ghostscript": {
                "available": gs_cmd is not None,
                "path": gs_cmd
            }
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
