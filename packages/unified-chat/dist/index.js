"use strict";
"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  ChatAssistant: () => ChatAssistant
});
module.exports = __toCommonJS(index_exports);

// src/components/chat-assistant/index.tsx
var import_react2 = require("react");
var import_react_dom = require("react-dom");

// src/components/chat-assistant/chat-window.tsx
var import_react = require("react");

// src/components/ui/button.tsx
var import_class_variance_authority = require("class-variance-authority");
var import_react_slot = require("@radix-ui/react-slot");

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/components/ui/button.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority.cva)(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? import_react_slot.Slot : "button";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}

// src/components/ui/input.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/scroll-area.tsx
var ScrollAreaPrimitive = __toESM(require("@radix-ui/react-scroll-area"));
var import_jsx_runtime3 = require("react/jsx-runtime");
function ScrollArea({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    ScrollAreaPrimitive.Root,
    {
      "data-slot": "scroll-area",
      className: cn("relative", className),
      ...props,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          ScrollAreaPrimitive.Viewport,
          {
            "data-slot": "scroll-area-viewport",
            className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
            children
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ScrollBar, {}),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ScrollAreaPrimitive.Corner, {})
      ]
    }
  );
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    ScrollAreaPrimitive.Scrollbar,
    {
      "data-slot": "scroll-area-scrollbar",
      orientation,
      className: cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      ),
      ...props,
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        ScrollAreaPrimitive.Thumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "bg-border relative flex-1 rounded-full"
        }
      )
    }
  );
}

// src/components/ui/spinner.tsx
var import_lucide_react = require("lucide-react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    import_lucide_react.Loader2,
    {
      role: "status",
      "aria-label": "Loading",
      className: cn("size-4 animate-spin", className),
      ...props
    }
  );
}

// src/components/chat-assistant/message-bubble.tsx
var import_react_markdown = __toESM(require("react-markdown"));
var import_jsx_runtime5 = require("react/jsx-runtime");
var markdownComponents = {
  p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "mb-2 last:mb-0", children }),
  strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { className: "font-semibold", children }),
  ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "my-2 list-disc pl-4 space-y-0.5", children }),
  ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ol", { className: "my-2 list-decimal pl-4 space-y-0.5", children }),
  li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { className: "leading-relaxed", children })
};
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: cn("flex", isUser ? "justify-end" : "justify-start"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: cn(
        "px-4 py-3 rounded-lg text-sm leading-relaxed break-words",
        isUser ? "max-w-xs" : "max-w-sm",
        isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary/70 text-foreground rounded-bl-none"
      ),
      children: isUser ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-pretty", children: message.content }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "text-pretty [&_p]:mb-2 [&_p:last-child]:mb-0", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_react_markdown.default, { components: markdownComponents, children: message.content }) })
    }
  ) });
}

// src/components/chat-assistant/chat-window.tsx
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function ChatWindow({
  isOpen,
  onClose,
  apiUrl,
  productId,
  productName,
  userId,
  userName,
  theme,
  showSources = true,
  maxMessages = 50,
  placeholder = "Ask me anything...",
  title = "Chat Assistant",
  subtitle = "Powered by AI",
  onEvent
}) {
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [input, setInput] = (0, import_react.useState)("");
  const [isLoading, setIsLoading] = (0, import_react.useState)(false);
  const [statusMessage, setStatusMessage] = (0, import_react.useState)(null);
  const scrollRef = (0, import_react.useRef)(null);
  const reportEvent = (event) => {
    onEvent?.(event);
  };
  (0, import_react.useEffect)(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    const newUserMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev.slice(-maxMessages + 1), newUserMessage]);
    reportEvent({ type: "message_sent", payload: { content: userMessage } });
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const assistantMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: productId,
          user: {
            id: userId,
            name: userName
          },
          messages: [...messages, newUserMessage]
        })
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let fullAnswer = "";
      let sources = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "status") {
                setStatusMessage(data.message ?? "Looking up guidance\u2026");
              } else if (data.type === "search" && Array.isArray(data.searchTerms)) {
                reportEvent({ type: "search", payload: { searchTerms: data.searchTerms } });
              } else if (data.type === "content") {
                setStatusMessage(null);
                fullAnswer += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated[updated.length - 1].role === "assistant") {
                    updated[updated.length - 1].content = fullAnswer;
                  }
                  return updated;
                });
              } else if (data.type === "sources") {
                sources = data.sources;
              } else if (data.type === "done") {
                setStatusMessage(null);
                reportEvent({
                  type: "message_received",
                  payload: { answer: fullAnswer, sources }
                });
              }
            } catch {
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get response";
      reportEvent({ type: "error", payload: { error: errorMessage } });
      setMessages((prev) => prev.slice(0, -1));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };
  if (!isOpen) return null;
  const themeStyles = {
    "--chat-primary": theme?.primaryColor || "#3b82f6",
    "--chat-accent": theme?.accentColor || "#10b981",
    "--chat-radius": theme?.borderRadius ? `${theme.borderRadius}px` : "12px"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      className: "fixed bottom-0 right-0 w-full sm:w-[380px] sm:rounded-tl-lg bg-background border-l border-t border-border shadow-2xl z-[9999] flex flex-col transition-[transform,opacity] duration-200 ease-out",
      style: {
        ...themeStyles,
        // Anchor bottom-right; fixed height so inner scroll works and pane stays in viewport
        position: "fixed",
        bottom: 0,
        right: 0,
        zIndex: 9999,
        height: "min(600px, 85vh)",
        maxHeight: "85vh"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "text-lg font-semibold text-foreground", children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted-foreground", children: subtitle })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              onClick: onClose,
              className: "p-1.5 hover:bg-secondary rounded-md transition-colors",
              "aria-label": "Close chat",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react2.X, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ScrollArea, { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex flex-col gap-4 p-4", children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col items-center justify-center h-full text-center py-8", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-4xl mb-2", children: "\u{1F4AC}" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-sm text-muted-foreground", children: "No messages yet. Start a conversation!" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          messages.map((msg, idx) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MessageBubble, { message: msg }, idx)),
          isLoading && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex justify-start", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex gap-2 items-center px-3 py-2 rounded-lg bg-secondary/50", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Spinner, { className: "w-4 h-4" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-xs text-muted-foreground", children: statusMessage || "Thinking\u2026" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { ref: scrollRef })
        ] }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "p-4 border-t border-border bg-gradient-to-t from-background to-background", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("form", { onSubmit: handleSendMessage, className: "flex gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            Input,
            {
              value: input,
              onChange: (e) => setInput(e.target.value),
              placeholder,
              disabled: isLoading,
              className: "flex-1 bg-secondary/50 border-secondary focus:border-primary"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            Button,
            {
              type: "submit",
              disabled: isLoading || !input.trim(),
              size: "icon",
              className: "bg-primary hover:bg-primary/90",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react2.Send, { className: "w-4 h-4" })
            }
          )
        ] }) })
      ]
    }
  );
}

// src/components/chat-assistant/floating-button.tsx
var import_lucide_react3 = require("lucide-react");
var import_jsx_runtime7 = require("react/jsx-runtime");
function FloatingButton({ onClick, isOpen, theme }) {
  if (isOpen) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "button",
    {
      onClick,
      className: cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-[10000] flex items-center justify-center",
        "transition-[box-shadow,transform] duration-200",
        "bg-primary hover:bg-primary/90"
      ),
      style: {
        // Fallback so button is always bottom-right and sized even if Tailwind content scan misses the package
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        zIndex: 1e4,
        ...theme?.primaryColor ? { backgroundColor: theme.primaryColor } : {}
      },
      "aria-label": isOpen ? "Close chat" : "Open chat",
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react3.MessageCircle, { className: "w-6 h-6 text-primary-foreground", style: { width: 24, height: 24 } })
    }
  );
}

// src/components/chat-assistant/index.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
function ChatAssistant({
  apiUrl,
  productId,
  productName,
  user,
  theme,
  displayMode = "floating",
  showSources = true,
  maxMessages = 50,
  placeholder,
  title,
  subtitle,
  onEvent
}) {
  const [isOpen, setIsOpen] = (0, import_react2.useState)(false);
  const userId = user?.id ?? "anonymous";
  const userName = user?.name;
  if (displayMode === "inline") {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ChatWindow,
      {
        isOpen: true,
        onClose: () => {
        },
        apiUrl,
        productId,
        productName,
        userId,
        userName,
        theme,
        showSources,
        maxMessages,
        placeholder,
        title,
        subtitle,
        onEvent
      }
    );
  }
  const floatingUI = /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      FloatingButton,
      {
        onClick: () => {
          const next = !isOpen;
          setIsOpen(next);
          onEvent?.({ type: next ? "open" : "close" });
        },
        isOpen,
        theme
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ChatWindow,
      {
        isOpen,
        onClose: () => {
          setIsOpen(false);
          onEvent?.({ type: "close" });
        },
        apiUrl,
        productId,
        productName,
        userId,
        userName,
        theme,
        showSources,
        maxMessages,
        placeholder,
        title,
        subtitle,
        onEvent
      }
    )
  ] });
  if (typeof document !== "undefined") {
    return (0, import_react_dom.createPortal)(floatingUI, document.body);
  }
  return floatingUI;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatAssistant
});
//# sourceMappingURL=index.js.map