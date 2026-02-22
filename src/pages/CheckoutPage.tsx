import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
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
      .select("offer_code")
      .eq("slug", slug)
      .eq("active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          const code = (data as any).offer_code || "";
          setIframeSrc(code.startsWith("http") ? code : `https://pay.hotmart.com/${code}`);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (notFound || !iframeSrc) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: "#ddd", margin: 0 }}>404</h1>
          <p style={{ color: "#999", marginTop: 8 }}>Página não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={iframeSrc}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Checkout"
      allow="payment"
    />
  );
};

export default CheckoutPage;
