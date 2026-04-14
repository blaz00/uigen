import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
import { describe, it, expect } from "vitest";
import { getToolLabel, ToolCallBadge } from "./ToolCallBadge";

describe("getToolLabel", () => {
  describe("str_replace_editor", () => {
    it("create → Creating <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/App.tsx" })).toBe("Creating App.tsx");
    });

    it("str_replace → Editing <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Button.tsx" })).toBe("Editing Button.tsx");
    });

    it("insert → Editing <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/components/Button.tsx" })).toBe("Editing Button.tsx");
    });

    it("view → Reading <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/index.tsx" })).toBe("Reading index.tsx");
    });

    it("undo_edit → Undoing edit in <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.tsx" })).toBe("Undoing edit in App.tsx");
    });

    it("create without path → Creating file", () => {
      expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
    });

    it("unknown command without path → Editing file", () => {
      expect(getToolLabel("str_replace_editor", {})).toBe("Editing file");
    });
  });

  describe("file_manager", () => {
    it("rename → Renaming <old> → <new>", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/src/old.tsx", new_path: "/src/new.tsx" })).toBe("Renaming old.tsx → new.tsx");
    });

    it("delete → Deleting <filename>", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "/src/App.tsx" })).toBe("Deleting App.tsx");
    });

    it("delete without path → Deleting file", () => {
      expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
    });

    it("unknown command → Managing file", () => {
      expect(getToolLabel("file_manager", {})).toBe("Managing file");
    });
  });

  it("unknown tool name falls back to tool name", () => {
    expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
  });
});

describe("ToolCallBadge", () => {
  it("shows spinner when pending", () => {
    render(
      <ToolCallBadge
        toolInvocation={{ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "/App.tsx" } }}
      />
    );
    expect(screen.getByText("Creating App.tsx")).toBeDefined();
    // Spinner present (no green dot)
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows green dot when done", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={{ toolName: "str_replace_editor", state: "result", result: "ok", args: { command: "create", path: "/App.tsx" } }}
      />
    );
    expect(within(container).getByText("Creating App.tsx")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  it("renders correct label for file_manager delete", () => {
    render(
      <ToolCallBadge
        toolInvocation={{ toolName: "file_manager", state: "result", result: { success: true }, args: { command: "delete", path: "/src/old.tsx" } }}
      />
    );
    expect(screen.getByText("Deleting old.tsx")).toBeDefined();
  });
});
