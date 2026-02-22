import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
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
          // Ensure it's a full URL with checkoutMode=2
          let url = code.startsWith("http") ? code : `https://pay.hotmart.com/${code}`;
          if (!url.includes("checkoutMode=")) {
            url += (url.includes("?") ? "&" : "?") + "checkoutMode=2";
          }
          setPaymentLink(url);
        }
        setLoading(false);
      });
  }, [slug]);

  // Load Hotmart widget script and CSS
  useEffect(() => {
    if (!paymentLink) return;

    // Load CSS
    if (!document.querySelector('link[href*="hotmart-fb.min.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "https://static.hotmart.com/css/hotmart-fb.min.css";
      document.head.appendChild(link);
    }

    // Load Script
    if (!document.querySelector('script[src*="widget.min.js"]')) {
      const script = document.createElement("script");
      script.src = "https://static.hotmart.com/checkout/widget.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [paymentLink]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (notFound || !paymentLink) {
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <a
        onClick={() => false}
        href={paymentLink}
        className="hotmart-fb hotmart__button-checkout"
      >
        <img src="https://static.hotmart.com/img/btn-buy-green.png" alt="Comprar" />
      </a>
    </div>
  );
};

export default CheckoutPage;
