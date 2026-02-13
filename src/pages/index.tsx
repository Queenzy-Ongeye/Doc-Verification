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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <div className="card-elevated p-8 w-full max-w-md animate-scale-in bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-green-500 p-3 rounded-xl shadow-lg">
            <FileCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Document Verification</h1>
            <p className="text-sm text-gray-600">Verify your ID document</p>
          </div>
        </div>

        {/* Product Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Verification Type</label>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors rounded-lg h-12 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
              <SelectValue placeholder="Select verification type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-blue-200 rounded-lg shadow-xl">
              {PRODUCTS.map((p) => (
                <SelectItem 
                  key={p.value} 
                  value={p.value}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 cursor-pointer py-3 rounded-md transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{p.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{p.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-500" />
            {PRODUCTS.find((p) => p.value === product)?.description}
          </p>
        </div>

        {/* Description */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-100">
          <p className="text-sm text-gray-700">
            Upload and verify your government-issued ID document for a secure identity check.
          </p>
        </div>

        {/* Start Button */}
        <Button
          onClick={startVerification}
          disabled={loading}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none rounded-lg"
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
        <p className="text-xs text-center text-gray-500 mt-6 flex items-center justify-center gap-1">
          <Shield className="h-3 w-3 text-green-500" />
          Your data is encrypted and securely processed
        </p>
      </div>
    </div>
  );
}

export default Index;