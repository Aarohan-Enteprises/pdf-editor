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


def get_calibre_command():
    """Get the Calibre ebook-convert command."""
    if platform.system() == 'Windows':
        for cmd in ['ebook-convert', 'ebook-convert.exe']:
            found = shutil.which(cmd)
            if found:
                return found
        common_paths = [
            r'C:\Program Files\Calibre2\ebook-convert.exe',
            r'C:\Program Files (x86)\Calibre2\ebook-convert.exe',
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path
        return None
    else:
        return shutil.which('ebook-convert')


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
    expose_headers=["X-Conversion-Engine"],
)


def convert_pdf_to_docx_calibre(input_path: str, output_path: str) -> tuple[bool, str]:
    """Convert PDF to DOCX using Calibre's ebook-convert.

    Returns (success, engine_used)
    """
    calibre_cmd = get_calibre_command()
    if not calibre_cmd:
        return False, "calibre_not_found"

    try:
        # Calibre converts PDF -> DOCX directly
        cmd = [
            calibre_cmd,
            input_path,
            output_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            logger.error(f"Calibre failed: {result.stderr}")
            return False, f"calibre_error: {result.stderr[:200]}"

        if os.path.exists(output_path):
            return True, "calibre"

        return False, "output_not_created"

    except subprocess.TimeoutExpired:
        return False, "timeout"
    except Exception as e:
        logger.error(f"Calibre conversion error: {e}")
        return False, str(e)


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


@app.post("/api/pdf-to-docx")
async def pdf_to_docx_endpoint(file: UploadFile = File(...)):
    """Convert a PDF file to DOCX using Calibre's ebook-convert.

    Calibre provides high-quality PDF to DOCX conversion with good formatting.
    """
    calibre_cmd = get_calibre_command()
    if not calibre_cmd:
        raise HTTPException(
            status_code=500,
            detail="Calibre is not installed. PDF to DOCX conversion requires Calibre."
        )

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF document")

    start_time = time.time()
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    logger.info(f"PDF to DOCX: Processing {len(content)} bytes")

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, 'input.pdf')
    output_path = os.path.join(temp_dir, 'output.docx')

    try:
        with open(input_path, 'wb') as f:
            f.write(content)

        success, engine = convert_pdf_to_docx_calibre(input_path, output_path)

        if not success:
            raise HTTPException(
                status_code=500,
                detail=f"Conversion failed: {engine}"
            )

        with open(output_path, 'rb') as f:
            docx_content = f.read()

        total_time = time.time() - start_time
        logger.info(f"PDF to DOCX: Completed in {total_time:.2f}s using {engine}")

        output_filename = file.filename.rsplit('.', 1)[0] + '.docx'

        return Response(
            content=docx_content,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers={
                'Content-Disposition': f'attachment; filename="{output_filename}"',
                'X-Conversion-Engine': engine,
            }
        )

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/api/engines")
async def get_available_engines():
    """Get available conversion engines and their status."""
    lo_cmd = get_libreoffice_command()
    gs_cmd = get_ghostscript_command()
    calibre_cmd = get_calibre_command()

    return {
        "pdf_to_docx": {
            "calibre": {
                "available": calibre_cmd is not None,
                "path": calibre_cmd,
                "description": "Calibre ebook-convert for PDF to DOCX"
            }
        },
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
