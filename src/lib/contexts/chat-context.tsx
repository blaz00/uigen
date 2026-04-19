"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useRef,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage as Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
  status: string;
  error: Error | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const [input, setInput] = useState("");

  // Use a ref so the body function always returns the latest filesystem state
  const fileSystemRef = useRef(fileSystem);
  const projectIdRef = useRef(projectId);
  useEffect(() => { fileSystemRef.current = fileSystem; }, [fileSystem]);
  useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

  const { messages, sendMessage: aiSendMessage, status, error } = useAIChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        files: fileSystemRef.current.serialize(),
        projectId: projectIdRef.current,
      }),
    }),
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall as any);
    },
    onError: (err) => {
      console.error('[Chat] Error:', err, JSON.stringify(err));
    },
  });

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    aiSendMessage({ text });
    setInput("");
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        sendMessage,
        status,
        error,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
