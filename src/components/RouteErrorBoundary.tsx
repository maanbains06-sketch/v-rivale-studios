import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

/**
 * Catches render/runtime errors (including lazy chunk load failures) and shows a safe fallback.
 * This prevents a "blank screen" when a route chunk fails to load on unstable networks.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    // Keep this log for debugging in production builds.
    console.error("RouteErrorBoundary caught error:", error);
  }

  private handleRetry = () => {
    // A full reload is the most reliable way to re-fetch the failed route chunk.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-effect border-border/20">
          <CardHeader className="text-center">
            <CardTitle>{this.props.title ?? "Something didn’t load"}</CardTitle>
            <CardDescription>
              Your connection may be unstable. Tap retry to reload this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={this.handleRetry}>
              Retry
            </Button>
            <Button className="w-full" variant="outline" onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default RouteErrorBoundary;
