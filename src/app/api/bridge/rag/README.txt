This directory contains bridge proxy endpoints for RAG operations:
- POST /api/bridge/rag/index-framework
- POST /api/bridge/rag/search
- POST /api/bridge/rag/relevant-elements
- DELETE /api/bridge/rag/framework/:id
- GET /api/bridge/rag/stats

These currently use the local ragSystem as a fallback. Backend HTTP endpoints can be added later and the bridge can be updated to forward instead.

