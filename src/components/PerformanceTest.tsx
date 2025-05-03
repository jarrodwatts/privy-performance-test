"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, InfoIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  COOKIE_CLICKER_CONTRACT_ADDRESS,
  COOKIE_CLICKER_CONTRACT_ABI,
} from "@/constants/contracts";
import chain from "@/constants/chain";
import { encodeFunctionData } from "viem";
import { waitForTransaction } from "@/lib/wagmi";

// Define metrics types
type TransactionMetric = {
  submitted: number;
  receipt: number;
};

export default function PerformanceTest() {
  const { ready, login, logout, user, authenticated, sendTransaction } =
    usePrivy();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [transactionSubmittedTime, setTransactionSubmittedTime] = useState<
    number | null
  >(null);
  const [transactionReceiptTime, setTransactionReceiptTime] = useState<
    number | null
  >(null);

  // Store historical metrics
  const [metrics, setMetrics] = useState<TransactionMetric[]>([]);

  // Animation state
  const [isRunning, setIsRunning] = useState(false);
  const [displayedSubmittedTime, setDisplayedSubmittedTime] = useState(0);
  const [displayedReceiptTime, setDisplayedReceiptTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Prevent flash of content by setting a small delay for initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Animation effect
  useEffect(() => {
    if (!isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;
      if (elapsed > 16) {
        // Roughly 60fps
        lastTimestampRef.current = timestamp;

        // Update displayed times based on current real times
        const now = Date.now();
        const timeFromStart = startTime ? now - startTime : 0;

        // Update submitted time (if not yet reached)
        if (transactionSubmittedTime) {
          const targetSubmittedDelta =
            transactionSubmittedTime - (startTime || 0);
          setDisplayedSubmittedTime(
            Math.min(timeFromStart, targetSubmittedDelta)
          );
        } else {
          setDisplayedSubmittedTime(timeFromStart);
        }

        // Update receipt time (if not yet reached)
        if (transactionReceiptTime) {
          const targetReceiptDelta = transactionReceiptTime - (startTime || 0);
          setDisplayedReceiptTime(Math.min(timeFromStart, targetReceiptDelta));
        } else if (transactionSubmittedTime) {
          setDisplayedReceiptTime(timeFromStart);
        }

        // Check if we should stop the animation
        if (transactionReceiptTime) {
          setIsRunning(false);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, startTime, transactionSubmittedTime, transactionReceiptTime]);

  // Save metrics when a transaction completes
  useEffect(() => {
    if (
      !isRunning &&
      startTime &&
      transactionSubmittedTime &&
      transactionReceiptTime
    ) {
      setMetrics((prev) => [
        ...prev,
        {
          submitted: transactionSubmittedTime - startTime,
          receipt: transactionReceiptTime - transactionSubmittedTime,
        },
      ]);
    }
  }, [isRunning, startTime, transactionSubmittedTime, transactionReceiptTime]);

  // Time formatters
  const formatTime = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  // Get displayed times for UI
  const getClickTime = () => {
    return "0ms";
  };

  const getSubmittedTime = () => {
    if (!startTime) return "0ms";
    if (isRunning && !transactionSubmittedTime) {
      return formatTime(displayedSubmittedTime);
    }
    if (transactionSubmittedTime) {
      return formatTime(transactionSubmittedTime - startTime);
    }
    return "0ms";
  };

  const getReceiptTime = () => {
    if (!startTime) return "0ms";
    if (isRunning && !transactionReceiptTime) {
      return formatTime(displayedReceiptTime);
    }
    if (transactionReceiptTime) {
      return formatTime(transactionReceiptTime - startTime);
    }
    return "0ms";
  };

  // Calculate time since previous step
  const getClickDelta = () => {
    return "0ms";
  };

  const getSubmittedDelta = () => {
    if (!startTime) return "0ms";
    if (isRunning && !transactionSubmittedTime) {
      return formatTime(displayedSubmittedTime);
    }
    if (transactionSubmittedTime) {
      return formatTime(transactionSubmittedTime - startTime);
    }
    return "0ms";
  };

  const getReceiptDelta = () => {
    if (!transactionSubmittedTime) return "0ms";
    if (isRunning && !transactionReceiptTime && transactionSubmittedTime) {
      return formatTime(
        displayedReceiptTime - (transactionSubmittedTime - startTime!)
      );
    }
    if (transactionReceiptTime && transactionSubmittedTime) {
      return formatTime(transactionReceiptTime - transactionSubmittedTime);
    }
    return "0ms";
  };

  // Calculate statistics
  const calculateStats = (data: number[]) => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0 };

    const sum = data.reduce((acc, val) => acc + val, 0);
    const avg = sum / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);

    return { avg, min, max };
  };

  const getSubmittedStats = () => {
    const data = metrics.map((m) => m.submitted);
    return calculateStats(data);
  };

  const getReceiptStats = () => {
    const data = metrics.map((m) => m.receipt);
    return calculateStats(data);
  };

  const getTotalStats = () => {
    const data = metrics.map((m) => m.submitted + m.receipt);
    return calculateStats(data);
  };

  async function beginPerformanceTest() {
    // Reset times
    setStartTime(null);
    setTransactionSubmittedTime(null);
    setTransactionReceiptTime(null);
    setDisplayedSubmittedTime(0);
    setDisplayedReceiptTime(0);
    lastTimestampRef.current = 0;

    // 1. Kick off a timer
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);

    try {
      // 2. Send transaction using Privy's embedded wallet
      const tx = await sendTransaction({
        to: COOKIE_CLICKER_CONTRACT_ADDRESS,
        chainId: chain.id,
        data: encodeFunctionData({
          abi: COOKIE_CLICKER_CONTRACT_ABI,
          functionName: "click",
          args: [],
        }),
      });

      // Record when transaction was submitted
      setTransactionSubmittedTime(Date.now());
      console.log("Transaction submitted:", tx);

      // 3. Wait for transaction receipt using wagmi
      const txHash = tx.hash;

      // Using waitForTransaction to track the receipt time
      const receiptPromise = waitForTransaction(txHash);

      // Add a receipt listener
      receiptPromise
        .then((receipt) => {
          // Record when receipt was received
          setTransactionReceiptTime(Date.now());
          console.log("Transaction confirmed:", receipt);
        })
        .catch((error) => {
          console.error("Error waiting for receipt:", error);
          setIsRunning(false);
        });
    } catch (error) {
      console.error("Transaction error:", error);
      setIsRunning(false);
    }
  }

  const resetStats = () => {
    setMetrics([]);
  };

  // Common container for consistent layout
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      {children}
    </div>
  );

  // Initial page loading state
  if (isPageLoading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </Container>
    );
  }

  // Not ready or wallet not connected state
  if (!ready || !authenticated) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-6">
          <h2 className="text-center text-xl font-semibold">Welcome</h2>
          <p className="text-center text-gray-600">
            Connect your wallet to continue
          </p>
          <Button onClick={login} className="w-full">
            Login with Privy
          </Button>
        </div>
      </Container>
    );
  }

  // Success state - wallet connected - Show the Transaction Performance tracker
  return (
    <Container>
      <div className="flex flex-col justify-center items-center w-full gap-8 max-w-[500px]">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Connected: {user?.wallet?.address}
          </h2>
          <Button onClick={logout} variant="destructive" className="mt-2">
            Logout
          </Button>
        </div>

        {/* Current Transaction Metrics Card */}
        <div className="flex-shrink-0 flex flex-col items-center rounded-lg border bg-white p-6 shadow-sm w-full">
          <div className="flex space-x-4 mb-6">
            <Button onClick={beginPerformanceTest} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Send Transaction"
              )}
            </Button>

            <Button
              onClick={resetStats}
              variant="outline"
              disabled={metrics.length === 0}
            >
              Reset Stats
            </Button>
          </div>

          <h3 className="text-lg font-medium mb-4 self-start">
            Current Transaction Metrics
          </h3>

          <TooltipProvider>
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="font-medium">Event</div>
              <div>Time Since Click</div>
              <div>Delta (previous)</div>

              <div className="font-medium flex items-center">
                Click
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      User clicks the submit button and the function to send
                      transaction begins.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>{getClickTime()}</div>
              <div>{getClickDelta()}</div>

              <div className="font-medium flex items-center">
                Submitted
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Time it took for the transaction to arrive on-chain (and
                      the app to get a transaction hash).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={
                  isRunning && !transactionSubmittedTime
                    ? "text-primary font-bold"
                    : ""
                }
              >
                {getSubmittedTime()}
              </div>
              <div
                className={
                  isRunning && !transactionSubmittedTime
                    ? "text-primary font-bold"
                    : ""
                }
              >
                {getSubmittedDelta()}
              </div>

              <div className="font-medium flex items-center">
                Receipt
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Time it took for the transaction to be confirmed and the
                      tx receipt to be available in the app.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={
                  isRunning && !transactionReceiptTime
                    ? "text-primary font-bold"
                    : ""
                }
              >
                {getReceiptTime()}
              </div>
              <div
                className={
                  isRunning && !transactionReceiptTime
                    ? "text-primary font-bold"
                    : ""
                }
              >
                {getReceiptDelta()}
              </div>
            </div>
          </TooltipProvider>
        </div>

        {metrics.length > 0 && (
          <>
            <Separator className="w-full" />

            {/* Statistics Card */}
            <div className="flex-shrink-0 rounded-lg border bg-white p-6 shadow-sm w-full">
              <h3 className="text-lg font-medium mb-4">
                Performance Statistics ({metrics.length} transactions)
              </h3>

              <div className="w-full grid grid-cols-4 gap-2">
                <div className="font-medium">Metric</div>
                <div>Average</div>
                <div>Minimum</div>
                <div>Maximum</div>

                <div className="font-medium">Submission</div>
                <div>{formatTime(getSubmittedStats().avg)}</div>
                <div>{formatTime(getSubmittedStats().min)}</div>
                <div>{formatTime(getSubmittedStats().max)}</div>

                <div className="font-medium">Receipt</div>
                <div>{formatTime(getReceiptStats().avg)}</div>
                <div>{formatTime(getReceiptStats().min)}</div>
                <div>{formatTime(getReceiptStats().max)}</div>

                <div className="font-medium">Total</div>
                <div>{formatTime(getTotalStats().avg)}</div>
                <div>{formatTime(getTotalStats().min)}</div>
                <div>{formatTime(getTotalStats().max)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
