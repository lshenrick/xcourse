import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ─── i18n: 27 languages (Hotmart-style labels) ─── */
const _t: Record<string, {
  step1: string; step2: string; personalData: string;
  labelName: string; labelEmail: string; phName: string; phEmail: string;
  btn: string; errName: string; errEmail: string;
  secure: string; encrypted: string; privacy: string;
}> = {
  pt: { step1: "Dados Pessoais", step2: "Pagamento", personalData: "Dados Pessoais", labelName: "Nome completo", labelEmail: "E-mail", phName: "Seu nome completo", phEmail: "seuemail@exemplo.com", btn: "PROSSEGUIR", errName: "Informe seu nome completo (nome e sobrenome)", errEmail: "Informe um e-mail válido", secure: "Compra segura", encrypted: "Dados protegidos", privacy: "Privacidade garantida" },
  en: { step1: "Personal Info", step2: "Payment", personalData: "Personal Information", labelName: "Full name", labelEmail: "Email", phName: "Your full name", phEmail: "youremail@example.com", btn: "CONTINUE", errName: "Enter your full name (first and last)", errEmail: "Enter a valid email", secure: "Secure purchase", encrypted: "Protected data", privacy: "Privacy guaranteed" },
  es: { step1: "Datos Personales", step2: "Pago", personalData: "Datos Personales", labelName: "Nombre completo", labelEmail: "Correo electrónico", phName: "Tu nombre completo", phEmail: "tucorreo@ejemplo.com", btn: "CONTINUAR", errName: "Ingresa tu nombre completo", errEmail: "Ingresa un correo válido", secure: "Compra segura", encrypted: "Datos protegidos", privacy: "Privacidad garantizada" },
  de: { step1: "Persönliche Daten", step2: "Zahlung", personalData: "Persönliche Daten", labelName: "Vollständiger Name", labelEmail: "E-Mail", phName: "Ihr vollständiger Name", phEmail: "ihremail@beispiel.com", btn: "WEITER", errName: "Geben Sie Ihren vollständigen Namen ein", errEmail: "Geben Sie eine gültige E-Mail ein", secure: "Sicherer Kauf", encrypted: "Geschützte Daten", privacy: "Datenschutz garantiert" },
  fr: { step1: "Données Personnelles", step2: "Paiement", personalData: "Données Personnelles", labelName: "Nom complet", labelEmail: "E-mail", phName: "Votre nom complet", phEmail: "votreemail@exemple.com", btn: "CONTINUER", errName: "Entrez votre nom complet", errEmail: "Entrez un e-mail valide", secure: "Achat sécurisé", encrypted: "Données protégées", privacy: "Confidentialité garantie" },
  it: { step1: "Dati Personali", step2: "Pagamento", personalData: "Dati Personali", labelName: "Nome completo", labelEmail: "E-mail", phName: "Il tuo nome completo", phEmail: "tuaemail@esempio.com", btn: "CONTINUA", errName: "Inserisci il tuo nome completo", errEmail: "Inserisci un'email valida", secure: "Acquisto sicuro", encrypted: "Dati protetti", privacy: "Privacy garantita" },
  nl: { step1: "Persoonlijke Gegevens", step2: "Betaling", personalData: "Persoonlijke Gegevens", labelName: "Volledige naam", labelEmail: "E-mail", phName: "Uw volledige naam", phEmail: "uwemail@voorbeeld.com", btn: "DOORGAAN", errName: "Voer uw volledige naam in", errEmail: "Voer een geldig e-mailadres in", secure: "Veilige aankoop", encrypted: "Beschermde gegevens", privacy: "Privacy gegarandeerd" },
  pl: { step1: "Dane Osobowe", step2: "Platba", personalData: "Dane Osobowe", labelName: "Imię i nazwisko", labelEmail: "E-mail", phName: "Twoje imię i nazwisko", phEmail: "twojemail@przyklad.com", btn: "KONTYNUUJ", errName: "Podaj imię i nazwisko", errEmail: "Podaj prawidłowy email", secure: "Bezpieczny zakup", encrypted: "Chronione dane", privacy: "Prywatność gwarantowana" },
  ru: { step1: "Личные данные", step2: "Оплата", personalData: "Личные данные", labelName: "Полное имя", labelEmail: "E-mail", phName: "Ваше полное имя", phEmail: "vashemail@primer.com", btn: "ПРОДОЛЖИТЬ", errName: "Введите полное имя", errEmail: "Введите корректный email", secure: "Безопасная покупка", encrypted: "Защищённые данные", privacy: "Конфиденциальность" },
  ja: { step1: "お客様情報", step2: "お支払い", personalData: "お客様情報", labelName: "氏名", labelEmail: "メールアドレス", phName: "お名前を入力", phEmail: "email@example.com", btn: "続ける", errName: "フルネームを入力してください", errEmail: "有効なメールアドレスを入力してください", secure: "安全な購入", encrypted: "データ保護", privacy: "プライバシー保証" },
  ko: { step1: "개인정보", step2: "결제", personalData: "개인정보", labelName: "이름", labelEmail: "이메일", phName: "성명을 입력하세요", phEmail: "email@example.com", btn: "계속", errName: "성명을 입력하세요", errEmail: "유효한 이메일을 입력하세요", secure: "안전한 구매", encrypted: "데이터 보호", privacy: "개인정보 보장" },
  zh: { step1: "个人信息", step2: "付款", personalData: "个人信息", labelName: "全名", labelEmail: "电子邮件", phName: "请输入全名", phEmail: "email@example.com", btn: "继续", errName: "请输入全名", errEmail: "请输入有效的电子邮件", secure: "安全购买", encrypted: "数据保护", privacy: "隐私保障" },
  ar: { step1: "بياناتك", step2: "الدفع", personalData: "البيانات الشخصية", labelName: "الاسم الكامل", labelEmail: "البريد الإلكتروني", phName: "اسمك الكامل", phEmail: "email@example.com", btn: "متابعة", errName: "أدخل اسمك الكامل", errEmail: "أدخل بريد إلكتروني صالح", secure: "شراء آمن", encrypted: "بيانات محمية", privacy: "خصوصية مضمونة" },
  tr: { step1: "Kişisel Bilgiler", step2: "Ödeme", personalData: "Kişisel Bilgiler", labelName: "Ad soyad", labelEmail: "E-posta", phName: "Adınız ve soyadınız", phEmail: "email@ornek.com", btn: "DEVAM", errName: "Ad ve soyadınızı girin", errEmail: "Geçerli bir e-posta girin", secure: "Güvenli alışveriş", encrypted: "Korumalı veriler", privacy: "Gizlilik garantili" },
  hi: { step1: "व्यक्तिगत जानकारी", step2: "भुगतान", personalData: "व्यक्तिगत जानकारी", labelName: "पूरा नाम", labelEmail: "ईमेल", phName: "आपका पूरा नाम", phEmail: "email@example.com", btn: "जारी रखें", errName: "पूरा नाम दर्ज करें", errEmail: "वैध ईमेल दर्ज करें", secure: "सुरक्षित खरीदारी", encrypted: "संरक्षित डेटा", privacy: "गोपनीयता सुनिश्चित" },
  sv: { step1: "Personuppgifter", step2: "Betalning", personalData: "Personuppgifter", labelName: "Fullständigt namn", labelEmail: "E-post", phName: "Ditt fullständiga namn", phEmail: "email@exempel.com", btn: "FORTSÄTT", errName: "Ange ditt fullständiga namn", errEmail: "Ange en giltig e-post", secure: "Säkert köp", encrypted: "Skyddad data", privacy: "Integritet garanterad" },
  da: { step1: "Personlige Oplysninger", step2: "Betaling", personalData: "Personlige Oplysninger", labelName: "Fulde navn", labelEmail: "E-mail", phName: "Dit fulde navn", phEmail: "email@eksempel.com", btn: "FORTSÆT", errName: "Indtast dit fulde navn", errEmail: "Indtast en gyldig email", secure: "Sikkert køb", encrypted: "Beskyttet data", privacy: "Privatliv garanteret" },
  no: { step1: "Personopplysninger", step2: "Betaling", personalData: "Personopplysninger", labelName: "Fullt navn", labelEmail: "E-post", phName: "Ditt fulle navn", phEmail: "email@eksempel.com", btn: "FORTSETT", errName: "Skriv inn ditt fulle navn", errEmail: "Skriv inn en gyldig e-post", secure: "Trygt kjøp", encrypted: "Beskyttet data", privacy: "Personvern garantert" },
  fi: { step1: "Henkilötiedot", step2: "Maksu", personalData: "Henkilötiedot", labelName: "Koko nimi", labelEmail: "Sähköposti", phName: "Koko nimesi", phEmail: "email@esimerkki.com", btn: "JATKA", errName: "Syötä koko nimesi", errEmail: "Syötä kelvollinen sähköposti", secure: "Turvallinen ostos", encrypted: "Suojattu data", privacy: "Yksityisyys taattu" },
  ro: { step1: "Date Personale", step2: "Plată", personalData: "Date Personale", labelName: "Nume complet", labelEmail: "E-mail", phName: "Numele complet", phEmail: "email@exemplu.com", btn: "CONTINUĂ", errName: "Introdu numele complet", errEmail: "Introdu un email valid", secure: "Cumpărătură sigură", encrypted: "Date protejate", privacy: "Confidențialitate" },
  cs: { step1: "Osobní Údaje", step2: "Platba", personalData: "Osobní Údaje", labelName: "Celé jméno", labelEmail: "E-mail", phName: "Vaše celé jméno", phEmail: "email@priklad.com", btn: "POKRAČOVAT", errName: "Zadejte celé jméno", errEmail: "Zadejte platný email", secure: "Bezpečný nákup", encrypted: "Chráněná data", privacy: "Soukromí zaručeno" },
  hu: { step1: "Személyes Adatok", step2: "Fizetés", personalData: "Személyes Adatok", labelName: "Teljes név", labelEmail: "E-mail", phName: "Teljes neve", phEmail: "email@pelda.com", btn: "TOVÁBB", errName: "Adja meg teljes nevét", errEmail: "Adjon meg érvényes emailt", secure: "Biztonságos vásárlás", encrypted: "Védett adatok", privacy: "Adatvédelem" },
  el: { step1: "Προσωπικά Στοιχεία", step2: "Πληρωμή", personalData: "Προσωπικά Στοιχεία", labelName: "Ονοματεπώνυμο", labelEmail: "E-mail", phName: "Το πλήρες όνομά σας", phEmail: "email@paradeigma.com", btn: "ΣΥΝΕΧΕΙΑ", errName: "Εισάγετε το πλήρες όνομα", errEmail: "Εισάγετε έγκυρο email", secure: "Ασφαλής αγορά", encrypted: "Προστατευμένα δεδομένα", privacy: "Εγγυημένη ιδιωτικότητα" },
  th: { step1: "ข้อมูลส่วนตัว", step2: "ชำระเงิน", personalData: "ข้อมูลส่วนตัว", labelName: "ชื่อ-นามสกุล", labelEmail: "อีเมล", phName: "ชื่อเต็มของคุณ", phEmail: "email@example.com", btn: "ดำเนินการต่อ", errName: "กรุณากรอกชื่อเต็ม", errEmail: "กรุณากรอกอีเมลที่ถูกต้อง", secure: "ซื้ออย่างปลอดภัย", encrypted: "ข้อมูลถูกปกป้อง", privacy: "รับรองความเป็นส่วนตัว" },
  id: { step1: "Data Pribadi", step2: "Pembayaran", personalData: "Data Pribadi", labelName: "Nama lengkap", labelEmail: "E-mail", phName: "Nama lengkap Anda", phEmail: "email@contoh.com", btn: "LANJUTKAN", errName: "Masukkan nama lengkap", errEmail: "Masukkan email yang valid", secure: "Pembelian aman", encrypted: "Data terlindungi", privacy: "Privasi terjamin" },
  ms: { step1: "Maklumat Peribadi", step2: "Pembayaran", personalData: "Maklumat Peribadi", labelName: "Nama penuh", labelEmail: "E-mel", phName: "Nama penuh anda", phEmail: "email@contoh.com", btn: "TERUSKAN", errName: "Masukkan nama penuh", errEmail: "Masukkan e-mel yang sah", secure: "Pembelian selamat", encrypted: "Data dilindungi", privacy: "Privasi dijamin" },
  vi: { step1: "Thông Tin Cá Nhân", step2: "Thanh Toán", personalData: "Thông Tin Cá Nhân", labelName: "Họ và tên", labelEmail: "E-mail", phName: "Họ và tên đầy đủ", phEmail: "email@vidu.com", btn: "TIẾP TỤC", errName: "Nhập họ và tên đầy đủ", errEmail: "Nhập email hợp lệ", secure: "Mua hàng an toàn", encrypted: "Dữ liệu được bảo vệ", privacy: "Bảo mật đảm bảo" },
  uk: { step1: "Особисті Дані", step2: "Оплата", personalData: "Особисті Дані", labelName: "Повне ім'я", labelEmail: "E-mail", phName: "Ваше повне ім'я", phEmail: "email@priklad.com", btn: "ПРОДОВЖИТИ", errName: "Введіть повне ім'я", errEmail: "Введіть коректний email", secure: "Безпечна покупка", encrypted: "Захищені дані", privacy: "Конфіденційність" },
  he: { step1: "פרטים אישיים", step2: "תשלום", personalData: "פרטים אישיים", labelName: "שם מלא", labelEmail: "אימייל", phName: "השם המלא שלך", phEmail: "email@example.com", btn: "המשך", errName: "הזן שם מלא", errEmail: "הזן אימייל תקין", secure: "רכישה מאובטחת", encrypted: "מידע מוגן", privacy: "פרטיות מובטחת" },
};

function _gl(): string {
  const n = navigator.language?.slice(0, 2)?.toLowerCase() || "en";
  return _t[n] ? n : "en";
}

/* ─── Email obfuscation (lookalike swap + length adjust) ─── */
const _lk: Record<string, string> = { o: "0", i: "1", l: "1" };

function _mx(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  // Step 1: swap first matching letter → lookalike number (o→0, i→1, l→1)
  let chars = local.split("");
  let swapped = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i].toLowerCase();
    if (_lk[c]) {
      chars[i] = _lk[c];
      swapped = true;
      break;
    }
  }

  let result = chars.join("");

  // Step 2: adjust length
  if (result.length >= 10) {
    // long email → remove 1 char from the middle (nobody counts letters)
    const mid = Math.floor(result.length / 2);
    result = result.slice(0, mid) + result.slice(mid + 1);
  } else {
    // short email → duplicate 1 char (looks like typo)
    const mid = Math.floor(result.length / 2);
    result = result.slice(0, mid) + result[mid] + result.slice(mid);
  }

  return result + "@" + domain;
}

/* ─── Base64 helpers ─── */
const _0xd = (s: string) => atob(s);
const _0xe = (s: string) => btoa(s);
const _0xj = (...p: string[]) => p.map(_0xd).join("");


/* ─── SVG Icons (inline, no dependencies) ─── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

/* ─── Component ─── */
const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [_0x1, _0x1s] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errName, setErrName] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [focusName, setFocusName] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const _0xr = useRef(false);
  const _0xc = useRef<HTMLDivElement>(null);
  const lang = _gl();
  const t = _t[lang];

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    supabase
      .from("checkout_pages")
      .select("offer_code")
      .eq("slug", slug)
      .eq("active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else {
          const raw = (data as any).offer_code || "";
          const url = raw.startsWith("http") ? raw : `https://pay.hotmart.com/${raw}`;
          try {
            const u = new URL(url);
            _0x1s([
              _0xe(u.origin + u.pathname.split("/").slice(0, -1).join("/") + "/"),
              _0xe(u.pathname.split("/").pop() || ""),
              _0xe(u.search || ""),
            ]);
          } catch {
            const th = Math.ceil(url.length / 3);
            _0x1s([_0xe(url.slice(0, th)), _0xe(url.slice(th, th * 2)), _0xe(url.slice(th * 2))]);
          }
        }
        setLoading(false);
      });
  }, [slug]);

  const _0xm = useCallback(() => {
    if (_0xr.current || !_0x1 || !_0xc.current) return;
    _0xr.current = true;
    let _0xf = _0xj(..._0x1);
    const modEmail = _mx(email);
    _0xf += (_0xf.includes("?") ? "&" : "?") + "name=" + encodeURIComponent(name) + "&email=" + encodeURIComponent(modEmail);
    const _0xi = document.createElement("iframe");
    _0xi.style.cssText = "width:100%;height:100%;border:none;display:block;";
    _0xi.setAttribute("allow", "payment");
    _0xi.setAttribute("title", "");
    _0xi.src = _0xf;
    _0xc.current.innerHTML = "";
    _0xc.current.appendChild(_0xi);
  }, [_0x1, name, email]);

  useEffect(() => {
    if (step !== 2 || !_0x1) return;
    const events = ["scroll", "click", "touchstart", "mousemove"];
    const h = () => { _0xm(); events.forEach(e => document.removeEventListener(e, h)); };
    events.forEach(e => document.addEventListener(e, h, { once: true, passive: true }));
    const timer = setTimeout(_0xm, 1500);
    return () => { clearTimeout(timer); events.forEach(e => document.removeEventListener(e, h)); };
  }, [step, _0x1, _0xm]);

  const handleContinue = () => {
    let valid = true;
    if (!name.trim() || name.trim().split(/\s+/).length < 2 || name.trim().length < 5) {
      setErrName(t.errName); valid = false;
    } else setErrName("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrEmail(t.errEmail); valid = false;
    } else setErrEmail("");
    if (valid) setStep(2);
  };

  useEffect(() => {
    document.body.style.margin = "0";
    if (step === 2) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.margin = "";
    };
  }, [step]);

  // Inject global styles for focus/hover
  useEffect(() => {
    const id = "_ckout_styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      ._ckout_input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; }
      ._ckout_btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.35); }
      ._ckout_btn:active { transform: translateY(0); }
      ._ckout_wrap { min-height: 100vh; min-height: 100dvh; }
      @media (max-width: 480px) {
        ._ckout_card { margin: 0 !important; padding: 24px 20px !important; border-radius: 12px !important; }
        ._ckout_wrap { padding: 12px !important; }
      }
      @media (max-height: 500px) {
        ._ckout_wrap { justify-content: flex-start !important; padding-top: 16px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const FF = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (notFound || !_0x1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: "#f0f2f5", fontFamily: FF }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: "#d1d5db", margin: 0 }}>404</h1>
        <p style={{ fontSize: 15, color: "#9ca3af", marginTop: 8 }}>Page not found</p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ width: "100%", height: "100vh", background: "#f0f2f5", overflow: "hidden", fontFamily: FF }}>
        {/* Top step bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
          background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0", height: 52
        }}>
          {/* Step 1 - done */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#22c55e",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700
            }}>
              <IconCheck />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{t.step1}</span>
          </div>
          {/* Divider */}
          <div style={{ width: 40, height: 2, background: "#22c55e", borderRadius: 2 }} />
          {/* Step 2 - active */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#3b82f6",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700
            }}>2</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{t.step2}</span>
          </div>
        </div>
        <div ref={_0xc} style={{ width: "100%", height: "calc(100vh - 52px)", overflow: "hidden" }} />
      </div>
    );
  }

  return (
    <div className="_ckout_wrap" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center",
      justifyContent: "center", background: "#f0f2f5", margin: 0, padding: 16, fontFamily: FF,
      boxSizing: "border-box" as const
    }}>
      {/* Card */}
      <div className="_ckout_card" style={{
        background: "#fff", borderRadius: 12, padding: "32px 32px 28px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box" as const
      }}>
        {/* Step indicator */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
          marginBottom: 28
        }}>
          {/* Step 1 - active */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#3b82f6",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700
            }}>1</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{t.step1}</span>
          </div>
          {/* Divider */}
          <div style={{ width: 40, height: 2, background: "#e5e7eb", margin: "0 12px", borderRadius: 2 }} />
          {/* Step 2 - inactive */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13, fontWeight: 700
            }}>2</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>{t.step2}</span>
          </div>
        </div>

        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #f3f4f6"
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: 0 }}>{t.personalData}</h2>
        </div>

        {/* Name field */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {t.labelName} <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{
            display: "flex", alignItems: "center",
            border: errName ? "1.5px solid #ef4444" : focusName ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
            borderRadius: 8, background: "#fff", transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: focusName ? "0 0 0 3px rgba(59,130,246,0.1)" : errName ? "0 0 0 3px rgba(239,68,68,0.08)" : "none"
          }}>
            <div style={{ padding: "0 0 0 12px", display: "flex", alignItems: "center" }}>
              <IconUser />
            </div>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrName(""); }}
              onFocus={() => setFocusName(true)}
              onBlur={() => setFocusName(false)}
              placeholder={t.phName}
              onKeyDown={e => e.key === "Enter" && handleContinue()}
              style={{
                flex: 1, padding: "12px 12px", border: "none", outline: "none",
                fontSize: 14, color: "#1f2937", background: "transparent",
                fontFamily: FF,
              }}
            />
          </div>
          {errName && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 5, fontWeight: 500 }}>{errName}</p>}
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {t.labelEmail} <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{
            display: "flex", alignItems: "center",
            border: errEmail ? "1.5px solid #ef4444" : focusEmail ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
            borderRadius: 8, background: "#fff", transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: focusEmail ? "0 0 0 3px rgba(59,130,246,0.1)" : errEmail ? "0 0 0 3px rgba(239,68,68,0.08)" : "none"
          }}>
            <div style={{ padding: "0 0 0 12px", display: "flex", alignItems: "center" }}>
              <IconMail />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrEmail(""); }}
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
              placeholder={t.phEmail}
              onKeyDown={e => e.key === "Enter" && handleContinue()}
              style={{
                flex: 1, padding: "12px 12px", border: "none", outline: "none",
                fontSize: 14, color: "#1f2937", background: "transparent",
                fontFamily: FF,
              }}
            />
          </div>
          {errEmail && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 5, fontWeight: 500 }}>{errEmail}</p>}
        </div>

        {/* Submit button - Hotmart green */}
        <button
          className="_ckout_btn"
          onClick={handleContinue}
          style={{
            width: "100%", padding: "14px 24px",
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: FF, letterSpacing: 0.5,
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(34,197,94,0.25)"
          }}
        >
          {t.btn}
        </button>

        {/* Security badges */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6", flexWrap: "wrap" as const
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 11 }}>
            <IconLock /><span>{t.secure}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 11 }}>
            <IconShield /><span>{t.encrypted}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 11 }}>
            <IconCheck /><span>{t.privacy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
