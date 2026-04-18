"use client";

import { useState } from "react";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      return { success: false, error: "Sign in is not available." };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      return { success: false, error: "Account creation is not available." };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, signUp, isLoading };
}
