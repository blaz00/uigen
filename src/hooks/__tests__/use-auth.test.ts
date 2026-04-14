import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "new-project-id" });
  });

  test("returns signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    test("calls signInAction with email and password", async () => {
      (signInAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("sets isLoading to true during sign in and false after", async () => {
      let resolveSignIn: (val: any) => void;
      const pendingSignIn = new Promise((res) => (resolveSignIn = res));
      (signInAction as any).mockReturnValue(pendingSignIn);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@example.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: false });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signInAction", async () => {
      const mockResult = { success: false, error: "Invalid credentials" };
      (signInAction as any).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(returnValue).toEqual(mockResult);
    });

    test("sets isLoading to false even if signInAction throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("user@example.com", "pass");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signInAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("signUp", () => {
    test("calls signUpAction with email and password", async () => {
      (signUpAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "newpass");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "newpass");
    });

    test("sets isLoading to true during sign up and false after", async () => {
      let resolveSignUp: (val: any) => void;
      const pendingSignUp = new Promise((res) => (resolveSignUp = res));
      (signUpAction as any).mockReturnValue(pendingSignUp);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp!({ success: false });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signUpAction", async () => {
      const mockResult = { success: true };
      (signUpAction as any).mockResolvedValue(mockResult);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "proj-1" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "pass");
      });

      expect(returnValue).toEqual(mockResult);
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signUpAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass");
      });

      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn", () => {
    test("creates project from anon work and redirects when anon work exists", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Hello" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "<div/>" } },
      };
      (getAnonWorkData as any).mockReturnValue(anonWork);
      (signInAction as any).mockResolvedValue({ success: true });
      (createProject as any).mockResolvedValue({ id: "anon-project-id" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from /),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      expect(getProjects).not.toHaveBeenCalled();
    });

    test("ignores anon work with empty messages and redirects to existing project", async () => {
      (getAnonWorkData as any).mockReturnValue({ messages: [], fileSystemData: {} });
      (signInAction as any).mockResolvedValue({ success: true });
      (getProjects as any).mockResolvedValue([{ id: "existing-project-id" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project-id");
    });

    test("redirects to most recent project when user has existing projects", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getProjects as any).mockResolvedValue([
        { id: "recent-project" },
        { id: "older-project" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("creates new project and redirects when no existing projects", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "brand-new-project" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });

    test("same post-sign-in flow runs after successful signUp", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getProjects as any).mockResolvedValue([{ id: "user-project" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/user-project");
    });
  });
});
