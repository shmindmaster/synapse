"""
Unified Ingestion Service
Handles Web, PDF, and File ingestion with RAG
"""
import os
import json
import hashlib
from typing import List, Dict, Optional
from datetime import datetime

# Core libraries
from firecrawl import FirecrawlApp
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
import psycopg2
from pgvector.psycopg2 import register_vector
import boto3

class UnifiedIngestor:
    """
    Handles ingestion from multiple sources into RAG system
    - Web scraping (Firecrawl)
    - PDF processing (PyPDF)
    - Storage (S3-compatible with app-level isolation)
    - Embeddings via configurable embedding service
    """

    def __init__(self):
        # Database
        self.db_url = os.getenv("DATABASE_URL")
        self.app_slug = os.getenv("APP_SLUG", "synapse")  # Default to 'synapse'

        # AI Clients
        self.firecrawl = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))
        self.ai_client = OpenAI(
            base_url=os.getenv("OPENAI_API_BASE"),
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.embed_model = os.getenv("MODEL_EMBEDDING", "text-embedding-3-small")  # Default to OpenAI

        # Storage (S3-compatible with app isolation)
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )
        self.bucket = os.getenv("AWS_BUCKET_NAME")
        self.prefix = os.getenv("OBJECT_STORAGE_PREFIX", "synapse/")  # Default to "synapse/"

    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding using configured embedding model"""
        text = text.replace("\n", " ").strip()
        response = self.ai_client.embeddings.create(
            model=self.embed_model,
            input=text
        )
        return response.data[0].embedding

    def _store_chunks(self, chunks: List, metadata: Dict):
        """Batch insert chunks into Postgres with pgvector"""
        conn = psycopg2.connect(self.db_url)
        register_vector(conn)
        cur = conn.cursor()

        for idx, chunk in enumerate(chunks):
            content = chunk.page_content if hasattr(chunk, 'page_content') else str(chunk)
            vector = self._get_embedding(content)

            # Merge chunk metadata with provided metadata
            row_meta = {
                **metadata,
                "chunk_index": idx,
                "ingested_at": datetime.utcnow().isoformat(),
                "app_slug": self.app_slug
            }

            cur.execute(
                """
                INSERT INTO embeddings (content, metadata, embedding)
                VALUES (%s, %s, %s)
                """,
                (content, json.dumps(row_meta), vector)
            )

        conn.commit()
        conn.close()
        print(f"✅ Stored {len(chunks)} chunks in vector DB")

    def upload_file(self, file_path: str, file_name: str) -> str:
        """Upload file to Shared Storage with App-Level Isolation"""
        key = f"{self.prefix}{file_name}"  # e.g., "voxops/report.pdf"
        self.s3_client.upload_file(file_path, self.bucket, key)
        url = f"{os.getenv('CDN_BASE_URL')}/{file_name}"
        print(f"✅ Uploaded {file_name} to {url}")
        return url

    def ingest_url(self, url: str, metadata: Optional[Dict] = None):
        """Ingest from Web: URL -> Markdown -> Chunks -> Vectors"""
        print(f"🌐 Scraping {url}...")
        scrape = self.firecrawl.scrape_url(url, params={'formats': ['markdown']})
        content = scrape.get('markdown', '')

        # Split markdown into chunks
        splitter = RecursiveCharacterTextSplitter.from_language(
            language="markdown",
            chunk_size=1000,
            chunk_overlap=200
        )
        docs = splitter.create_documents([content])

        # Store with metadata
        meta = metadata or {}
        meta.update({"type": "web", "source": url})
        self._store_chunks(docs, meta)
        print(f"✅ Ingested {len(docs)} chunks from {url}")

    def ingest_pdf(self, file_path: str, metadata: Optional[Dict] = None):
        """Ingest from PDF: File -> Text -> Chunks -> Vectors"""
        print(f"📄 Processing PDF {file_path}...")
        loader = PyPDFLoader(file_path)
        pages = loader.load()

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        docs = splitter.split_documents(pages)

        # Upload PDF to storage
        file_name = os.path.basename(file_path)
        cdn_url = self.upload_file(file_path, file_name)

        # Store with metadata
        meta = metadata or {}
        meta.update({"type": "pdf", "source": cdn_url, "filename": file_name})
        self._store_chunks(docs, meta)
        print(f"✅ Ingested {len(docs)} chunks from PDF")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Semantic search across ingested content"""
        query_vector = self._get_embedding(query)

        conn = psycopg2.connect(self.db_url)
        register_vector(conn)
        cur = conn.cursor()

        cur.execute(
            """
            SELECT content, metadata, embedding <-> %s::vector AS distance
            FROM embeddings
            ORDER BY distance
            LIMIT %s
            """,
            (query_vector, top_k)
        )

        results = []
        for row in cur.fetchall():
            results.append({
                "content": row[0],
                "metadata": row[1],
                "distance": float(row[2])
            })

        conn.close()
        return results

# Example usage
if __name__ == "__main__":
    ingestor = UnifiedIngestor()

    # Ingest from web
    # ingestor.ingest_url("https://example.com/article")

    # Ingest from PDF
    # ingestor.ingest_pdf("/path/to/document.pdf")

    # Search
    # results = ingestor.search("What is the main topic?")
    # for r in results:
    #     print(f"{r['distance']:.3f}: {r['content'][:100]}...")
