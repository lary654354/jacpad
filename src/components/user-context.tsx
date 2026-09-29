"use client";

import React, { createContext, useContext } from "react";
import { useAccount } from "wagmi";

type Ctx = {
  address?: string;
  isConnected: boolean;
};

const UserCtx = createContext<Ctx>({ isConnected: false });

export function UserContext({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  return (
    <UserCtx.Provider value={{ address, isConnected }}>{children}</UserCtx.Provider>
  );
}

export function useUser() {
  return useContext(UserCtx);
}
