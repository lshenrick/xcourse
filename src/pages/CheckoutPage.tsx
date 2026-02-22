import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    checkoutElements: {
      init: (mode: string, options: { offer: string }) => {
        mount: (selector: string) => void;
      };
    };
  }
}

interface CheckoutPageData {
  id: string;
  slug: string;
  title: string;
  offer_code: string;
  description: string | null;
  custom_css: string | null;
}

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CheckoutPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Fetch checkout page data
  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    supabase
      .from("checkout_pages")
      .select("id, slug, title, offer_code, description, custom_css")
      .eq("slug", slug)
      .eq("active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPage(data as CheckoutPageData);
        }
        setLoading(false);
      });
  }, [slug]);

  // Load Hotmart Checkout Elements script
  useEffect(() => {
    if (!page) return;

    const existingScript = document.querySelector(
      'script[src="https://checkout.hotmart.com/lib/hotmart-checkout-elements.js"]'
    );
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.hotmart.com/lib/hotmart-checkout-elements.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.error("Failed to load Hotmart Checkout Elements");
    document.head.appendChild(script);
  }, [page]);

  // Mount the checkout once script is loaded
  useEffect(() => {
    if (!scriptLoaded || !page || !checkoutRef.current || mountedRef.current) return;
    if (!window.checkoutElements) return;

    try {
      mountedRef.current = true;
      const elements = window.checkoutElements.init("inlineCheckout", {
        offer: page.offer_code,
      });
      elements.mount("#hotmart_inline_checkout");
    } catch (err) {
      console.error("Failed to mount Hotmart checkout:", err);
    }
  }, [scriptLoaded, page]);

  // Inject custom CSS if provided
  useEffect(() => {
    if (!page?.custom_css) return;
    const style = document.createElement("style");
    style.textContent = page.custom_css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [page?.custom_css]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-zinc-200">404</h1>
          <p className="text-zinc-500">Página não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
              {page.description}
            </p>
          )}
        </div>

        {/* Hotmart Checkout Container */}
        <div
          id="hotmart_inline_checkout"
          ref={checkoutRef}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
