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

# Java converter JAR path
JAVA_CONVERTER_JAR = os.environ.get("JAVA_CONVERTER_JAR", "/app/converter.jar")


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


def is_java_converter_available():
    """Check if Java converter is available."""
    if not os.path.exists(JAVA_CONVERTER_JAR):
        return False
    # Check if java is available
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, timeout=5)
        return result.returncode == 0
    except:
        return False


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


def convert_pdf_to_docx_with_java(input_path: str, output_path: str) -> bool:
    """Convert PDF to DOCX using Java converter (PDFBox + docx4j).

    Returns True on success, False on failure.
    """
    if not os.path.exists(JAVA_CONVERTER_JAR):
        logger.error(f"Java converter JAR not found: {JAVA_CONVERTER_JAR}")
        return False

    try:
        java_command = [
            'java',
            '-jar', JAVA_CONVERTER_JAR,
            input_path,
            output_path
        ]

        logger.info(f"Running Java converter: {' '.join(java_command)}")

        result = subprocess.run(
            java_command,
            capture_output=True,
            text=True,
            timeout=120
        )

        logger.info(f"Java converter return code: {result.returncode}")
        if result.stdout:
            logger.info(f"Java converter stdout: {result.stdout}")
        if result.stderr:
            logger.info(f"Java converter stderr: {result.stderr}")

        if result.returncode == 0 and os.path.exists(output_path):
            logger.info("Java conversion successful")
            return True

        logger.error(f"Java conversion failed: {result.stderr}")
        return False

    except subprocess.TimeoutExpired:
        logger.error("Java conversion timed out")
        return False
    except Exception as e:
        logger.error(f"Java conversion error: {str(e)}")
        return False


@app.post("/api/pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    """Convert a PDF file to DOCX using Apache PDFBox + docx4j.

    This Java-based converter preserves text formatting, images, and horizontal lines.
    """
    if not is_java_converter_available():
        raise HTTPException(
            status_code=500,
            detail="PDF to DOCX converter not available. Java runtime or converter JAR missing."
        )

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF document")

    start_time = time.time()

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    read_time = time.time()
    logger.info(f"TIMING: File read completed in {read_time - start_time:.3f}s, size: {len(content)} bytes")

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, 'input.pdf')
    output_path = os.path.join(temp_dir, 'output.docx')

    try:
        with open(input_path, 'wb') as f:
            f.write(content)

        write_time = time.time()
        logger.info(f"TIMING: Temp file written in {write_time - read_time:.3f}s")

        if not convert_pdf_to_docx_with_java(input_path, output_path):
            raise HTTPException(
                status_code=500,
                detail="Conversion failed. Please try again or use a different PDF."
            )

        with open(output_path, 'rb') as f:
            docx_content = f.read()

        total_time = time.time()
        logger.info(f"TIMING: Total processing time: {total_time - start_time:.3f}s")

        output_filename = file.filename.rsplit('.', 1)[0] + '.docx'

        return Response(
            content=docx_content,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers={
                'Content-Disposition': f'attachment; filename="{output_filename}"',
                'X-Conversion-Engine': 'java-pdfbox',
            }
        )

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/api/engines")
async def get_available_engines():
    """Get available conversion engines and their status."""
    lo_cmd = get_libreoffice_command()
    gs_cmd = get_ghostscript_command()
    java_available = is_java_converter_available()

    return {
        "pdf_to_docx": {
            "java_pdfbox": {
                "available": java_available,
                "description": "Apache PDFBox + docx4j - preserves text, images, and lines",
                "jar_path": JAVA_CONVERTER_JAR if java_available else None
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
