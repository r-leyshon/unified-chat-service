/**
 * Centralized prompts for the chat assistant service.
 * Import and use these wherever LLM calls are made for easier maintenance.
 */

// ---------------------------------------------------------------------------
// Search term extraction (RAG)
// ---------------------------------------------------------------------------

/** System instruction for the model that extracts search terms from the user message. */
export const EXTRACTION_SYSTEM = `You help identify whether a user message is asking about a specific product so we can look up documentation.
You are given the current product's name and optional description.
Your job: output a JSON array of 1 or more search terms (strings) that would find relevant documentation, OR an empty array [] if the message is chit-chat, greeting, unrelated, or not about this product.
Reply with ONLY the JSON array, no other text. Example: ["unit conversion", "length"] or []`

/** Builds the user message for search term extraction. */
export function buildExtractionUserMessage(
  projectName: string,
  projectDescription: string | null | undefined,
  userMessage: string,
): string {
  const lines = [
    `Product name: ${projectName}`,
    projectDescription ? `Product description: ${projectDescription}` : "",
    "",
    `User message: ${userMessage}`,
    "",
    "Output a JSON array of search terms (or [] if not about this product):",
  ]
  return lines.filter(Boolean).join("\n")
}

// ---------------------------------------------------------------------------
// Chat assistant (completions)
// ---------------------------------------------------------------------------

/** Base system instruction for the chat assistant when no RAG context is provided. */
export const CHAT_ASSISTANT_BASE_SYSTEM =
  "You are a helpful product assistant. Answer concisely and accurately. If you are given context from documentation, use it to answer; if the context does not contain the answer, say so."

/** Prefix for injecting RAG context into the system instruction. */
export const CHAT_ASSISTANT_CONTEXT_PREFIX =
  "Use the following context from the product documentation when answering. If the context does not contain the answer, say so.\n\nContext:\n"

/** Builds the full system instruction for the chat assistant, with optional RAG context. */
export function buildChatAssistantSystemInstruction(contextBlock: string): string {
  if (!contextBlock.trim()) return CHAT_ASSISTANT_BASE_SYSTEM
  return `${CHAT_ASSISTANT_BASE_SYSTEM}\n\n${CHAT_ASSISTANT_CONTEXT_PREFIX}${contextBlock}`
}

// ---------------------------------------------------------------------------
// Project description generation
// ---------------------------------------------------------------------------

/** Prompt for generating a one-sentence product description from documentation. */
export const SUMMARY_PROMPT = `Summarize the following product documentation in a single sentence that gives an overview of what the product is and what it does.
Output only that one sentence, no quotes, no preamble, no "Summary:" label.`
