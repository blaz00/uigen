import { anthropic } from "@ai-sdk/anthropic";

const MODEL = "claude-haiku-4-5";

// Mock provider for local development without an API key
export class MockLanguageModel {
  readonly specificationVersion = "v3" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;
  readonly supportedUrls = {};

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: any[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          return content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private async *generateMockStream(
    messages: any[],
    userPrompt: string
  ): AsyncGenerator<any> {
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };
      yield { type: "finish", finishReason: "tool-calls", usage: { promptTokens: 50, completionTokens: 30 } };
      return;
    }

    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };
      yield { type: "finish", finishReason: "tool-calls", usage: { promptTokens: 50, completionTokens: 30 } };
      return;
    }

    if (toolMessageCount === 0) {
      const text = `This is a static response. Place an Anthropic API key in .env to use real AI generation. Let me create an App.jsx to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };
      yield { type: "finish", finishReason: "tool-calls", usage: { promptTokens: 50, completionTokens: 30 } };
      return;
    }

    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:\n\n1. **${componentName}.jsx** - A fully-featured ${componentType} component\n2. **App.jsx** - The main app file that displays the component\n\nThe component is now ready to use.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }
      yield { type: "finish", finishReason: "stop", usage: { promptTokens: 50, completionTokens: 50 } };
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';\n\nconst ContactForm = () => {\n  const [formData, setFormData] = useState({ name: '', email: '', message: '' });\n  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });\n  const handleSubmit = (e) => { e.preventDefault(); console.log('Form submitted:', formData); };\n  return (\n    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">\n      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>\n      <form onSubmit={handleSubmit} className="space-y-4">\n        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />\n        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />\n        <textarea name="message" placeholder="Message" value={formData.message} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />\n        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Send</button>\n      </form>\n    </div>\n  );\n};\n\nexport default ContactForm;`;
      case "card":
        return `import React from 'react';\n\nconst Card = ({ title = "Welcome", description = "Discover amazing features.", imageUrl, actions }) => (\n  <div className="bg-white rounded-lg shadow-md overflow-hidden">\n    {imageUrl && <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />}\n    <div className="p-6">\n      <h3 className="text-xl font-semibold mb-2">{title}</h3>\n      <p className="text-gray-600 mb-4">{description}</p>\n      {actions && <div className="mt-4">{actions}</div>}\n    </div>\n  </div>\n);\n\nexport default Card;`;
      default:
        return `import { useState } from 'react';\n\nconst Counter = () => {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">\n      <h2 className="text-2xl font-bold mb-4">Counter</h2>\n      <div className="text-4xl font-bold mb-6">{count}</div>\n      <div className="flex gap-4">\n        <button onClick={() => setCount(c => c - 1)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">-</button>\n        <button onClick={() => setCount(0)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Reset</button>\n        <button onClick={() => setCount(c => c + 1)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">+</button>\n      </div>\n    </div>\n  );\n};\n\nexport default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form": return "    console.log('Form submitted:', formData);";
      case "card": return '      <div className="p-6">';
      default: return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form": return "    console.log('Form submitted:', formData);\n    alert('Thank you!');";
      case "card": return '      <div className="p-6 hover:bg-gray-50 transition-colors">';
      default: return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    return `import ${componentName} from '@/components/${componentName}';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">\n      <div className="w-full max-w-md">\n        <${componentName} />\n      </div>\n    </div>\n  );\n}`;
  }

  async doGenerate(options: any): Promise<any> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const parts: any[] = [];
    for await (const part of this.generateMockStream(options.prompt, userPrompt)) {
      parts.push(part);
    }
    const textParts = parts.filter((p) => p.type === "text-delta").map((p) => p.textDelta).join("");
    const toolCalls = parts.filter((p) => p.type === "tool-call").map((p) => ({
      toolCallType: "function" as const,
      toolCallId: p.toolCallId,
      toolName: p.toolName,
      args: p.args,
    }));
    const finishPart = parts.find((p) => p.type === "finish") as any;
    return {
      text: textParts,
      toolCalls,
      finishReason: finishPart?.finishReason || "stop",
      usage: { promptTokens: 100, completionTokens: 200 },
      warnings: [],
      rawCall: { rawPrompt: options.prompt, rawSettings: {} },
    };
  }

  async doStream(options: any): Promise<any> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of self.generateMockStream(options.prompt, userPrompt)) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return { stream, warnings: [], rawCall: { rawPrompt: options.prompt, rawSettings: {} }, rawResponse: { headers: {} } };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude") as any;
  }
  return anthropic(MODEL);
}
