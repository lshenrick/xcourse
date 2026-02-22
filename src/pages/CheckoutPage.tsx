import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Obfuscation helpers
const _0xd = (s: string) => atob(s);
const _0xe = (s: string) => btoa(s);
const _0xj = (...parts: string[]) => parts.map(_0xd).join("");

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [_0x1, _0x1s] = useState<string[] | null>(null); // encoded parts
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const _0xr = useRef<boolean>(false); // iframe mounted
  const _0xc = useRef<HTMLDivElement>(null); // container ref

  // Fetch checkout data and encode it
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
          const raw = (data as any).offer_code || "";
          const fullUrl = raw.startsWith("http") ? raw : `https://pay.hotmart.com/${raw}`;

          // Split URL into 3 parts and encode each in Base64
          try {
            const urlObj = new URL(fullUrl);
            const _p1 = _0xe(urlObj.origin + urlObj.pathname.split("/").slice(0, -1).join("/") + "/");
            const _p2 = _0xe(urlObj.pathname.split("/").pop() || "");
            const _p3 = _0xe(urlObj.search || "");
            _0x1s([_p1, _p2, _p3]);
          } catch {
            // Fallback: encode as single chunk split into 3
            const third = Math.ceil(fullUrl.length / 3);
            _0x1s([
              _0xe(fullUrl.slice(0, third)),
              _0xe(fullUrl.slice(third, third * 2)),
              _0xe(fullUrl.slice(third * 2)),
            ]);
          }
        }
        setLoading(false);
      });
  }, [slug]);

  // Mount iframe dynamically on user interaction or fallback timer
  const _0xm = useCallback(() => {
    if (_0xr.current || !_0x1 || !_0xc.current) return;
    _0xr.current = true;

    // Reconstruct URL from encoded parts
    let _0xf = _0xj(..._0x1);

    // Append email param if present in URL
    const _0xeml = searchParams.get("email");
    if (_0xeml) {
      _0xf += (_0xf.includes("?") ? "&" : "?") + "email=" + encodeURIComponent(_0xeml);
    }

    // Create iframe dynamically (not in HTML source)
    const _0xi = document.createElement("iframe");
    _0xi.style.cssText = "width:100%;height:100vh;border:none;display:block;";
    _0xi.setAttribute("allow", "payment");
    _0xi.setAttribute("title", "");
    _0xi.src = _0xf;

    _0xc.current.appendChild(_0xi);
  }, [_0x1, searchParams]);

  // Set up interaction listeners + fallback timer
  useEffect(() => {
    if (!_0x1) return;

    const _0xev = ["scroll", "click", "touchstart", "mousemove"];
    const _0xh = () => {
      _0xm();
      _0xev.forEach(e => document.removeEventListener(e, _0xh));
    };

    _0xev.forEach(e => document.addEventListener(e, _0xh, { once: true, passive: true }));

    // Fallback: load after 1.5s if no interaction
    const _0xt = setTimeout(_0xm, 1500);

    return () => {
      clearTimeout(_0xt);
      _0xev.forEach(e => document.removeEventListener(e, _0xh));
    };
  }, [_0x1, _0xm]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (notFound || !_0x1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: "#ddd", margin: 0 }}>404</h1>
          <p style={{ color: "#999", marginTop: 8 }}>Página não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={_0xc}
      style={{
        margin: 0,
        padding: 0,
        background: "#f5f5f5",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
};

export default CheckoutPage;
