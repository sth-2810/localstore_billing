import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExternalLink, CameraOff, CheckCircle2, XCircle, ScanLine } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getProductByBarcode, listProducts } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react/src/generated/api.schemas";

export interface ScanResult {
  found: boolean;
  name?: string;
}

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => Promise<ScanResult>;
  /** Called when a product is selected by name search */
  onAddProduct: (product: Product) => void;
}

type ScanStatus =
  | { type: "idle" }
  | { type: "looking"; barcode: string }
  | { type: "found"; name: string }
  | { type: "notfound" };

export function BarcodeScannerModal({ open, onOpenChange, onScan, onAddProduct }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ScanStatus>({ type: "idle" });
  const [debugInfo, setDebugInfo] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [nameMatches, setNameMatches] = useState<Product[]>([]);

  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const processingRef = useRef(false);
  const lastBarcodeRef = useRef("");
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setStatus({ type: "idle" });
    setIsLoading(true);
    setDebugInfo("Starting…");
    setManualInput("");
    setNameMatches([]);
    processingRef.current = false;
    lastBarcodeRef.current = "";

    if (window.self !== window.top) {
      setIsLoading(false);
      setError("iframe");
      return;
    }

    let stopped = false;
    let stream: MediaStream | null = null;
    let scanInterval: ReturnType<typeof setInterval> | null = null;
    let zxingReader: BrowserMultiFormatReader | null = null;

    async function handleDetected(barcode: string) {
      if (processingRef.current) return;
      if (barcode === lastBarcodeRef.current) return;
      processingRef.current = true;
      lastBarcodeRef.current = barcode;
      setStatus({ type: "looking", barcode });
      try {
        const result = await onScanRef.current(barcode);
        if (!stopped) {
          setStatus(result.found
            ? { type: "found", name: result.name ?? barcode }
            : { type: "notfound" }
          );
        }
      } catch {
        if (!stopped) setStatus({ type: "notfound" });
      }
      cooldownRef.current = setTimeout(() => {
        if (!stopped) {
          setStatus({ type: "idle" });
          lastBarcodeRef.current = "";
          processingRef.current = false;
        }
      }, 2500);
    }

    async function startCamera() {
      try {
        // Get camera (prefer rear on mobile, fall back to any)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (!stopped) setIsLoading(false);

        const hasBarcodeDetector = "BarcodeDetector" in window;
        setDebugInfo(`Camera ready. BarcodeDetector: ${hasBarcodeDetector ? "yes" : "no (using zxing)"}`);

        if (hasBarcodeDetector) {
          // ── Chrome / Edge / Android: detect directly from video element ──
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_128", "code_39", "code_93"],
          });
          scanInterval = setInterval(async () => {
            if (stopped) return;
            const v = videoRef.current;
            if (!v || v.readyState < 2 || v.videoWidth === 0) return;
            try {
              const barcodes = await detector.detect(v);
              if (barcodes.length > 0 && !stopped) {
                setDebugInfo(`Detected: ${barcodes[0].rawValue}`);
                handleDetected(barcodes[0].rawValue as string);
              }
            } catch { /* no barcode in frame — normal */ }
          }, 300);

        } else {
          // ── Firefox / Safari: use @zxing/browser decodeFromStream ──
          zxingReader = new BrowserMultiFormatReader();
          setDebugInfo("Camera ready. Using zxing decoder — scanning…");

          // decodeFromStream attaches the stream to the video and scans continuously
          zxingReader.decodeFromStream(stream, video, (result, err) => {
            if (stopped) return;
            if (result) {
              setDebugInfo(`Detected: ${result.getText()}`);
              handleDetected(result.getText());
            } else if (err && !(err.name === "NotFoundException")) {
              setDebugInfo(`Scan error: ${err.name}`);
            }
          });
        }

      } catch (err: unknown) {
        if (stopped) return;
        setIsLoading(false);
        const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
        setDebugInfo(`Error: ${msg}`);
        if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
          setError("permission");
        } else if (msg.includes("notfound") || msg.includes("no camera") || msg.includes("devicenotfound")) {
          setError("nocamera");
        } else {
          setError("generic");
        }
      }
    }

    startCamera();

    return () => {
      stopped = true;
      if (scanInterval) clearInterval(scanInterval);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (zxingReader) { try { zxingReader.reset(); } catch (_) {} }
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualInput.trim();
    if (!query) return;
    setManualInput("");
    setNameMatches([]);

    // 1. Try exact barcode lookup first
    try {
      const product = await getProductByBarcode(query);
      if (product) {
        onAddProduct(product);
        setStatus({ type: "found", name: product.name });
        cooldownRef.current = setTimeout(() => setStatus({ type: "idle" }), 2500);
        return;
      }
    } catch { /* not a barcode — fall through to name search */ }

    // 2. Search products by name
    setStatus({ type: "looking", barcode: query });
    try {
      const all = await listProducts();
      const matches = all.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      if (matches.length === 1) {
        // Single match — add immediately
        onAddProduct(matches[0]);
        setStatus({ type: "found", name: matches[0].name });
        cooldownRef.current = setTimeout(() => setStatus({ type: "idle" }), 2500);
      } else if (matches.length > 1) {
        // Multiple matches — show a pick list
        setNameMatches(matches);
        setStatus({ type: "idle" });
      } else {
        setStatus({ type: "notfound" });
        cooldownRef.current = setTimeout(() => setStatus({ type: "idle" }), 2500);
      }
    } catch {
      setStatus({ type: "notfound" });
      cooldownRef.current = setTimeout(() => setStatus({ type: "idle" }), 2500);
    }
  };

  const handlePickProduct = (product: Product) => {
    onAddProduct(product);
    setNameMatches([]);
    setStatus({ type: "found", name: product.name });
    cooldownRef.current = setTimeout(() => setStatus({ type: "idle" }), 2500);
  };

  const handleClose = () => {
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    onOpenChange(false);
  };

  if (error === "iframe") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Camera Barcode Scanner</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <CameraOff className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-sm">Camera blocked by preview pane</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Replit preview blocks camera access. Open the app in its own tab — the scanner will work there.
            </p>
            <Button className="gap-2 w-full" onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}>
              <ExternalLink className="h-4 w-4" /> Open App in New Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error === "permission") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Camera Barcode Scanner</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <CameraOff className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-sm">Camera permission denied</p>
            <p className="text-xs text-muted-foreground">Click the camera icon in your browser address bar → Allow → reopen scanner.</p>
            <Button variant="secondary" onClick={handleClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error === "nocamera" || error === "generic") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Camera Barcode Scanner</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <CameraOff className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-sm">No camera found</p>
            <p className="text-xs text-muted-foreground">No camera detected. Use the Barcode ID field on the billing page to enter manually.</p>
            <Button variant="secondary" onClick={handleClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Camera Barcode Scanner</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Camera feed */}
          <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <p className="text-white text-sm">Starting camera…</p>
              </div>
            )}
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

            {/* Corner frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br" />
                {status.type === "idle" && <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary/60 animate-bounce" />}
                {status.type === "found" && <div className="absolute inset-0 bg-green-500/25 rounded" />}
                {status.type === "notfound" && <div className="absolute inset-0 bg-red-500/25 rounded" />}
              </div>
            </div>
          </div>

          {/* Debug info */}
          {debugInfo && (
            <p className="text-xs text-muted-foreground text-center font-mono bg-muted/40 rounded px-2 py-1">{debugInfo}</p>
          )}

          {/* Status */}
          {status.type === "idle" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ScanLine className="h-4 w-4 animate-pulse text-primary" />
              Hold barcode steady inside the frame — scanning every 300ms
            </div>
          )}
          {status.type === "looking" && (
            <div className="flex items-center gap-2 text-xs justify-center text-muted-foreground animate-pulse">
              <ScanLine className="h-4 w-4 text-primary" />
              Looking up: <span className="font-mono font-semibold text-foreground">{status.barcode}</span>
            </div>
          )}
          {status.type === "found" && (
            <div className="flex items-center gap-2 text-xs justify-center py-1 px-3 bg-green-50 text-green-700 rounded-md">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Added to bill: <strong>{status.name}</strong>
            </div>
          )}
          {status.type === "notfound" && (
            <div className="flex items-center gap-2 text-xs justify-center py-1 px-3 bg-destructive/10 text-destructive rounded-md">
              <XCircle className="h-4 w-4 shrink-0" />
              Product not found in database — keep scanning
            </div>
          )}

          {/* Name matches pick list */}
          {nameMatches.length > 1 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1.5 bg-muted/40 border-b border-border">
                Multiple matches — tap to add:
              </p>
              {nameMatches.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePickProduct(p)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 border-b border-border/40 last:border-0 text-left transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.barcode && <p className="text-xs text-muted-foreground font-mono">{p.barcode}</p>}
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0 ml-3">₹{p.sellingPrice.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}

          {/* Search by name or barcode */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Type product name or barcode + Enter"
              className="text-sm"
              autoComplete="off"
            />
            <Button type="submit" variant="outline" size="sm" className="shrink-0">Search</Button>
          </form>

          <Button variant="secondary" onClick={handleClose} className="w-full">
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
