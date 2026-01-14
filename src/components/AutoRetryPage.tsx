import { useState, useEffect, useRef, ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutoRetryPageProps {
  children: ReactNode;
  /** Max time (ms) to wait for content before auto-retry */
  timeout?: number;
  /** Max number of auto-retries */
  maxRetries?: number;
  /** Page name for display */
  pageName?: string;
}

/**
 * Wraps a page and auto-retries if content doesn't render within timeout.
 * After maxRetries, shows a manual retry button.
 */
const AutoRetryPage = ({
  children,
  timeout = 5000,
  maxRetries = 3,
  pageName = "Page",
}: AutoRetryPageProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualRetry, setShowManualRetry] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const retryKey = useRef(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let checkIntervalId: ReturnType<typeof setInterval>;

    // Check if actual content has rendered (not just the wrapper)
    const checkContentLoaded = () => {
      if (contentRef.current) {
        // Check if there's meaningful content inside (more than just whitespace)
        const hasContent = contentRef.current.children.length > 0 &&
          contentRef.current.innerHTML.trim().length > 100;
        
        if (hasContent) {
          setIsLoading(false);
          clearTimeout(timeoutId);
          clearInterval(checkIntervalId);
          return true;
        }
      }
      return false;
    };

    // Check content every 200ms
    checkIntervalId = setInterval(() => {
      if (checkContentLoaded()) {
        clearInterval(checkIntervalId);
      }
    }, 200);

    // Set timeout for auto-retry
    timeoutId = setTimeout(() => {
      clearInterval(checkIntervalId);
      
      if (!checkContentLoaded()) {
        if (retryCount < maxRetries) {
          console.log(`AutoRetryPage: ${pageName} - Retry ${retryCount + 1}/${maxRetries}`);
          retryKey.current += 1;
          setRetryCount((prev) => prev + 1);
        } else {
          setIsLoading(false);
          setShowManualRetry(true);
        }
      }
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkIntervalId);
    };
  }, [retryCount, timeout, maxRetries, pageName]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setShowManualRetry(false);
    setIsLoading(true);
    retryKey.current += 1;
  };

  const handleHardRefresh = () => {
    window.location.reload();
  };

  if (showManualRetry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {pageName} didn't load
            </h2>
            <p className="text-muted-foreground">
              Your connection may be slow. Try refreshing the page.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleManualRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleHardRefresh} variant="outline" className="w-full">
              Hard Refresh
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="ghost" 
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {isLoading && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              Loading {pageName}...
              {retryCount > 0 && (
                <span className="block text-xs mt-1">
                  Retry {retryCount}/{maxRetries}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      <div ref={contentRef} key={retryKey.current}>
        {children}
      </div>
    </div>
  );
};

export default AutoRetryPage;
