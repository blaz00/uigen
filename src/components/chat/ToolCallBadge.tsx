import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
  args?: Record<string, unknown>;
}

export function getToolLabel(toolName: string, args?: Record<string, unknown>): string {
  const filename = args?.path ? String(args.path).split("/").pop() : undefined;

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
      case "insert":
        return filename ? `Editing ${filename}` : "Editing file";
      case "view":
        return filename ? `Reading ${filename}` : "Reading file";
      case "undo_edit":
        return filename ? `Undoing edit in ${filename}` : "Undoing edit";
      default:
        return filename ? `Editing ${filename}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path as string | undefined;
    const newFilename = newPath ? newPath.split("/").pop() : undefined;
    switch (args?.command) {
      case "rename":
        return filename && newFilename ? `Renaming ${filename} → ${newFilename}` : "Renaming file";
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, state, result, args } = toolInvocation;
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
