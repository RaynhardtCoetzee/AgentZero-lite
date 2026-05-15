from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import Json
import os
from typing import Optional, List
import logging

from lib.document_processing import (
    process_and_store_document,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class ProcessDocumentRequest(BaseModel):
    documentId: str
    fileBytes: List[int]
    fileName: str
    fileType: str
    metadata: Optional[dict] = None

class ProcessDocumentResponse(BaseModel):
    documentId: str
    chunkCount: int
    status: str

def get_db_connection():
    """Get PostgreSQL connection from Supabase."""
    return psycopg2.connect(
        host=os.getenv('SUPABASE_HOST'),
        port=5432,
        user=os.getenv('SUPABASE_USER', 'postgres'),
        password=os.getenv('SUPABASE_PASSWORD'),
        database=os.getenv('SUPABASE_DATABASE', 'postgres'),
        sslmode='require',
    )

@app.post('/process-document', response_model=ProcessDocumentResponse)
async def process_document(request: ProcessDocumentRequest):
    """Process document to Markdown and store chunks."""
    try:
        # Convert list of ints back to bytes
        file_bytes = bytes(request.fileBytes)

        # Get database connection
        db_conn = get_db_connection()

        try:
            # Process and store document
            doc_id = process_and_store_document(
                db_conn,
                file_bytes,
                request.fileName,
                request.fileType,
                request.documentId,
                request.metadata,
            )

            # Count chunks
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM public.document_chunks WHERE document_id = %s",
                (doc_id,)
            )
            chunk_count = cursor.fetchone()[0]
            cursor.close()

            logger.info(f"Processed document {doc_id} with {chunk_count} chunks")

            return ProcessDocumentResponse(
                documentId=doc_id,
                chunkCount=chunk_count,
                status='success',
            )
        finally:
            db_conn.close()

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/health')
async def health():
    """Health check endpoint."""
    return {'status': 'ok'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
