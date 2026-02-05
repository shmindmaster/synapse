#!/usr/bin/env python3
"""
Local Embedding Server for Synapse
Provides OpenAI-compatible embeddings API using sentence-transformers
"""

import logging
import os
import time

from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration from environment
MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
DEVICE = os.getenv("DEVICE", "cpu")  # 'cpu' or 'cuda'
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))

# Load model
logger.info(f"Loading model: {MODEL_NAME} on {DEVICE}")
start_time = time.time()
model = SentenceTransformer(MODEL_NAME, device=DEVICE)
load_time = time.time() - start_time
logger.info(f"Model loaded in {load_time:.2f}s")
logger.info(f"Embedding dimension: {model.get_sentence_embedding_dimension()}")

# Model metadata
MODEL_INFO = {
    "model": MODEL_NAME,
    "dimensions": model.get_sentence_embedding_dimension(),
    "device": DEVICE,
    "max_seq_length": model.max_seq_length,
    "batch_size": BATCH_SIZE,
}


@app.route("/v1/embeddings", methods=["POST"])
def create_embedding():
    """
    Generate embeddings compatible with OpenAI API format

    Request:
        {
            "input": "text to embed" | ["text1", "text2"],
            "model": "model-name"  # optional, ignored
        }

    Response:
        {
            "object": "list",
            "data": [
                {
                    "object": "embedding",
                    "embedding": [0.1, 0.2, ...],
                    "index": 0
                }
            ],
            "model": "all-MiniLM-L6-v2",
            "usage": {
                "prompt_tokens": 10,
                "total_tokens": 10
            }
        }
    """
    try:
        data = request.json

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        input_text = data.get("input")

        if not input_text:
            return jsonify({"error": "No input provided"}), 400

        # Convert single string to list
        if isinstance(input_text, str):
            input_text = [input_text]

        if not isinstance(input_text, list):
            return jsonify({"error": "Input must be string or list of strings"}), 400

        # Validate input
        if len(input_text) == 0:
            return jsonify({"error": "Input list is empty"}), 400

        if len(input_text) > 100:
            return jsonify(
                {"error": f"Too many inputs (max 100, got {len(input_text)})"}
            ), 400

        # Generate embeddings
        start_time = time.time()
        embeddings = model.encode(
            input_text,
            convert_to_numpy=True,
            batch_size=BATCH_SIZE,
            show_progress_bar=False,
            normalize_embeddings=True,  # Cosine similarity optimization
        )
        inference_time = time.time() - start_time

        # Calculate token count (rough estimate)
        total_tokens = sum(len(text.split()) for text in input_text)

        # Format response to match OpenAI API
        response = {
            "object": "list",
            "data": [
                {"object": "embedding", "embedding": emb.tolist(), "index": idx}
                for idx, emb in enumerate(embeddings)
            ],
            "model": MODEL_NAME,
            "usage": {"prompt_tokens": total_tokens, "total_tokens": total_tokens},
        }

        logger.info(
            f"Generated {len(input_text)} embeddings in {inference_time:.3f}s "
            f"({len(input_text) / inference_time:.1f} emb/s)"
        )

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model": MODEL_INFO, "ready": True})


@app.route("/v1/models", methods=["GET"])
def list_models():
    """List available models (OpenAI API compatible)"""
    return jsonify(
        {
            "object": "list",
            "data": [
                {
                    "id": MODEL_NAME,
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "local",
                    "permission": [],
                    "root": MODEL_NAME,
                    "parent": None,
                }
            ],
        }
    )


@app.route("/v1/models/<model_id>", methods=["GET"])
def get_model(model_id):
    """Get model details (OpenAI API compatible)"""
    return jsonify(
        {
            "id": MODEL_NAME,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "local",
            "permission": [],
            "root": MODEL_NAME,
            "parent": None,
            "dimensions": MODEL_INFO["dimensions"],
            "max_seq_length": MODEL_INFO["max_seq_length"],
        }
    )


@app.route("/", methods=["GET"])
def index():
    """Root endpoint with service information"""
    return jsonify(
        {
            "service": "Synapse Local Embedding Server",
            "version": "1.0.0",
            "model": MODEL_INFO,
            "endpoints": {
                "embeddings": "/v1/embeddings",
                "models": "/v1/models",
                "health": "/health",
            },
            "documentation": "https://github.com/shmindmaster/synapse/docs/local-offline-deployment.md",
        }
    )


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Synapse Local Embedding Server")
    logger.info("=" * 60)
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"Dimensions: {MODEL_INFO['dimensions']}")
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Max sequence length: {MODEL_INFO['max_seq_length']}")
    logger.info(f"Batch size: {BATCH_SIZE}")
    logger.info("=" * 60)
    logger.info("Starting server on http://0.0.0.0:8081")
    logger.info("=" * 60)

    app.run(host="0.0.0.0", port=8081, debug=False, threaded=True)
