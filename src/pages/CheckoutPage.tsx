import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  // Build the iframe src — accept full URL or just the code
  const iframeSrc = page.offer_code.startsWith("http")
    ? page.offer_code
    : `https://pay.hotmart.com/${page.offer_code}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Title (optional, only if has title/description) */}
      {(page.title || page.description) && (
        <div className="text-center px-4 pt-6 pb-2">
          {page.title && (
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1">
              {page.title}
            </h1>
          )}
          {page.description && (
            <p className="text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
              {page.description}
            </p>
          )}
        </div>
      )}

      {/* Hotmart Checkout Iframe */}
      <iframe
        src={iframeSrc}
        style={{ width: "100%", flex: 1, border: "none", minHeight: "80vh" }}
        title={page.title || "Checkout"}
        allow="payment"
      />
    </div>
  );
};

export default CheckoutPage;
