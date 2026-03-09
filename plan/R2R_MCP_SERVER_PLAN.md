# План реализации R2R MCP Server на FastMCP

## R2R MCP Server Implementation Plan using FastMCP

> **Цель:** Создать полнофункциональный MCP server, который предоставляет все возможности R2R API через Model Context Protocol для максимальной эффективности программиста

---

## 📚 Часть 1: Исследование FastMCP и MCP Protocol

### 1.1 FastMCP Framework

**Основные компоненты:**

1. **FastMCP Server** - центральный объект MCP приложения

   ```python
   from fastmcp import FastMCP

   mcp = FastMCP(name="R2RServer")
   ```

2. **Tools** - исполняемые функции для LLM

   ```python
   @mcp.tool
   def my_tool(param: str) -> str:
       """Tool description."""
       return result
   ```

3. **Resources** - read-only источники данных

   ```python
   @mcp.resource("r2r://documents/{id}")
   def get_document(id: str):
       return document_data
   ```

4. **Prompts** - переиспользуемые шаблоны

   ```python
   @mcp.prompt
   def code_review_prompt(code: str) -> str:
       return f"Review this code:\n{code}"
   ```

5. **Context** - доступ к MCP сессии
   ```python
   @mcp.tool
   async def process_data(ctx: Context):
       await ctx.info("Processing...")
       data = await ctx.read_resource("resource://data")
       return result
   ```

### 1.2 MCP Protocol Capabilities

**Transport Options:**

- **STDIO** - для локальных серверов
- **HTTP/SSE** - для удаленных серверов
- **Streamable HTTP** - рекомендуемый для production

**Features:**

- Streaming responses
- Progress reporting
- Resource access
- Tool calling
- Prompt templates
- Context management

---

## 🎯 Часть 2: Архитектура R2R MCP Server

### 2.1 Структура проекта

```
r2r-mcp-server/
├── src/
│   ├── __init__.py
│   ├── server.py                 # Main FastMCP server
│   ├── config.py                 # Configuration
│   ├── r2r_client.py             # R2R API client wrapper
│   │
│   ├── tools/                    # MCP Tools
│   │   ├── __init__.py
│   │   ├── documents.py          # Document operations
│   │   ├── search.py              # Search operations
│   │   ├── rag.py                 # RAG operations
│   │   ├── agent.py               # Agent operations
│   │   ├── collections.py         # Collection operations
│   │   ├── chunks.py              # Chunk operations
│   │   ├── embeddings.py          # Embedding operations
│   │   ├── knowledge_graph.py     # KG operations
│   │   └── code_specific.py       # Code-specific tools
│   │
│   ├── resources/                 # MCP Resources
│   │   ├── __init__.py
│   │   ├── documents.py
│   │   ├── collections.py
│   │   ├── chunks.py
│   │   └── knowledge_graph.py
│   │
│   ├── prompts/                   # MCP Prompts
│   │   ├── __init__.py
│   │   ├── code_review.py
│   │   ├── code_explanation.py
│   │   ├── code_generation.py
│   │   └── documentation.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── gemini_config.py       # Gemini integration
│       ├── validators.py
│       └── formatters.py
│
├── tests/
│   ├── test_tools.py
│   ├── test_resources.py
│   └── test_prompts.py
│
├── requirements.txt
├── pyproject.toml
├── README.md
└── .env.example
```

### 2.2 Основные компоненты

#### 2.2.1 R2R Client Wrapper

```python
# src/r2r_client.py
from r2r import R2RClient
from typing import Optional, Dict, Any
import os

class R2RClientWrapper:
    """Wrapper для R2R API с Gemini оптимизацией."""

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or os.getenv("R2R_BASE_URL", "http://localhost:7272")
        self.api_key = api_key or os.getenv("R2R_API_KEY")
        self.client = R2RClient(base_url=self.base_url, api_key=self.api_key)

        # Gemini конфигурация по умолчанию
        self.default_gemini_config = {
            "model": "google/gemini-2.5-flash",
            "temperature": 0.3,
            "thinking_budget": -1,  # Dynamic
        }

    def get_client(self) -> R2RClient:
        return self.client

    def get_gemini_config(self, task_type: str = "rag") -> Dict[str, Any]:
        """Получить Gemini конфигурацию для задачи."""
        configs = {
            "rag": {
                "model": "google/gemini-2.5-flash",
                "temperature": 0.3,
                "thinking_budget": -1,
            },
            "code": {
                "model": "google/gemini-2.5-flash",
                "temperature": 0.2,
                "thinking_budget": 2048,
            },
            "reasoning": {
                "model": "google/gemini-2.5-pro",
                "temperature": 0.2,
                "thinking_budget": 8192,
            },
        }
        return configs.get(task_type, self.default_gemini_config)
```

---

## 🛠️ Часть 3: Реализация MCP Tools

### 3.1 Document Tools

```python
# src/tools/documents.py
from fastmcp import FastMCP, Context
from typing import Optional, Dict, Any, List
from r2r_client import R2RClientWrapper
import asyncio

def register_document_tools(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация document tools."""

    @mcp.tool
    async def upload_document(
        file_path: str,
        collection_ids: Optional[List[str]] = None,
        ingestion_mode: str = "fast",
        metadata: Optional[Dict[str, Any]] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Upload a document to R2R.

        Args:
            file_path: Path to the file to upload
            collection_ids: List of collection IDs to add document to
            ingestion_mode: 'fast', 'hi-res', or 'custom'
            metadata: Additional metadata for the document
        """
        if ctx:
            await ctx.info(f"Uploading document: {file_path}")

        try:
            with open(file_path, 'rb') as f:
                result = await asyncio.to_thread(
                    r2r_client.client.documents.create,
                    file=f,
                    collection_ids=collection_ids or [],
                    ingestion_mode=ingestion_mode,
                    metadata=metadata or {}
                )

            if ctx:
                await ctx.info(f"Document uploaded successfully: {result.results.id}")

            return {
                "document_id": result.results.id,
                "status": "success",
                "ingestion_status": result.results.ingestionStatus,
            }
        except Exception as e:
            if ctx:
                await ctx.error(f"Error uploading document: {str(e)}")
            raise

    @mcp.tool
    async def get_document(
        document_id: str,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """Retrieve a document by ID."""
        if ctx:
            await ctx.info(f"Retrieving document: {document_id}")

        result = await asyncio.to_thread(
            r2r_client.client.documents.retrieve,
            id=document_id
        )

        return {
            "id": result.results.id,
            "title": result.results.title,
            "metadata": result.results.metadata,
            "ingestion_status": result.results.ingestionStatus,
            "chunk_count": result.results.chunkCount,
        }

    @mcp.tool
    async def list_documents(
        limit: int = 20,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """List documents with pagination and filters."""
        if ctx:
            await ctx.info(f"Listing documents (limit={limit}, offset={offset})")

        result = await asyncio.to_thread(
            r2r_client.client.documents.list,
            limit=limit,
            offset=offset,
            filters=filters
        )

        return {
            "documents": [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "metadata": doc.metadata,
                    "ingestion_status": doc.ingestionStatus,
                }
                for doc in result.results
            ],
            "total": len(result.results),
        }

    @mcp.tool
    async def delete_document(
        document_id: str,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """Delete a document."""
        if ctx:
            await ctx.info(f"Deleting document: {document_id}")

        await asyncio.to_thread(
            r2r_client.client.documents.delete,
            id=document_id
        )

        return {"status": "deleted", "document_id": document_id}

    @mcp.tool
    async def update_document_metadata(
        document_id: str,
        metadata: Dict[str, Any],
        ctx: Context = None
    ) -> Dict[str, Any]:
        """Update document metadata."""
        if ctx:
            await ctx.info(f"Updating metadata for document: {document_id}")

        result = await asyncio.to_thread(
            r2r_client.client.documents.update,
            id=document_id,
            metadata=metadata
        )

        return {"status": "updated", "document_id": document_id}
```

### 3.2 Search Tools

```python
# src/tools/search.py
from fastmcp import FastMCP, Context
from typing import Optional, Dict, Any, List
from r2r_client import R2RClientWrapper
import asyncio

def register_search_tools(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация search tools."""

    @mcp.tool
    async def semantic_search(
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        use_hybrid: bool = True,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Perform semantic search with optional hybrid search.

        Args:
            query: Search query
            limit: Maximum number of results
            filters: Search filters
            use_hybrid: Enable hybrid search (semantic + full-text)
        """
        if ctx:
            await ctx.info(f"Searching: {query}")
            await ctx.report_progress(0, 100, "Starting search")

        search_settings = {
            "use_semantic_search": True,
            "use_hybrid_search": use_hybrid,
            "limit": limit,
        }

        if filters:
            search_settings["filters"] = filters

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.search,
            query=query,
            search_settings=search_settings
        )

        if ctx:
            await ctx.report_progress(100, 100, "Search completed")

        return {
            "query": query,
            "results": [
                {
                    "text": r.text,
                    "score": r.score,
                    "metadata": r.metadata,
                    "chunk_id": getattr(r, 'id', None),
                }
                for r in result.results.chunk_search_results
            ],
            "total": len(result.results.chunk_search_results),
        }

    @mcp.tool
    async def hyde_search(
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Perform HyDE (Hypothetical Document Embeddings) search.

        HyDE generates a hypothetical document that would answer the query,
        then searches using that document.
        """
        if ctx:
            await ctx.info(f"HyDE search: {query}")

        search_settings = {
            "search_strategy": "hyde",
            "limit": limit,
        }

        if filters:
            search_settings["filters"] = filters

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=query,
            search_settings=search_settings,
            rag_generation_config=r2r_client.get_gemini_config("rag")
        )

        return {
            "query": query,
            "strategy": "hyde",
            "results": result.results,
        }

    @mcp.tool
    async def code_search(
        query: str,
        language: Optional[str] = None,
        function_name: Optional[str] = None,
        limit: int = 10,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Search for code snippets.

        Args:
            query: Search query
            language: Programming language filter (e.g., 'python', 'typescript')
            function_name: Filter by function name
            limit: Maximum results
        """
        if ctx:
            await ctx.info(f"Code search: {query}")

        filters = {
            "code_type": {"$eq": "source_code"},
        }

        if language:
            filters["language"] = {"$eq": language}

        if function_name:
            filters["function_name"] = {"$eq": function_name}

        search_settings = {
            "use_semantic_search": True,
            "use_hybrid_search": True,
            "filters": filters,
            "limit": limit,
        }

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.search,
            query=query,
            search_settings=search_settings
        )

        return {
            "query": query,
            "language": language,
            "results": [
                {
                    "code": r.text,
                    "score": r.score,
                    "metadata": r.metadata,
                    "language": r.metadata.get("language"),
                    "function_name": r.metadata.get("function_name"),
                }
                for r in result.results.chunk_search_results
            ],
        }
```

### 3.3 RAG Tools

````python
# src/tools/rag.py
from fastmcp import FastMCP, Context
from typing import Optional, Dict, Any
from r2r_client import R2RClientWrapper
import asyncio

def register_rag_tools(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация RAG tools."""

    @mcp.tool
    async def rag_query(
        query: str,
        search_settings: Optional[Dict[str, Any]] = None,
        generation_config: Optional[Dict[str, Any]] = None,
        use_gemini: bool = True,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Perform RAG (Retrieval-Augmented Generation) query.

        Args:
            query: User query
            search_settings: Custom search settings
            generation_config: Custom generation config
            use_gemini: Use Gemini-optimized config
        """
        if ctx:
            await ctx.info(f"RAG query: {query}")
            await ctx.report_progress(0, 100, "Retrieving context")

        # Default search settings
        default_search = {
            "use_semantic_search": True,
            "use_hybrid_search": True,
            "limit": 10,
        }

        # Merge with provided settings
        final_search = {**default_search, **(search_settings or {})}

        # Generation config
        if use_gemini:
            gemini_config = r2r_client.get_gemini_config("rag")
            final_gen_config = {**gemini_config, **(generation_config or {})}
        else:
            final_gen_config = generation_config or {}

        if ctx:
            await ctx.report_progress(50, 100, "Generating response")

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=query,
            search_settings=final_search,
            rag_generation_config=final_gen_config
        )

        if ctx:
            await ctx.report_progress(100, 100, "Complete")

        return {
            "query": query,
            "answer": result.results.generated_answer,
            "sources": [
                {
                    "text": chunk.text,
                    "score": chunk.score,
                    "metadata": chunk.metadata,
                }
                for chunk in getattr(result.results, 'chunks', [])
            ],
        }

    @mcp.tool
    async def code_rag(
        query: str,
        code_context: Optional[str] = None,
        language: Optional[str] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        RAG query optimized for code.

        Args:
            query: Programming question
            code_context: Additional code context
            language: Programming language
        """
        if ctx:
            await ctx.info(f"Code RAG: {query}")

        # Enhance query with code context
        enhanced_query = query
        if code_context:
            enhanced_query = f"{query}\n\nCode context:\n```\n{code_context}\n```"

        # Use code-optimized Gemini config
        gemini_config = r2r_client.get_gemini_config("code")

        search_settings = {
            "use_semantic_search": True,
            "use_hybrid_search": True,
            "filters": {
                "code_type": {"$eq": "source_code"},
            },
            "limit": 15,
        }

        if language:
            search_settings["filters"]["language"] = {"$eq": language}

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=enhanced_query,
            search_settings=search_settings,
            rag_generation_config=gemini_config
        )

        return {
            "query": query,
            "answer": result.results.generated_answer,
            "code_examples": [
                chunk.text
                for chunk in getattr(result.results, 'chunks', [])
                if chunk.metadata.get("code_type") == "source_code"
            ],
        }
````

### 3.4 Agent Tools

```python
# src/tools/agent.py
from fastmcp import FastMCP, Context
from typing import Optional, Dict, Any, List
from r2r_client import R2RClientWrapper
import asyncio

def register_agent_tools(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация agent tools."""

    @mcp.tool
    async def agent_query(
        message: str,
        mode: str = "rag",
        tools: Optional[List[str]] = None,
        conversation_id: Optional[str] = None,
        use_gemini: bool = True,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Query R2R Agent (Agentic RAG).

        Args:
            message: User message
            mode: 'rag' or 'research'
            tools: List of tools for agent (e.g., ['search_file_knowledge'])
            conversation_id: Conversation ID for context
            use_gemini: Use Gemini-optimized config
        """
        if ctx:
            await ctx.info(f"Agent query (mode={mode}): {message}")

        # Agent message format
        agent_message = {
            "role": "user",
            "content": message,
        }

        # Generation config
        if use_gemini:
            if mode == "research":
                gemini_config = r2r_client.get_gemini_config("reasoning")
            else:
                gemini_config = r2r_client.get_gemini_config("rag")
        else:
            gemini_config = {}

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.agent,
            message=agent_message,
            mode=mode,
            rag_tools=tools or ["search_file_knowledge"],
            conversation_id=conversation_id,
            rag_generation_config=gemini_config
        )

        return {
            "message": message,
            "mode": mode,
            "response": result.results.generated_answer,
            "tool_calls": getattr(result.results, 'tool_calls', []),
            "conversation_id": conversation_id,
        }
```

### 3.5 Code-Specific Tools

````python
# src/tools/code_specific.py
from fastmcp import FastMCP, Context
from typing import Optional, Dict, Any, List
from r2r_client import R2RClientWrapper
import asyncio

def register_code_tools(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация code-specific tools."""

    @mcp.tool
    async def generate_code(
        description: str,
        language: str,
        context: Optional[str] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Generate code based on description.

        Args:
            description: What code to generate
            language: Programming language
            context: Additional context or requirements
        """
        if ctx:
            await ctx.info(f"Generating {language} code: {description}")

        prompt = f"Generate {language} code for: {description}"
        if context:
            prompt += f"\n\nContext:\n```\n{context}\n```"

        gemini_config = r2r_client.get_gemini_config("code")

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=prompt,
            search_settings={
                "filters": {
                    "code_type": {"$eq": "source_code"},
                    "language": {"$eq": language},
                },
                "use_semantic_search": True,
                "limit": 10,
            },
            rag_generation_config=gemini_config
        )

        return {
            "description": description,
            "language": language,
            "code": result.results.generated_answer,
            "examples": [
                chunk.text
                for chunk in getattr(result.results, 'chunks', [])
            ],
        }

    @mcp.tool
    async def analyze_code(
        code: str,
        language: str,
        analysis_type: str = "general",
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Analyze code for quality, structure, issues.

        Args:
            code: Code to analyze
            language: Programming language
            analysis_type: 'general', 'security', 'performance', 'style'
        """
        if ctx:
            await ctx.info(f"Analyzing {language} code ({analysis_type})")

        analysis_prompts = {
            "general": "Analyze this code for quality, structure, and best practices",
            "security": "Analyze this code for security vulnerabilities",
            "performance": "Analyze this code for performance issues",
            "style": "Analyze this code for style and conventions",
        }

        prompt = f"{analysis_prompts.get(analysis_type, analysis_prompts['general'])}:\n\n```{language}\n{code}\n```"

        gemini_config = r2r_client.get_gemini_config("reasoning")
        gemini_config["temperature"] = 0.1  # Lower for analysis

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=prompt,
            rag_generation_config=gemini_config
        )

        return {
            "code": code,
            "language": language,
            "analysis_type": analysis_type,
            "analysis": result.results.generated_answer,
        }

    @mcp.tool
    async def extract_code_structure(
        code: str,
        language: str,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """Extract structure from code (functions, classes, imports)."""
        if ctx:
            await ctx.info(f"Extracting structure from {language} code")

        prompt = f"Extract code structure from this {language} code:\n```{language}\n{code}\n```\n\nReturn JSON with functions, classes, imports, and dependencies."

        gemini_config = r2r_client.get_gemini_config("code")

        result = await asyncio.to_thread(
            r2r_client.client.retrieval.rag,
            query=prompt,
            rag_generation_config=gemini_config
        )

        return {
            "code": code,
            "language": language,
            "structure": result.results.generated_answer,
        }
````

---

## 📦 Часть 4: Реализация MCP Resources

### 4.1 Document Resources

```python
# src/resources/documents.py
from fastmcp import FastMCP, Context
from r2r_client import R2RClientWrapper
import asyncio

def register_document_resources(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация document resources."""

    @mcp.resource("r2r://documents/{document_id}")
    async def get_document_resource(document_id: str, ctx: Context = None) -> str:
        """Get document content as resource."""
        result = await asyncio.to_thread(
            r2r_client.client.documents.retrieve,
            id=document_id
        )

        return f"""
# Document: {result.results.title}

**ID:** {result.results.id}
**Status:** {result.results.ingestionStatus}
**Chunks:** {result.results.chunkCount}

## Metadata
{result.results.metadata}

## Content
{getattr(result.results, 'content', 'N/A')}
"""

    @mcp.resource("r2r://documents/{document_id}/chunks")
    async def get_document_chunks(document_id: str, ctx: Context = None) -> str:
        """Get all chunks for a document."""
        chunks = await asyncio.to_thread(
            r2r_client.client.documents.listChunks,
            id=document_id
        )

        chunks_text = "\n\n---\n\n".join([
            f"## Chunk {i+1}\n\n{chunk.text}\n\n**Metadata:** {chunk.metadata}"
            for i, chunk in enumerate(chunks.results)
        ])

        return chunks_text
```

### 4.2 Collection Resources

```python
# src/resources/collections.py
from fastmcp import FastMCP, Context
from r2r_client import R2RClientWrapper
import asyncio

def register_collection_resources(mcp: FastMCP, r2r_client: R2RClientWrapper):
    """Регистрация collection resources."""

    @mcp.resource("r2r://collections/{collection_id}")
    async def get_collection_resource(collection_id: str, ctx: Context = None) -> str:
        """Get collection information."""
        result = await asyncio.to_thread(
            r2r_client.client.collections.retrieve,
            id=collection_id
        )

        return f"""
# Collection: {result.results.name}

**ID:** {result.results.id}
**Description:** {result.results.description}
**Document Count:** {getattr(result.results, 'document_count', 'N/A')}
**Metadata:** {result.results.metadata}
"""
```

---

## 💬 Часть 5: Реализация MCP Prompts

### 5.1 Code Review Prompt

````python
# src/prompts/code_review.py
from fastmcp import FastMCP

def register_code_review_prompts(mcp: FastMCP):
    """Регистрация code review prompts."""

    @mcp.prompt
    def review_code(code: str, language: str = "python") -> str:
        """
        Generate a code review prompt.

        Args:
            code: Code to review
            language: Programming language
        """
        return f"""Please review this {language} code for:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance optimizations
4. Security concerns
5. Style and conventions

Code:
```{language}
{code}
````

Provide a detailed review with specific suggestions for improvement."""

````

### 5.2 Code Explanation Prompt

```python
# src/prompts/code_explanation.py
from fastmcp import FastMCP

def register_code_explanation_prompts(mcp: FastMCP):
    """Регистрация code explanation prompts."""

    @mcp.prompt
    def explain_code(code: str, language: str = "python", detail_level: str = "detailed") -> str:
        """
        Generate a code explanation prompt.

        Args:
            code: Code to explain
            language: Programming language
            detail_level: 'brief', 'detailed', or 'comprehensive'
        """
        detail_instructions = {
            "brief": "Provide a brief explanation",
            "detailed": "Provide a detailed explanation with examples",
            "comprehensive": "Provide a comprehensive explanation covering all aspects",
        }

        return f"""{detail_instructions.get(detail_level, detail_instructions['detailed'])} of this {language} code:

```{language}
{code}
````

Explain:

1. What the code does
2. How it works
3. Key concepts and patterns
4. Potential use cases"""

````

### 5.3 Code Generation Prompt

```python
# src/prompts/code_generation.py
from fastmcp import FastMCP

def register_code_generation_prompts(mcp: FastMCP):
    """Регистрация code generation prompts."""

    @mcp.prompt
    def generate_code_prompt(description: str, language: str, requirements: str = "") -> str:
        """
        Generate a code generation prompt.

        Args:
            description: What code to generate
            language: Programming language
            requirements: Additional requirements
        """
        prompt = f"""Generate {language} code for: {description}

Requirements:
{requirements if requirements else "Follow best practices and include comments"}

Please provide:
1. Complete, working code
2. Comments explaining key parts
3. Error handling where appropriate
4. Example usage if applicable"""

        return prompt
````

---

## 🚀 Часть 6: Main Server Implementation

### 6.1 Server Setup

```python
# src/server.py
from fastmcp import FastMCP
from r2r_client import R2RClientWrapper
from tools.documents import register_document_tools
from tools.search import register_search_tools
from tools.rag import register_rag_tools
from tools.agent import register_agent_tools
from tools.code_specific import register_code_tools
from resources.documents import register_document_resources
from resources.collections import register_collection_resources
from prompts.code_review import register_code_review_prompts
from prompts.code_explanation import register_code_explanation_prompts
from prompts.code_generation import register_code_generation_prompts
import os

def create_r2r_mcp_server() -> FastMCP:
    """Create and configure R2R MCP server."""

    # Initialize MCP server
    mcp = FastMCP(
        name="R2R Server",
        version="1.0.0",
        description="MCP server for R2R API with Gemini optimization"
    )

    # Initialize R2R client
    r2r_client = R2RClientWrapper(
        base_url=os.getenv("R2R_BASE_URL", "http://localhost:7272"),
        api_key=os.getenv("R2R_API_KEY")
    )

    # Register all tools
    register_document_tools(mcp, r2r_client)
    register_search_tools(mcp, r2r_client)
    register_rag_tools(mcp, r2r_client)
    register_agent_tools(mcp, r2r_client)
    register_code_tools(mcp, r2r_client)

    # Register all resources
    register_document_resources(mcp, r2r_client)
    register_collection_resources(mcp, r2r_client)

    # Register all prompts
    register_code_review_prompts(mcp)
    register_code_explanation_prompts(mcp)
    register_code_generation_prompts(mcp)

    return mcp

# Main entry point
if __name__ == "__main__":
    server = create_r2r_mcp_server()
    server.run()  # Uses STDIO by default
```

### 6.2 Configuration

```python
# src/config.py
import os
from typing import Optional

class R2RMCPServerConfig:
    """Configuration for R2R MCP Server."""

    # R2R API
    R2R_BASE_URL: str = os.getenv("R2R_BASE_URL", "http://localhost:7272")
    R2R_API_KEY: Optional[str] = os.getenv("R2R_API_KEY")

    # Gemini API
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")

    # Server settings
    SERVER_NAME: str = "R2R Server"
    SERVER_VERSION: str = "1.0.0"

    # Default Gemini configs
    DEFAULT_GEMINI_MODEL: str = "google/gemini-2.5-flash"
    DEFAULT_TEMPERATURE: float = 0.3
    DEFAULT_THINKING_BUDGET: int = -1  # Dynamic
```

---

## 📋 Часть 7: Roadmap реализации

### Phase 1: Базовая инфраструктура (1 неделя)

- [ ] Настройка проекта и зависимостей
- [ ] Создание R2RClientWrapper
- [ ] Базовая структура FastMCP server
- [ ] Реализация основных document tools
- [ ] Тестирование подключения к R2R

### Phase 2: Search & RAG Tools (1 неделя)

- [ ] Реализация search tools (semantic, hybrid, HyDE)
- [ ] Реализация RAG tools
- [ ] Code-specific search
- [ ] Интеграция Gemini конфигураций

### Phase 3: Agent & Advanced Tools (1 неделя)

- [ ] Реализация agent tools
- [ ] Code generation tools
- [ ] Code analysis tools
- [ ] Code structure extraction

### Phase 4: Resources & Prompts (3-4 дня)

- [ ] Реализация document resources
- [ ] Реализация collection resources
- [ ] Реализация chunk resources
- [ ] Создание code review prompts
- [ ] Создание code explanation prompts
- [ ] Создание code generation prompts

### Phase 5: Testing & Documentation (3-4 дня)

- [ ] Unit tests для всех tools
- [ ] Integration tests
- [ ] Документация API
- [ ] Примеры использования
- [ ] README с инструкциями

### Phase 6: Deployment & Optimization (3-4 дня)

- [ ] Настройка HTTP transport для production
- [ ] Оптимизация производительности
- [ ] Error handling и logging
- [ ] Мониторинг и метрики

---

## 🎯 Ключевые возможности

### Tools (20+)

1. **Documents:** upload, get, list, delete, update metadata
2. **Search:** semantic, hybrid, HyDE, code search
3. **RAG:** query, code-optimized RAG
4. **Agent:** agent query, research mode
5. **Code:** generate, analyze, extract structure
6. **Collections:** create, list, manage
7. **Chunks:** manage, analyze quality
8. **Embeddings:** generate, batch

### Resources (10+)

1. `r2r://documents/{id}` - Document content
2. `r2r://documents/{id}/chunks` - Document chunks
3. `r2r://collections/{id}` - Collection info
4. `r2r://chunks/{id}` - Chunk content
5. `r2r://kg/entities/{id}` - Knowledge graph entities

### Prompts (5+)

1. Code review
2. Code explanation
3. Code generation
4. Documentation generation
5. Code refactoring

---

## 📊 Метрики успеха

### Функциональность

- [ ] Все R2R API endpoints доступны через MCP
- [ ] Gemini оптимизация для всех операций
- [ ] Code-specific tools работают корректно
- [ ] Resources предоставляют актуальные данные

### Производительность

- [ ] Tool execution < 2s для простых операций
- [ ] RAG queries < 5s
- [ ] Resource access < 1s
- [ ] Streaming работает корректно

### Качество

- [ ] 100% покрытие тестами для критичных tools
- [ ] Error handling для всех операций
- [ ] Документация для всех tools/resources/prompts

---

## 🔗 Интеграция с планами

### Связь с R2R_MAXIMIZATION_PLAN.md

- Все advanced features из плана доступны через MCP
- Advanced ingestion через `upload_document` tool
- Advanced search через `hyde_search`, `code_search`
- Data quality через `analyze_code`, chunk management tools

### Связь с GEMINI_R2R_INTEGRATION_PLAN.md

- Все Gemini конфигурации интегрированы
- Task profiles используются автоматически
- Thinking budget оптимизирован для каждой задачи
- Gemini embeddings используются по умолчанию

---

**Дата создания:** 2025-01-27  
**Версия:** 1.0  
**Фокус:** FastMCP + R2R API + Gemini Optimization
