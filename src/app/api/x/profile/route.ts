import { NextRequest, NextResponse } from "next/server";
import { normalizeHandle } from "~/lib/pons";

export const dynamic = "force-dynamic";

const FXTWITTER_UA =
  "Jacpad/1.0 (+https://jacpad.app; profile lookup)";

function upgradeAvatar(url: string): string {
  if (!url) return "";
  return url.includes("_normal") ? url.replace("_normal", "_400x400") : url;
}

async function fetchFxTwitter(handle: string) {
  const res = await fetch(
    `https://api.fxtwitter.com/2/profile/${encodeURIComponent(handle)}`,
    {
      headers: {
        "User-Agent": FXTWITTER_UA,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    }
  );
  return res;
}

async function fetchUnavatarFallback(handle: string) {
  const res = await fetch(
    `https://unavatar.io/twitter/${encodeURIComponent(handle)}?json`,
    {
      headers: { Accept: "application/json", "User-Agent": FXTWITTER_UA },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const avatar = json?.url || "";
  if (!avatar) return null;
  return {
    id: "",
    username: handle,
    name: handle,
    bio: "",
    avatarUrl: upgradeAvatar(avatar),
    verified: false,
    metrics: null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const handle = normalizeHandle(request.nextUrl.searchParams.get("handle") || "");
    if (!handle || !/^[a-z0-9_]{1,15}$/i.test(handle)) {
      return NextResponse.json({ error: "Invalid X handle" }, { status: 400 });
    }

    const res = await fetchFxTwitter(handle);

    if (res.ok) {
      const json = await res.json();
      const user = json?.user;
      if (user?.screen_name || user?.name) {
        return NextResponse.json({
          success: true,
          profile: {
            id: String(user.id || ""),
            username: user.screen_name || handle,
            name: user.name || user.screen_name || handle,
            bio: user.description || "",
            avatarUrl: upgradeAvatar(user.avatar_url || user.avatar || ""),
            verified: Boolean(user.verified || user.is_blue_verified),
            metrics: user.public_metrics || {
              followers: user.followers,
              following: user.following,
              tweets: user.statuses ?? user.tweets,
            },
            source: "fxtwitter",
          },
        });
      }
    }

    if (res.status === 404) {
      return NextResponse.json({ error: "X account not found" }, { status: 404 });
    }

    // Fallback: avatar-only via unavatar (still public, no key)
    console.warn("[X PROFILE] fxtwitter failed", res.status, await res.text().catch(() => ""));
    const fallback = await fetchUnavatarFallback(handle);
    if (fallback) {
      return NextResponse.json({
        success: true,
        profile: { ...fallback, source: "unavatar" },
        warning: "Full profile unavailable; avatar only",
      });
    }

    return NextResponse.json({ error: "Failed to fetch X profile" }, { status: 502 });
  } catch (error: any) {
    console.error("[X PROFILE]", error);
    return NextResponse.json(
      { error: error?.message || "X profile lookup failed" },
      { status: 500 }
    );
  }
}
