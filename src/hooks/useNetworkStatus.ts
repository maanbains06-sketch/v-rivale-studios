import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline and came back online, show toast (no hard reload).
      // A forced reload can look like a "blank" or "stuck" navigation on flaky networks.
      if (wasOffline) {
        toast({
          title: "Connection Restored",
          description: "You're back online.",
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline };
};

export default useNetworkStatus;
