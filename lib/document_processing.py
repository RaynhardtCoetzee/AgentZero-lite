import io
import os
import tempfile
from typing import List, Tuple, Optional, Dict, Any
from uuid import uuid4

import marker
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
import pypandoc
import psycopg2
from psycopg2.extras import Json
from langchain_text_splitters import MarkdownHeaderTextSplitter

_marker_models = None

def _get_marker_models():
    global _marker_models
    if _marker_models is None:
        _marker_models = create_model_dict()
    return _marker_models

def process_document_to_markdown(file_bytes: bytes, file_type: str) -> str:
    """Convert document to Markdown."""
    if file_type.lower() in ('pdf',):
        return _convert_pdf_to_markdown(file_bytes)
    else:
        return _convert_to_markdown_pypandoc(file_bytes, file_type)

def _convert_pdf_to_markdown(file_bytes: bytes) -> str:
    """Convert PDF to Markdown using marker-pdf."""
    pdf_buffer = io.BytesIO(file_bytes)
    converter = PdfConverter(pdf_buffer, model_dict=_get_marker_models())
    markdown_content, _, _ = converter.convert()
    return markdown_content

def _convert_to_markdown_pypandoc(file_bytes: bytes, file_type: str) -> str:
    """Convert document to Markdown using pypandoc."""
    format_map = {
        'docx': 'docx',
        'doc': 'docx',
        'txt': 'plain',
        'html': 'html',
        'rtf': 'rtf',
        'odt': 'odt',
        'epub': 'epub',
        'md': 'markdown',
        'markdown': 'markdown',
    }

    input_format = format_map.get(file_type.lower(), 'plain')

    with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_type}') as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        markdown_content = pypandoc.convert_file(
            tmp_path,
            'md',
            inputformat=input_format
        )
        return markdown_content
    finally:
        os.unlink(tmp_path)

def chunk_markdown(content: str) -> List[Tuple[str, Dict[str, Any]]]:
    """
    Chunk Markdown content preserving header hierarchy.
    Returns list of (chunk_text, metadata) tuples.
    """
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]

    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        return_each_line=False,
        strip_headers=False
    )

    docs = splitter.split_text(content)
    chunks = []
    for doc in docs:
        chunk_text = doc.page_content
        metadata = {
            'headers': doc.metadata,
        }
        chunks.append((chunk_text, metadata))

    return chunks

def insert_document_and_chunks(
    db_connection,
    document_id: str,
    file_name: str,
    markdown_content: str,
    chunks: List[Tuple[str, Dict[str, Any]]],
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Insert Markdown content and chunks into PostgreSQL.
    Tables: public.documents, public.document_chunks
    """
    cursor = db_connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO public.documents (id, file_name, content, metadata)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                content = EXCLUDED.content,
                metadata = EXCLUDED.metadata
            """,
            (document_id, file_name, markdown_content, Json(metadata or {}))
        )

        for chunk_order, (chunk_text, chunk_metadata) in enumerate(chunks):
            chunk_id = str(uuid4())
            cursor.execute(
                """
                INSERT INTO public.document_chunks
                (id, document_id, content, metadata, chunk_order)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (chunk_id, document_id, chunk_text, Json(chunk_metadata), chunk_order)
            )

        db_connection.commit()
    except Exception as e:
        db_connection.rollback()
        raise e
    finally:
        cursor.close()

def process_and_store_document(
    db_connection,
    file_bytes: bytes,
    file_name: str,
    file_type: str,
    document_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Orchestrate document processing and storage.
    Returns document_id.
    """
    if document_id is None:
        document_id = str(uuid4())

    markdown_content = process_document_to_markdown(file_bytes, file_type)
    chunks = chunk_markdown(markdown_content)

    doc_metadata = metadata or {}
    doc_metadata['original_file_name'] = file_name
    doc_metadata['file_type'] = file_type

    insert_document_and_chunks(
        db_connection,
        document_id,
        file_name,
        markdown_content,
        chunks,
        doc_metadata
    )

    return document_id
