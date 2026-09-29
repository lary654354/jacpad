import { Metadata } from "next";
import App from "./app";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  "http://localhost:3000";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PROJECT_TITLE,
    description: PROJECT_DESCRIPTION,
    metadataBase: new URL(appUrl),
    openGraph: {
      title: PROJECT_TITLE,
      description: PROJECT_DESCRIPTION,
      images: [{ url: "/logo.png" }],
    },
    twitter: {
      card: "summary",
      title: PROJECT_TITLE,
      description: PROJECT_DESCRIPTION,
      images: ["/logo.png"],
    },
  };
}

export default function Home() {
  return <App />;
}
