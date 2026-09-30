/** Legacy Clanker client. Removed in Jacpad (Pons v2). */
export async function initializeWithWallet(_walletClient?: unknown) {
  throw new Error("Clanker SDK removed. Use Pons v2 on Robinhood Chain.");
}

export const clankerSDK = null;

export async function deployToken() {
  throw new Error("Use CreateProfileToken + Pons v2 factory");
}

export async function buyToken() {
  throw new Error("Trade on Pons launchpad");
}

export async function sellToken() {
  throw new Error("Trade on Pons launchpad");
}

export async function claimCreatorRewards() {
  throw new Error("Claim via Pons after graduation");
}
