import logging
import os
from typing import List, Optional, Dict, Any
from urllib.parse import unquote

import google.generativeai as genai
from adalflow.components.model_client.ollama_client import OllamaClient
from adalflow.core.types import ModelType
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field

from api.config import get_model_config, configs, OPENROUTER_API_KEY, OPENAI_API_KEY
from api.data_pipeline import count_tokens, get_file_content
from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from api.azureai_client import AzureAIClient
from api.dashscope_client import DashscopeClient
from api.rag import RAG

# Configure logging
from api.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


# Models for the API
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatCompletionRequest(BaseModel):
    """
    Model for requesting a chat completion.
    """
    repo_url: str = Field(..., description="URL of the repository to query")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    filePath: Optional[str] = Field(None, description="Optional path to a file in the repository to include in the prompt")
    token: Optional[str] = Field(None, description="Personal access token for private repositories")
    type: Optional[str] = Field("github", description="Type of repository (e.g., 'github', 'gitlab', 'bitbucket')")

    # model parameters
    provider: str = Field("google", description="Model provider (google, openai, openrouter, ollama, azure)")
    model: Optional[str] = Field(None, description="Model name for the specified provider")

    language: Optional[str] = Field("en", description="Language for content generation (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')")
    excluded_dirs: Optional[str] = Field(None, description="Comma-separated list of directories to exclude from processing")
    excluded_files: Optional[str] = Field(None, description="Comma-separated list of file patterns to exclude from processing")
    included_dirs: Optional[str] = Field(None, description="Comma-separated list of directories to include exclusively")
    included_files: Optional[str] = Field(None, description="Comma-separated list of file patterns to include exclusively")

async def handle_websocket_chat(websocket: WebSocket):
    """
    Handle WebSocket connection for chat completions.
    This replaces the HTTP streaming endpoint with a WebSocket connection.
    """
    await websocket.accept()

    try:
        # Receive and parse the request data
        request_data = await websocket.receive_json()
        request = ChatCompletionRequest(**request_data)

        # Check if request contains very large input
        input_too_large = False
        if request.messages and len(request.messages) > 0:
            last_message = request.messages[-1]
            if hasattr(last_message, 'content') and last_message.content:
                tokens = count_tokens(last_message.content, request.provider == "ollama")
                logger.info(f"Request size: {tokens} tokens")
                if tokens > 8000:
                    logger.warning(f"Request exceeds recommended token limit ({tokens} > 7500)")
                    input_too_large = True

        # Create a new RAG instance for this request
        try:
            logger.info(f"Creating RAG instance for {request.provider} {request.model}")    
            request_rag = RAG(provider=request.provider, model=request.model)

            # Extract custom file filter parameters if provided
            excluded_dirs = None
            excluded_files = None
            included_dirs = None
            included_files = None

            if request.excluded_dirs:
                excluded_dirs = [unquote(dir_path) for dir_path in request.excluded_dirs.split('\n') if dir_path.strip()]
                logger.info(f"Using custom excluded directories: {excluded_dirs}")
            if request.excluded_files:
                excluded_files = [unquote(file_pattern) for file_pattern in request.excluded_files.split('\n') if file_pattern.strip()]
                logger.info(f"Using custom excluded files: {excluded_files}")
            if request.included_dirs:
                included_dirs = [unquote(dir_path) for dir_path in request.included_dirs.split('\n') if dir_path.strip()]
                logger.info(f"Using custom included directories: {included_dirs}")
            if request.included_files:
                included_files = [unquote(file_pattern) for file_pattern in request.included_files.split('\n') if file_pattern.strip()]
                logger.info(f"Using custom included files: {included_files}")

            request_rag.prepare_retriever(request.repo_url, request.type, request.token, excluded_dirs, excluded_files, included_dirs, included_files)
            logger.info(f"Retriever prepared for {request.repo_url}")
        except ValueError as e:
            error_str = str(e)
            if "No valid documents with embeddings found" in error_str:
                logger.error(f"No valid embeddings found: {error_str}")
                error_msg = "Error: No valid document embeddings found. This may be due to embedding size inconsistencies or API errors during document processing. Please try again or check your repository content."
            else:
                logger.error(f"ValueError preparing retriever: {error_str}")
                error_msg = f"Error preparing retriever: {error_str}"
            
            await websocket.send_text(error_msg)
            logger.info(f"Sent error message to WebSocket: {error_msg[:100]}...")
            await websocket.close()
            return
        except Exception as e:
            error_str = str(e)
            logger.error(f"Exception preparing retriever: {error_str}")
            logger.error(f"Exception type: {type(e).__name__}")
            
            # Check for database file errors
            if "unable to open database file" in error_str.lower():
                logger.error("Database file error detected. Attempting to fix...")
                error_msg = "Error: Database file access issue. This may be due to missing directory permissions or file system issues. Please check the .adalflow directory permissions and try again."
            elif "All embeddings should be of the same size" in error_str:
                error_msg = "Error: Inconsistent embedding sizes detected. Some documents may have failed to embed properly. Please delete the database cache and try again."
            else:
                error_msg = f"Error preparing retriever: {error_str}"
            
            logger.info(f"Sending error message to WebSocket: {error_msg[:100]}...")
            await websocket.send_text(error_msg)
            await websocket.close()
            return

        # Validate request
        if not request.messages or len(request.messages) == 0:
            await websocket.send_text("Error: No messages provided")
            await websocket.close()
            return

        last_message = request.messages[-1]
        if last_message.role != "user":
            await websocket.send_text("Error: Last message must be from the user")
            await websocket.close()
            return

        # Process previous messages to build conversation history
        for i in range(0, len(request.messages) - 1, 2):
            if i + 1 < len(request.messages):
                user_msg = request.messages[i]
                assistant_msg = request.messages[i + 1]

                if user_msg.role == "user" and assistant_msg.role == "assistant":
                    request_rag.memory.add_dialog_turn(
                        user_query=user_msg.content,
                        assistant_response=assistant_msg.content
                    )

        # Check if this is a Deep Research request
        is_deep_research = False
        research_iteration = 1

        # Process messages to detect Deep Research requests
        for msg in request.messages:
            if hasattr(msg, 'content') and msg.content and "[DEEP RESEARCH]" in msg.content:
                is_deep_research = True
                # Only remove the tag from the last message
                if msg == request.messages[-1]:
                    # Remove the Deep Research tag
                    msg.content = msg.content.replace("[DEEP RESEARCH]", "").strip()

        # Count research iterations if this is a Deep Research request
        if is_deep_research:
            research_iteration = sum(1 for msg in request.messages if msg.role == 'assistant') + 1
            logger.info(f"Deep Research request detected - iteration {research_iteration}")

            # Check if this is a continuation request
            if "continue" in last_message.content.lower() and "research" in last_message.content.lower():
                # Find the original topic from the first user message
                original_topic = None
                for msg in request.messages:
                    if msg.role == "user" and "continue" not in msg.content.lower():
                        original_topic = msg.content.replace("[DEEP RESEARCH]", "").strip()
                        logger.info(f"Found original research topic: {original_topic}")
                        break

                if original_topic:
                    # Replace the continuation message with the original topic
                    last_message.content = original_topic
                    logger.info(f"Using original topic for research: {original_topic}")

        # Get the query from the last message
        query = last_message.content

        # Only retrieve documents if input is not too large
        context_text = ""
        retrieved_documents = None

        if not input_too_large:
            try:
                # If filePath exists, modify the query for RAG to focus on the file
                rag_query = query
                if request.filePath:
                    # Use the file path to get relevant context about the file
                    rag_query = f"Contexts related to {request.filePath}"
                    logger.info(f"Modified RAG query to focus on file: {request.filePath}")

                # Try to perform RAG retrieval
                try:
                    # This will use the actual RAG implementation
                    retrieved_documents = request_rag(rag_query, language=request.language)

                    if retrieved_documents and retrieved_documents[0].documents:
                        # Format context for the prompt in a more structured way
                        documents = retrieved_documents[0].documents
                        logger.info(f"Retrieved {len(documents)} documents")

                        # Group documents by file path
                        docs_by_file = {}
                        for doc in documents:
                            file_path = doc.meta_data.get('file_path', 'unknown')
                            if file_path not in docs_by_file:
                                docs_by_file[file_path] = []
                            docs_by_file[file_path].append(doc)

                        # Format context text with file path grouping
                        context_parts = []
                        for file_path, docs in docs_by_file.items():
                            # Add file header with metadata
                            header = f"## File Path: {file_path}\n\n"
                            # Add document content
                            content = "\n\n".join([doc.text for doc in docs])

                            context_parts.append(f"{header}{content}")

                        # Join all parts with clear separation
                        context_text = "\n\n" + "-" * 10 + "\n\n".join(context_parts)
                    else:
                        logger.warning("No documents retrieved from RAG")
                except Exception as e:
                    logger.error(f"Error in RAG retrieval: {str(e)}")
                    # Continue without RAG if there's an error

            except Exception as e:
                logger.error(f"Error retrieving documents: {str(e)}")
                context_text = ""

        # Get repository information
        repo_url = request.repo_url
        repo_name = repo_url.split("/")[-1] if "/" in repo_url else repo_url

        # Determine repository type
        repo_type = request.type

        # Get language information
        language_code = request.language or configs["lang_config"]["default"]
        supported_langs = configs["lang_config"]["supported_languages"]
        language_name = supported_langs.get(language_code, "English")

        # Create system prompt
        if is_deep_research:
            # Check if this is the first iteration
            is_first_iteration = research_iteration == 1

            # Check if this is the final iteration
            is_final_iteration = research_iteration >= 5

            if is_first_iteration:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are conducting a multi-turn Deep Research process to thoroughly investigate the specific topic in the user's query.
Your goal is to provide detailed, focused information EXCLUSIVELY about this topic.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- This is the first iteration of a multi-turn research process focused EXCLUSIVELY on the user's query
- Start your response with "## Research Plan"
- Outline your approach to investigating this specific topic
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- Clearly state the specific topic you're researching to maintain focus throughout all iterations
- Identify the key aspects you'll need to research
- Provide initial findings based on the information available
- End with "## Next Steps" indicating what you'll investigate in the next iteration
- Do NOT provide a final conclusion yet - this is just the beginning of the research
- Do NOT include general repository information unless directly relevant to the query
- Focus EXCLUSIVELY on the specific topic being researched - do not drift to related topics
- Your research MUST directly address the original question
- NEVER respond with just "Continue the research" as an answer - always provide substantive research findings
- Remember that this topic will be maintained across all research iterations
</guidelines>

<style>
- Be concise but thorough
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
</style>"""
            elif is_final_iteration:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are in the final iteration of a Deep Research process focused EXCLUSIVELY on the latest user query.
Your goal is to synthesize all previous findings and provide a comprehensive conclusion that directly addresses this specific topic and ONLY this topic.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- This is the final iteration of the research process
- CAREFULLY review the entire conversation history to understand all previous findings
- Synthesize ALL findings from previous iterations into a comprehensive conclusion
- Start with "## Final Conclusion"
- Your conclusion MUST directly address the original question
- Stay STRICTLY focused on the specific topic - do not drift to related topics
- Include specific code references and implementation details related to the topic
- Highlight the most important discoveries and insights about this specific functionality
- Provide a complete and definitive answer to the original question
- Do NOT include general repository information unless directly relevant to the query
- Focus exclusively on the specific topic being researched
- NEVER respond with "Continue the research" as an answer - always provide a complete conclusion
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- Ensure your conclusion builds on and references key findings from previous iterations
</guidelines>

<style>
- Be concise but thorough
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
- Structure your response with clear headings
- End with actionable insights or recommendations when appropriate
</style>"""
            else:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are currently in iteration {research_iteration} of a Deep Research process focused EXCLUSIVELY on the latest user query.
Your goal is to build upon previous research iterations and go deeper into this specific topic without deviating from it.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- CAREFULLY review the conversation history to understand what has been researched so far
- Your response MUST build on previous research iterations - do not repeat information already covered
- Identify gaps or areas that need further exploration related to this specific topic
- Focus on one specific aspect that needs deeper investigation in this iteration
- Start your response with "## Research Update {research_iteration}"
- Clearly explain what you're investigating in this iteration
- Provide new insights that weren't covered in previous iterations
- If this is iteration 3, prepare for a final conclusion in the next iteration
- Do NOT include general repository information unless directly relevant to the query
- Focus EXCLUSIVELY on the specific topic being researched - do not drift to related topics
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- NEVER respond with just "Continue the research" as an answer - always provide substantive research findings
- Your research MUST directly address the original question
- Maintain continuity with previous research iterations - this is a continuous investigation
</guidelines>

<style>
- Be concise but thorough
- Focus on providing new information, not repeating what's already been covered
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
</style>"""
        else:
            system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You provide direct, concise, and accurate information about code repositories.
You NEVER start responses with markdown headers or code fences.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- Answer the user's question directly without ANY preamble or filler phrases
- DO NOT include any rationale, explanation, or extra comments.
- Strictly base answers ONLY on existing code or documents
- DO NOT speculate or invent citations.
- DO NOT start with preambles like "Okay, here's a breakdown" or "Here's an explanation"
- DO NOT start with markdown headers like "## Analysis of..." or any file path references
- DO NOT start with ```markdown code fences
- DO NOT end your response with ``` closing fences
- DO NOT start by repeating or acknowledging the question
- JUST START with the direct answer to the question

<example_of_what_not_to_do>
```markdown
## Analysis of `adalflow/adalflow/datasets/gsm8k.py`

This file contains...
```
</example_of_what_not_to_do>

- Format your response with proper markdown including headings, lists, and code blocks WITHIN your answer
- For code analysis, organize your response with clear sections
- Think step by step and structure your answer logically
- Start with the most relevant information that directly addresses the user's query
- Be precise and technical when discussing code
- Your response language should be in the same language as the user's query
</guidelines>

<style>
- Use concise, direct language
- Prioritize accuracy over verbosity
- When showing code, include line numbers and file paths when relevant
- Use markdown formatting to improve readability
</style>"""

        # Fetch file content if provided
        file_content = ""
        if request.filePath:
            try:
                file_content = get_file_content(request.repo_url, request.filePath, request.type, request.token)
                logger.info(f"Successfully retrieved content for file: {request.filePath}")
            except Exception as e:
                logger.error(f"Error retrieving file content: {str(e)}")
                # Continue without file content if there's an error

        # Format conversation history
        conversation_history = ""
        for turn_id, turn in request_rag.memory().items():
            if not isinstance(turn_id, int) and hasattr(turn, 'user_query') and hasattr(turn, 'assistant_response'):
                conversation_history += f"<turn>\n<user>{turn.user_query.query_str}</user>\n<assistant>{turn.assistant_response.response_str}</assistant>\n</turn>\n"

        # Create the prompt with context
        prompt = f"/no_think {system_prompt}\n\n"

        if conversation_history:
            prompt += f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"

        # Check if filePath is provided and fetch file content if it exists
        if file_content:
            # Add file content to the prompt after conversation history
            prompt += f"<currentFileContent path=\"{request.filePath}\">\n{file_content}\n</currentFileContent>\n\n"

        # Only include context if it's not empty
        CONTEXT_START = "<START_OF_CONTEXT>"
        CONTEXT_END = "<END_OF_CONTEXT>"
        if context_text.strip():
            prompt += f"{CONTEXT_START}\n{context_text}\n{CONTEXT_END}\n\n"
        else:
            # Add a note that we're skipping RAG due to size constraints or because it's the isolated API
            logger.info("No context available from RAG")
            prompt += "<note>Answering without retrieval augmentation.</note>\n\n"

        prompt += f"<query>\n{query}\n</query>\n\nAssistant: "

        model_config = get_model_config(request.provider, request.model)["model_kwargs"]

        if request.provider == "ollama":
            prompt += " /no_think"

            model = OllamaClient()
            model_kwargs = {
                "model": model_config["model"],
                "stream": True,
                "options": {
                    "temperature": model_config["temperature"],
                    "top_p": model_config["top_p"],
                    "num_ctx": model_config["num_ctx"]
                }
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "openrouter":
            logger.info(f"Using OpenRouter with model: {request.model}")

            # Check if OpenRouter API key is set
            if not OPENROUTER_API_KEY:
                logger.warning("OPENROUTER_API_KEY not configured, but continuing with request")
                # We'll let the OpenRouterClient handle this and return a friendly error message

            model = OpenRouterClient()
            model_kwargs = {
                "model": request.model,
                "stream": True,
                "temperature": model_config["temperature"]
            }
            # Only add top_p if it exists in the model config
            if "top_p" in model_config:
                model_kwargs["top_p"] = model_config["top_p"]

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "openai":
            logger.info(f"Using Openai protocol with model: {request.model}")

            # Check if an API key is set for Openai
            if not OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not configured, but continuing with request")
                # We'll let the OpenAIClient handle this and return an error message

            # Initialize Openai client
            model = OpenAIClient()
            
            # DISABLE STREAMING for OpenAI to avoid organization verification requirement
            # Non-streaming mode works without organization verification
            use_streaming = False
            logger.info("OpenAI streaming disabled - using non-streaming mode")
            
            model_kwargs = {
                "model": request.model,
                "stream": use_streaming,
                "temperature": model_config["temperature"]
            }
            # Only add top_p if it exists in the model config
            if "top_p" in model_config:
                model_kwargs["top_p"] = model_config["top_p"]

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "azure":
            logger.info(f"Using Azure AI with model: {request.model}")

            # Initialize Azure AI client
            model = AzureAIClient()
            model_kwargs = {
                "model": request.model,
                "stream": True,
                "temperature": model_config["temperature"],
                "top_p": model_config["top_p"]
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "dashscope":
            logger.info(f"Using Dashscope with model: {request.model}")

            # Initialize Dashscope client
            model = DashscopeClient()
            model_kwargs = {
                "model": request.model,
                "stream": True,
                "temperature": model_config["temperature"],
                "top_p": model_config["top_p"]
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        else:
            # Initialize Google Generative AI model
            model = genai.GenerativeModel(
                model_name=model_config["model"],
                generation_config={
                    "temperature": model_config["temperature"],
                    "top_p": model_config["top_p"],
                    "top_k": model_config["top_k"]
                }
            )

        # Process the response based on the provider
        try:
            if request.provider == "ollama":
                # Get the response and handle it properly using the previously created api_kwargs
                response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                # Handle streaming response from Ollama
                async for chunk in response:
                    text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                    if text and not text.startswith('model=') and not text.startswith('created_at='):
                        text = text.replace('<think>', '').replace('</think>', '')
                        await websocket.send_text(text)
                # Explicitly close the WebSocket connection after the response is complete
                await websocket.close()
            elif request.provider == "openrouter":
                try:
                    # Get the response and handle it properly using the previously created api_kwargs
                    logger.info("Making OpenRouter API call")
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    # Handle streaming response from OpenRouter
                    async for chunk in response:
                        await websocket.send_text(chunk)
                    # Explicitly close the WebSocket connection after the response is complete
                    await websocket.close()
                except Exception as e_openrouter:
                    logger.error(f"Error with OpenRouter API: {str(e_openrouter)}")
                    error_msg = f"\nError with OpenRouter API: {str(e_openrouter)}\n\nPlease check that you have set the OPENROUTER_API_KEY environment variable with a valid API key."
                    await websocket.send_text(error_msg)
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            elif request.provider == "openai":
                try:
                    # Get the response and handle it properly using the previously created api_kwargs
                    logger.info("Making Openai API call (non-streaming mode)")
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    
                    # Check if streaming is enabled in api_kwargs
                    if api_kwargs.get("stream", False):
                        # Handle streaming response from Openai
                        chunk_count = 0
                        total_chars_sent = 0
                        async for chunk in response:
                            choices = getattr(chunk, "choices", [])
                            if len(choices) > 0:
                                delta = getattr(choices[0], "delta", None)
                                if delta is not None:
                                    text = getattr(delta, "content", None)
                                    if text is not None:
                                        chunk_count += 1
                                        total_chars_sent += len(text)
                                        await websocket.send_text(text)
                                        # Log every 50th chunk for debugging
                                        if chunk_count % 50 == 0:
                                            logger.info(f"Sent {chunk_count} chunks, {total_chars_sent} total chars")
                        
                        logger.info(f"OpenAI streaming complete: {chunk_count} chunks, {total_chars_sent} total chars sent")
                    else:
                        # Handle non-streaming response (ChatCompletion object)
                        logger.info("Processing non-streaming OpenAI response")
                        full_response = ""
                        
                        if hasattr(response, 'choices') and len(response.choices) > 0:
                            choice = response.choices[0]
                            if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
                                full_response = choice.message.content or ""
                        
                        if full_response:
                            logger.info(f"OpenAI non-streaming response received: {len(full_response)} chars")
                            # Send the full response as a single chunk
                            await websocket.send_text(full_response)
                            logger.info("OpenAI non-streaming response sent successfully")
                        else:
                            logger.warning("OpenAI non-streaming response received but content is empty")
                            await websocket.send_text("\n⚠️ Error: Received empty response from OpenAI API.\n")
                    
                    # Explicitly close the WebSocket connection after the response is complete
                    await websocket.close()
                except Exception as e_openai:
                    error_str = str(e_openai)
                    error_str_lower = error_str.lower()
                    
                    # Log the error immediately with full details
                    logger.error(f"Error with Openai API: {error_str}")
                    logger.error(f"Error type: {type(e_openai).__name__}")
                    
                    # Check exception attributes for more detailed error info
                    error_body = None
                    error_message = None
                    error_code = None
                    if hasattr(e_openai, 'response'):
                        logger.debug(f"Exception has response attribute: {type(e_openai.response)}")
                    if hasattr(e_openai, 'body'):
                        error_body = e_openai.body
                        logger.error(f"Exception body: {error_body}")
                    
                    # Try to extract error message from exception body if it's a dict
                    if error_body and isinstance(error_body, dict):
                        if 'error' in error_body and isinstance(error_body['error'], dict):
                            error_message = error_body['error'].get('message', '')
                            error_code = error_body['error'].get('code', '')
                            logger.error(f"Extracted error message: {error_message}")
                            logger.error(f"Extracted error code: {error_code}")
                    
                    # Log the api_kwargs to see what was sent
                    logger.error(f"API kwargs that caused the error: model={api_kwargs.get('model')}, stream={api_kwargs.get('stream')}, messages_count={len(api_kwargs.get('messages', []))}")
                    
                    # Check for organization verification error
                    # Check multiple possible error message patterns
                    is_org_verification_error = (
                        "organization must be verified" in error_str_lower or
                        "unsupported_value" in error_str_lower or
                        ("verify organization" in error_str_lower and "stream" in error_str_lower) or
                        (error_message and "organization must be verified" in error_message.lower())
                    )
                    
                    logger.info(f"🔍 Organization verification error check: {is_org_verification_error}")
                    logger.info(f"   Error string contains 'organization must be verified': {'organization must be verified' in error_str_lower}")
                    logger.info(f"   Error string contains 'unsupported_value': {'unsupported_value' in error_str_lower}")
                    if error_message:
                        logger.info(f"   Error message contains 'organization must be verified': {'organization must be verified' in error_message.lower()}")
                    
                    if is_org_verification_error:
                        logger.warning(f"OpenAI organization verification error detected. Full error: {error_str}")
                        logger.warning("OpenAI organization verification error detected. Attempting non-streaming fallback...")
                        
                        # Try non-streaming mode as fallback
                        # IMPORTANT: Create a new OpenAI client instance to avoid backoff decorator issues
                        try:
                            logger.info("Attempting OpenAI API call with streaming disabled (fallback mode)")
                            
                            # Create fresh API kwargs without streaming
                            from api.openai_client import OpenAIClient as FreshOpenAIClient
                            fallback_model = FreshOpenAIClient()
                            
                            # Prepare non-streaming kwargs
                            # Extract messages from api_kwargs (already formatted by convert_inputs_to_api_kwargs)
                            non_streaming_kwargs = {
                                "model": api_kwargs.get("model", request.model),
                                "messages": api_kwargs.get("messages", []),
                                "temperature": api_kwargs.get("temperature", model_config["temperature"]),
                                "stream": False  # Explicitly disable streaming
                            }
                            if "top_p" in api_kwargs:
                                non_streaming_kwargs["top_p"] = api_kwargs["top_p"]
                            
                            # Validate messages
                            if not non_streaming_kwargs["messages"] or len(non_streaming_kwargs["messages"]) == 0:
                                logger.error("No messages found in api_kwargs for non-streaming fallback")
                                raise ValueError("Messages list is empty")
                            
                            logger.info(f"Non-streaming API kwargs prepared: model={non_streaming_kwargs['model']}, messages_count={len(non_streaming_kwargs['messages'])}, stream=False")
                            
                            # Make non-streaming call using direct OpenAI client (bypassing backoff for this call)
                            try:
                                # Use sync client directly for non-streaming to avoid backoff decorator
                                import openai
                                if fallback_model.sync_client is None:
                                    fallback_model.init_sync_client()
                                
                                # Direct API call without backoff
                                response = fallback_model.sync_client.chat.completions.create(**non_streaming_kwargs)
                                
                                # Get the full response content
                                full_response = ""
                                if hasattr(response, 'choices') and len(response.choices) > 0:
                                    choice = response.choices[0]
                                    if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
                                        full_response = choice.message.content or ""
                                
                                if full_response:
                                    logger.info(f"✅ Non-streaming response received: {len(full_response)} chars")
                                    # Send the full response as a single chunk
                                    await websocket.send_text(full_response)
                                    logger.info("✅ OpenAI non-streaming response sent successfully")
                                    await websocket.close()
                                    return
                                else:
                                    logger.warning("Non-streaming response received but content is empty")
                            except Exception as direct_error:
                                logger.error(f"Direct non-streaming call failed: {str(direct_error)}")
                                raise direct_error
                                
                        except Exception as fallback_error:
                            logger.error(f"Non-streaming fallback also failed: {str(fallback_error)}")
                            logger.error(f"Fallback error type: {type(fallback_error).__name__}")
                        
                        # If fallback failed or streaming is required, send error message
                        error_msg = (
                            "\n⚠️ OpenAI Organization Verification Required\n\n"
                            "Your OpenAI organization needs to be verified to use streaming mode.\n\n"
                            "📋 Steps to Fix:\n"
                            "1. Go to: https://platform.openai.com/settings/organization/general\n"
                            "2. Click on 'Verify Organization'\n"
                            "3. Wait up to 15 minutes for access to propagate\n"
                            "4. Try again after verification\n\n"
                            "Note: After verification, streaming will work automatically.\n"
                            "If you just verified, please wait a few minutes and try again."
                        )
                    else:
                        # Generic OpenAI error
                        error_msg = (
                            f"\n❌ Error with OpenAI API\n\n"
                            f"Details: {error_str}\n\n"
                            f"Please check that:\n"
                            f"1. Your OPENAI_API_KEY environment variable is set correctly\n"
                            f"2. Your API key has sufficient credits\n"
                            f"3. The API key has access to the requested model"
                        )
                    
                    await websocket.send_text(error_msg)
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            elif request.provider == "azure":
                try:
                    # Get the response and handle it properly using the previously created api_kwargs
                    logger.info("Making Azure AI API call")
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    # Handle streaming response from Azure AI
                    async for chunk in response:
                        choices = getattr(chunk, "choices", [])
                        if len(choices) > 0:
                            delta = getattr(choices[0], "delta", None)
                            if delta is not None:
                                text = getattr(delta, "content", None)
                                if text is not None:
                                    await websocket.send_text(text)
                    # Explicitly close the WebSocket connection after the response is complete
                    await websocket.close()
                except Exception as e_azure:
                    logger.error(f"Error with Azure AI API: {str(e_azure)}")
                    error_msg = f"\nError with Azure AI API: {str(e_azure)}\n\nPlease check that you have set the AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_VERSION environment variables with valid values."
                    await websocket.send_text(error_msg)
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            else:
                # Generate streaming response (Google Gemini default)
                logger.info("Making Google Gemini API call")
                response = model.generate_content(prompt, stream=True)
                # Stream the response
                chunk_count = 0
                total_chars_sent = 0
                for chunk in response:
                    if hasattr(chunk, 'text'):
                        chunk_count += 1
                        total_chars_sent += len(chunk.text)
                        await websocket.send_text(chunk.text)
                        # Log every 50th chunk for debugging
                        if chunk_count % 50 == 0:
                            logger.info(f"Sent {chunk_count} chunks, {total_chars_sent} total chars")
                
                logger.info(f"Google Gemini streaming complete: {chunk_count} chunks, {total_chars_sent} total chars sent")
                # Explicitly close the WebSocket connection after the response is complete
                await websocket.close()

        except Exception as e_outer:
            logger.error(f"Error in streaming response: {str(e_outer)}")
            error_message = str(e_outer)

            # Check for token limit errors
            if "maximum context length" in error_message or "token limit" in error_message or "too many tokens" in error_message:
                # If we hit a token limit error, try again without context
                logger.warning("Token limit exceeded, retrying without context")
                try:
                    # Create a simplified prompt without context
                    simplified_prompt = f"/no_think {system_prompt}\n\n"
                    if conversation_history:
                        simplified_prompt += f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"

                    # Include file content in the fallback prompt if it was retrieved
                    if request.filePath and file_content:
                        simplified_prompt += f"<currentFileContent path=\"{request.filePath}\">\n{file_content}\n</currentFileContent>\n\n"

                    simplified_prompt += "<note>Answering without retrieval augmentation due to input size constraints.</note>\n\n"
                    simplified_prompt += f"<query>\n{query}\n</query>\n\nAssistant: "

                    if request.provider == "ollama":
                        simplified_prompt += " /no_think"

                        # Create new api_kwargs with the simplified prompt
                        fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                            input=simplified_prompt,
                            model_kwargs=model_kwargs,
                            model_type=ModelType.LLM
                        )

                        # Get the response using the simplified prompt
                        fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)

                        # Handle streaming fallback_response from Ollama
                        async for chunk in fallback_response:
                            text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                            if text and not text.startswith('model=') and not text.startswith('created_at='):
                                text = text.replace('<think>', '').replace('</think>', '')
                                await websocket.send_text(text)
                    elif request.provider == "openrouter":
                        try:
                            # Create new api_kwargs with the simplified prompt
                            fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                input=simplified_prompt,
                                model_kwargs=model_kwargs,
                                model_type=ModelType.LLM
                            )

                            # Get the response using the simplified prompt
                            logger.info("Making fallback OpenRouter API call")
                            fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)

                            # Handle streaming fallback_response from OpenRouter
                            async for chunk in fallback_response:
                                await websocket.send_text(chunk)
                        except Exception as e_fallback:
                            logger.error(f"Error with OpenRouter API fallback: {str(e_fallback)}")
                            error_msg = f"\nError with OpenRouter API fallback: {str(e_fallback)}\n\nPlease check that you have set the OPENROUTER_API_KEY environment variable with a valid API key."
                            await websocket.send_text(error_msg)
                    elif request.provider == "openai":
                        try:
                            # Create new api_kwargs with the simplified prompt
                            fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                input=simplified_prompt,
                                model_kwargs=model_kwargs,
                                model_type=ModelType.LLM
                            )

                            # Get the response using the simplified prompt
                            logger.info("Making fallback Openai API call")
                            fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)

                            # Handle streaming fallback_response from Openai
                            async for chunk in fallback_response:
                                text = chunk if isinstance(chunk, str) else getattr(chunk, 'text', str(chunk))
                                await websocket.send_text(text)
                        except Exception as e_fallback:
                            logger.error(f"Error with Openai API fallback: {str(e_fallback)}")
                            error_msg = f"\nError with Openai API fallback: {str(e_fallback)}\n\nPlease check that you have set the OPENAI_API_KEY environment variable with a valid API key."
                            await websocket.send_text(error_msg)
                    elif request.provider == "azure":
                        try:
                            # Create new api_kwargs with the simplified prompt
                            fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                input=simplified_prompt,
                                model_kwargs=model_kwargs,
                                model_type=ModelType.LLM
                            )

                            # Get the response using the simplified prompt
                            logger.info("Making fallback Azure AI API call")
                            fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)

                            # Handle streaming fallback response from Azure AI
                            async for chunk in fallback_response:
                                choices = getattr(chunk, "choices", [])
                                if len(choices) > 0:
                                    delta = getattr(choices[0], "delta", None)
                                    if delta is not None:
                                        text = getattr(delta, "content", None)
                                        if text is not None:
                                            await websocket.send_text(text)
                        except Exception as e_fallback:
                            logger.error(f"Error with Azure AI API fallback: {str(e_fallback)}")
                            error_msg = f"\nError with Azure AI API fallback: {str(e_fallback)}\n\nPlease check that you have set the AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_VERSION environment variables with valid values."
                            await websocket.send_text(error_msg)
                    else:
                        # Initialize Google Generative AI model
                        model_config = get_model_config(request.provider, request.model)
                        fallback_model = genai.GenerativeModel(
                            model_name=model_config["model"],
                            generation_config={
                                "temperature": model_config["model_kwargs"].get("temperature", 0.7),
                                "top_p": model_config["model_kwargs"].get("top_p", 0.8),
                                "top_k": model_config["model_kwargs"].get("top_k", 40)
                            }
                        )

                        # Get streaming response using simplified prompt
                        fallback_response = fallback_model.generate_content(simplified_prompt, stream=True)
                        # Stream the fallback response
                        for chunk in fallback_response:
                            if hasattr(chunk, 'text'):
                                await websocket.send_text(chunk.text)
                except Exception as e2:
                    logger.error(f"Error in fallback streaming response: {str(e2)}")
                    await websocket.send_text(f"\nI apologize, but your request is too large for me to process. Please try a shorter query or break it into smaller parts.")
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            else:
                # For other errors, return the error message
                await websocket.send_text(f"\nError: {error_message}")
                # Close the WebSocket connection after sending the error message
                await websocket.close()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in WebSocket handler: {str(e)}")
        try:
            await websocket.send_text(f"Error: {str(e)}")
            await websocket.close()
        except:
            pass
