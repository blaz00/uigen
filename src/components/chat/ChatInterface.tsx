"use client";

import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, sendMessage, status, error } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <MessageList messages={messages} isLoading={status === "streaming"} />
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
          <div className="pr-4">
            <MessageList messages={messages} isLoading={status === "streaming"} />
          </div>
        </ScrollArea>
      )}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-all">
          Error: {error.message || JSON.stringify(error) || error.toString() || '(unknown)'}
        </div>
      )}
      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={status === "submitted" || status === "streaming"}
        />
      </div>
    </div>
  );
}
