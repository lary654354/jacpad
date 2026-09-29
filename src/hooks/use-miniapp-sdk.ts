"use client";

/** MiniApp SDK removed — Jacpad is wallet-only. */
export function useMiniAppSdk() {
  return {
    sdk: null as any,
    context: undefined as any,
    isSDKLoaded: true,
    isMiniApp: false,
    isMiniAppSaved: false,
    pinFrame: async () => "",
    pinFrameResponse: "",
    lastEvent: "",
  };
}
