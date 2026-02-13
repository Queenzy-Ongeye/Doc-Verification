import { useState } from "react";
import { Shield, Loader2, FileCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { useToast } from "../components/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const PRODUCTS = [
  { value: "doc_verification", label: "Document Verification", description: "Standard ID document verification" },
  { value: "enhanced_document_verification", label: "Enhanced Document Verification", description: "Advanced verification with additional checks" },
] as const;

async function getWebToken(product: string) {
  const url = new URL(`${API_BASE_URL}/api/v1/token`);
  url.searchParams.set("product", product);

  const res = await fetch(url.toString());
  const raw = await res.text();

  if (!res.ok) {
    throw new Error(raw);
  }

  return JSON.parse(raw);
}

declare global {
  interface Window {
    SmileIdentity?: (config: {
      token: string;
      product: string;
      callback_url: string;
      environment: string;
      partner_details: {
        partner_id: string;
        name: string;
        logo_url: string;
        policy_url: string;
        theme_color: string;
      };
      onSuccess: () => void;
      onClose: () => void;
      onError: (e: Error) => void;
    }) => void;
  }
}

export function Index() {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<string>(PRODUCTS[0].value);
  const { toast } = useToast();

  async function startVerification() {
    setLoading(true);
    try {
      const data = await getWebToken(product);

      if (!data.token) throw new Error("No token returned from backend");
      if (!data.callback_url) throw new Error("No callback_url returned from backend");
      if (!window.SmileIdentity) throw new Error("SmileIdentity SDK not loaded");

      window.SmileIdentity({
        token: data.token,
        product: data.product,
        callback_url: data.callback_url,
        environment: data.environment,
        partner_details: {
          partner_id: data.partner_id,
          name: "Your App Name",
          logo_url: "https://yourdomain.com/logo.png",
          policy_url: "https://yourdomain.com/privacy",
          theme_color: "#3B82F6",
        },
        onSuccess: () => {
          toast({
            title: "Verification Complete",
            description: "Your document has been successfully verified.",
          });
        },
        onClose: () => {
          toast({
            title: "Verification Cancelled",
            description: "You closed the verification window.",
            variant: "destructive",
          });
        },
        onError: (e) => {
          console.error("Smile error:", e);
          toast({
            title: "Verification Error",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Connection Error",
        description: e instanceof Error ? e.message : "Failed to start verification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-elevated p-8 w-full max-w-md animate-scale-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="gradient-bg p-3 rounded-xl">
          <FileCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Verification</h1>
          <p className="text-sm text-muted-foreground">Verify your ID document</p>
        </div>
      </div>

      {/* Product Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Verification Type</label>
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select verification type" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {PRODUCTS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          {PRODUCTS.find((p) => p.value === product)?.description}
        </p>
      </div>

      {/* Description */}
      <div className="mb-8 p-4 bg-secondary/30 rounded-lg border border-border/50">
        <p className="text-sm text-foreground">
          Upload and verify your government-issued ID document for a secure identity check.
        </p>
      </div>

      {/* Start Button */}
      <Button
        onClick={startVerification}
        disabled={loading}
        className="w-full h-14 text-base font-semibold gradient-bg hover:opacity-90 transition-all duration-200 shadow-glow disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Start Verification
          </span>
        )}
      </Button>

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground mt-6">
        Your data is encrypted and securely processed
      </p>
    </div>
  );
}

export default Index;