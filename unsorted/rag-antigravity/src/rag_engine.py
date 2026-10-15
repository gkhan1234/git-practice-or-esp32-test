import os
from typing import List, Dict, Any, Generator, Tuple
import chromadb
from google import genai
from google.genai import types

from src.config import (
    CHROMA_DIR,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    TOP_K_RESULTS,
)
from src.ingestion import get_embedding_function
from src.prompts import SYSTEM_PROMPT, RAG_USER_PROMPT_TEMPLATE


def clean_model_name(name: str) -> str:
    if not name:
        return "gemini-3.6-flash"
    name = str(name).strip().strip("'\"")
    while "=" in name:
        name = name.split("=", 1)[1].strip()
    if name.startswith("models/"):
        name = name[len("models/"):]
    return name or "gemini-3.6-flash"


class RAGEngine:
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
        raw_model = model_name or os.getenv("GEMINI_MODEL") or GEMINI_MODEL
        self.model_name = clean_model_name(raw_model)
        self._chroma_client = None
        self._collection = None
        self._genai_client = None

    @property
    def collection(self) -> chromadb.Collection:
        if self._collection is None:
            self._chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self._collection = self._chroma_client.get_or_create_collection(
                name="esp32_stem_kb",
                embedding_function=get_embedding_function(),
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    @property
    def genai_client(self):
        if not self.api_key:
            return None
        if self._genai_client is None:
            self._genai_client = genai.Client(
                api_key=self.api_key,
                http_options=types.HttpOptions(timeout=30000)
            )
        return self._genai_client

    def retrieve_context(self, query: str, top_k: int = TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """Retrieve most relevant knowledge base chunks for the student query."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
        except Exception as e:
            print(f"[RAGEngine] Retrieval error: {e}")
            return []

        chunks = []
        if results and results.get("documents") and results["documents"][0]:
            docs = results["documents"][0]
            metadatas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metadatas, distances):
                chunks.append({
                    "content": doc,
                    "metadata": meta,
                    "distance": dist,
                    "source": meta.get("filename", "Unknown doc"),
                    "category": meta.get("category", "General"),
                })

        return chunks

    def format_context_string(self, chunks: List[Dict[str, Any]]) -> str:
        """Format chunks into a structured context string for the prompt."""
        if not chunks:
            return "No specific reference documents found in knowledge base."

        formatted = []
        for idx, chunk in enumerate(chunks, 1):
            source = chunk.get("source", "Reference")
            category = chunk.get("category", "")
            header = f"### [Document {idx}: {source} (Topic: {category})]"
            formatted.append(f"{header}\n{chunk['content']}\n")
        return "\n---\n".join(formatted)

    def stream_query(self, query: str, top_k: int = TOP_K_RESULTS) -> Generator[str, None, Tuple[str, List[Dict[str, Any]]]]:
        """
        Stream response tokens from Gemini 2.5 Flash grounded in retrieved context.
        Yields text deltas. Returns full response and sources.
        """
        chunks = self.retrieve_context(query, top_k=top_k)
        context_str = self.format_context_string(chunks)

        if not self.api_key:
            missing_msg = (
                "⚠️ **Gemini API Key Required**\n\n"
                "Please configure your `GEMINI_API_KEY` in the `.env` file or provide it in the chat settings.\n"
                "Once provided, Sparky will be able to answer questions using `gemini-2.5-flash`!\n\n"
                f"**Retrieved Sources Found ({len(chunks)} documents):**\n" +
                "\n".join([f"- `{c['source']}` ({c['category']})" for c in chunks])
            )
            yield missing_msg
            return missing_msg, chunks

        user_content = RAG_USER_PROMPT_TEMPLATE.format(context=context_str, query=query)

        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
        ]

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.4,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            safety_settings=safety_settings,
        )

        import time
        candidate_models = []
        for m in [self.model_name, "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash"]:
            cleaned = clean_model_name(m)
            if cleaned and cleaned not in candidate_models:
                candidate_models.append(cleaned)

        full_text = []
        last_error = None

        for model in candidate_models:
            for attempt in range(2):
                try:
                    response_stream = self.genai_client.models.generate_content_stream(
                        model=model,
                        contents=user_content,
                        config=config,
                    )
                    streamed_anything = False
                    for chunk in response_stream:
                        if chunk.text:
                            streamed_anything = True
                            full_text.append(chunk.text)
                            yield chunk.text

                    if streamed_anything:
                        return "".join(full_text), chunks
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    if "400" in err_str or "404" in err_str or "not_found" in err_str:
                        # Malformed or unsupported model name in this tier, move to next model immediately
                        break
                    elif "503" in err_str or "unavailable" in err_str or "429" in err_str:
                        # Temporary server spike: short wait before retry or trying next model
                        time.sleep(1.0)
                        continue
                    else:
                        time.sleep(0.5)
                        continue

        err_msg = f"\n\n❌ **Error communicating with Gemini API**: {str(last_error)}"
        full_text.append(err_msg)
        yield err_msg
        return "".join(full_text), chunks

    async def async_stream_query(self, query: str, top_k: int = TOP_K_RESULTS, chunks: List[Dict[str, Any]] = None):
        """
        Natively async token stream generator for Chainlit.
        Does not block the asyncio event loop!
        """
        if chunks is None:
            chunks = self.retrieve_context(query, top_k=top_k)
        context_str = self.format_context_string(chunks)

        if not self.api_key:
            yield (
                "⚠️ **Gemini API Key Required**\n\n"
                "Please configure your `GEMINI_API_KEY` in the `.env` file.\n"
            )
            return

        user_content = RAG_USER_PROMPT_TEMPLATE.format(context=context_str, query=query)

        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
        ]

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.4,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            safety_settings=safety_settings,
        )

        import asyncio
        candidate_models = []
        for m in [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]:
            cleaned = clean_model_name(m)
            if cleaned and cleaned not in candidate_models:
                candidate_models.append(cleaned)

        last_error = None
        for model in candidate_models:
            for attempt in range(2):
                try:
                    response_stream = await self.genai_client.aio.models.generate_content_stream(
                        model=model,
                        contents=user_content,
                        config=config,
                    )
                    streamed_anything = False
                    async for chunk in response_stream:
                        if chunk.text:
                            streamed_anything = True
                            yield chunk.text

                    if streamed_anything:
                        return
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    if "400" in err_str or "404" in err_str or "not_found" in err_str:
                        break
                    elif "503" in err_str or "unavailable" in err_str or "429" in err_str:
                        await asyncio.sleep(1.0)
                        continue
                    else:
                        await asyncio.sleep(0.5)
                        continue

        yield f"\n\n❌ **Error communicating with Gemini API**: {str(last_error)}"
