import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Virtual Trading Simulator", "Learn the market. Practice your strategy. Risk nothing."),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
