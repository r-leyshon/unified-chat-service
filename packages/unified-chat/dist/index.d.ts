import * as react_jsx_runtime from 'react/jsx-runtime';

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}
interface ChatSource {
    title: string;
    url: string;
}
interface ChatResponse {
    answer: string;
    sources?: ChatSource[];
}
interface ChatUser {
    id: string;
    name?: string;
    email?: string;
}
interface ChatTheme {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    fontFamily?: string;
    borderRadius?: number;
}
type DisplayMode = "floating" | "inline";
interface ChatAssistantEvent {
    type: "open" | "close" | "message_sent" | "message_received" | "search" | "error";
    payload?: unknown;
}
interface ChatAssistantProps {
    apiUrl: string;
    productId: string;
    /** Optional: product name for event log display when reporting to a central service */
    productName?: string;
    user?: ChatUser;
    theme?: ChatTheme;
    displayMode?: DisplayMode;
    showSources?: boolean;
    maxMessages?: number;
    onEvent?: (event: ChatAssistantEvent) => void;
    placeholder?: string;
    title?: string;
    subtitle?: string;
}

declare function ChatAssistant({ apiUrl, productId, productName, user, theme, displayMode, showSources, maxMessages, placeholder, title, subtitle, onEvent, }: ChatAssistantProps): react_jsx_runtime.JSX.Element;

export { ChatAssistant, type ChatAssistantEvent, type ChatAssistantProps, type ChatMessage, type ChatResponse, type ChatSource, type ChatTheme, type ChatUser, type DisplayMode };
