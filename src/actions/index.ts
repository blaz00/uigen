"use server";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function signUp(): Promise<AuthResult> {
  return { success: false, error: "Account creation is not available." };
}

export async function signIn(): Promise<AuthResult> {
  return { success: false, error: "Sign in is not available." };
}

export async function signOut() {}

export async function getUser() {
  return null;
}
