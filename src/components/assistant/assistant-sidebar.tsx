import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  sendAssistantMessage,
  type AssistantLink,
  type AssistantMessagePayload,
  type AssistantToolCall,
} from "@/service/assistantService";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolCalls?: AssistantToolCall[];
  links?: AssistantLink[];
};

type StoredConversation = {
  conversationId?: string;
  messages: ChatMessage[];
};

const suggestions = [
  "What is my leave balance?",
  "Show low stock items.",
  "Check invoice INV-1001 status.",
  "Give me inventory totals.",
];

function detectModule(pathname: string) {
  if (pathname.startsWith("/finance")) return "Finance";
  if (pathname.startsWith("/inventory")) return "Inventory";
  if (pathname.startsWith("/purchase")) return "Purchase";
  if (pathname.startsWith("/sales")) return "Sales";
  if (
    pathname.startsWith("/hr") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/employee")
  ) {
    return "HR";
  }
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "Dashboard";
  return "ERP";
}

function readableScreen(pathname: string) {
  const parts = pathname
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "));

  if (parts.length === 0) return "Dashboard";
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type RichTextBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assistantLinkTarget(link: AssistantLink) {
  return link.label.replace(/^open\s+/i, "").trim();
}

function addInlineLinks(content: string, links?: AssistantLink[]) {
  if (!links?.length) return content;

  return links.reduce((next, link) => {
    if (!link.url || next.includes(`](${link.url})`)) {
      return next;
    }

    const target = assistantLinkTarget(link);
    if (!target) return next;

    const pattern = new RegExp(
      `(^|[^\\w/-])(${escapeRegExp(target)})(?=$|[^\\w/-])`,
      "i",
    );

    return next.replace(pattern, (_match, prefix: string, label: string) => {
      return `${prefix}[${label}](${link.url})`;
    });
  }, content);
}

function parseRichTextBlocks(content: string): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  let paragraph: string[] = [];
  let currentList: Extract<
    RichTextBlock,
    { type: "ordered-list" | "unordered-list" }
  > | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };

  content.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      currentList = null;
      return;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    const unordered = trimmed.match(/^[-*]\s+(.*)$/);

    if (ordered) {
      flushParagraph();
      if (!currentList || currentList.type !== "ordered-list") {
        currentList = { type: "ordered-list", items: [] };
        blocks.push(currentList);
      }
      currentList.items.push(ordered[1]);
      return;
    }

    if (unordered) {
      flushParagraph();
      if (!currentList || currentList.type !== "unordered-list") {
        currentList = { type: "unordered-list", items: [] };
        blocks.push(currentList);
      }
      currentList.items.push(unordered[1]);
      return;
    }

    if (currentList && currentList.items.length > 0) {
      currentList.items[currentList.items.length - 1] += `\n${trimmed}`;
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  return blocks;
}

function renderRichLink(text: string, url: string, key: string) {
  const className =
    "font-medium text-primary underline underline-offset-2 transition hover:text-primary/80";

  if (url.startsWith("/")) {
    return (
      <Link key={key} to={url} className={className}>
        {text}
      </Link>
    );
  }

  if (/^https?:\/\//i.test(url)) {
    return (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {text}
      </a>
    );
  }

  return <span key={key}>{text}</span>;
}

function renderInlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]\n]+)\]\(\s*([^\s)]+)\s*\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      nodes.push(
        renderRichLink(match[1], match[2].trim(), `${keyPrefix}-link-${index}`),
      );
    } else if (match[3]) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold">
          {renderInlineMarkdown(match[3], `${keyPrefix}-strong-${index}`)}
        </strong>,
      );
    } else if (match[4]) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-muted px-1 py-0.5 text-[0.85em]"
        >
          {match[4]}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

function renderTextWithBreaks(value: string, keyPrefix: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => {
    const nodes = renderInlineMarkdown(line, `${keyPrefix}-line-${index}`);
    if (index === 0) return nodes;
    return [<br key={`${keyPrefix}-break-${index}`} />, ...nodes];
  });
}

function AssistantRichText({
  content,
  links,
}: {
  content: string;
  links?: AssistantLink[];
}) {
  const richContent = useMemo(
    () => addInlineLinks(content, links),
    [content, links],
  );
  const blocks = useMemo(() => parseRichTextBlocks(richContent), [richContent]);

  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, blockIndex) => {
        if (block.type === "ordered-list") {
          return (
            <ol
              key={`block-${blockIndex}`}
              className="list-decimal space-y-1 pl-5"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${blockIndex}-${itemIndex}`} className="pl-1">
                  {renderTextWithBreaks(item, `${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`block-${blockIndex}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${blockIndex}-${itemIndex}`} className="pl-1">
                  {renderTextWithBreaks(item, `${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-wrap">
            {renderTextWithBreaks(block.lines.join("\n"), `${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}

export function AssistantSidebar() {
  const location = useLocation();
  const { user, activeCompanyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const storageKey = useMemo(() => {
    const userId = user?.id ?? user?.userId ?? "anonymous";
    const companyId = activeCompanyId ?? "no-company";
    return `sunway-assistant:${companyId}:${userId}`;
  }, [activeCompanyId, user?.id, user?.userId]);

  const currentModule = useMemo(
    () => detectModule(location.pathname),
    [location.pathname],
  );
  const currentScreen = useMemo(
    () => readableScreen(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([]);
        setConversationId(undefined);
        setHydratedKey(storageKey);
        return;
      }

      const stored = JSON.parse(raw) as StoredConversation;
      setMessages(stored.messages ?? []);
      setConversationId(stored.conversationId);
      setHydratedKey(storageKey);
    } catch {
      setMessages([]);
      setConversationId(undefined);
      setHydratedKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (hydratedKey !== storageKey) return;
    const stored: StoredConversation = { conversationId, messages };
    localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [conversationId, hydratedKey, messages, storageKey]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, sending]);

  const history: AssistantMessagePayload[] = useMemo(
    () =>
      messages.slice(-12).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  async function submitMessage(value?: string) {
    const text = (value ?? input).trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await sendAssistantMessage({
        conversationId,
        message: text,
        currentModule,
        currentScreen,
        pageContext: {
          path: location.pathname,
          search: location.search,
          companyId: activeCompanyId,
        },
        history,
      });

      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: response.message,
          createdAt: new Date().toISOString(),
          toolCalls: response.toolCalls,
          links: response.links,
        },
      ]);

      if (!response.configured && response.error) {
        toast.warning("Assistant setup needed", {
          description: response.error,
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Assistant request failed.";
      toast.error("Assistant error", { description: message });
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    setConversationId(undefined);
    setMessages([]);
    localStorage.removeItem(storageKey);
  }

  if (!open) {
    return (
      <Button
        type="button"
        className="fixed bottom-5 right-5 z-50 h-12 rounded-full px-4 shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Bot className="size-5" />
        Assistant
      </Button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex h-[min(680px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">Sunway Assistant</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(false)}
          aria-label="Collapse assistant"
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={clearConversation}
          aria-label="Clear assistant chat"
        >
          <X className="size-4" />
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              Ask about live ERP data. Tool calling is connected for HR leaves,
              inventory stock, and finance invoices.
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-md border px-3 py-2 text-left text-xs transition hover:bg-muted"
                  onClick={() => submitMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-muted/40 text-foreground",
                )}
              >
                {message.role === "assistant" ? (
                  <AssistantRichText
                    content={message.content}
                    links={message.links}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        className="border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
      >
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder="Ask about leave, stock, invoices..."
            className="max-h-28 min-h-11 resize-none py-3 text-sm leading-5"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            aria-label="Send assistant message"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </aside>
  );
}
