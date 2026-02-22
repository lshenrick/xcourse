import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ─── i18n: 27 languages ─── */
const _t: Record<string, {
  step1: string; step2: string; title: string; subtitle: string;
  labelName: string; labelEmail: string; phName: string; phEmail: string;
  btn: string; errName: string; errEmail: string;
}> = {
  pt: { step1: "Seus dados", step2: "Pagamento", title: "Finalize sua compra", subtitle: "Preencha seus dados para continuar", labelName: "Nome completo", labelEmail: "Seu melhor email", phName: "Ex: João Silva", phEmail: "Ex: joao@email.com", btn: "CONTINUAR", errName: "Informe seu nome completo (nome e sobrenome)", errEmail: "Informe um email válido" },
  en: { step1: "Your info", step2: "Payment", title: "Complete your purchase", subtitle: "Fill in your details to continue", labelName: "Full name", labelEmail: "Your best email", phName: "Ex: John Smith", phEmail: "Ex: john@email.com", btn: "CONTINUE", errName: "Enter your full name (first and last)", errEmail: "Enter a valid email" },
  es: { step1: "Tus datos", step2: "Pago", title: "Completa tu compra", subtitle: "Rellena tus datos para continuar", labelName: "Nombre completo", labelEmail: "Tu mejor email", phName: "Ej: Juan García", phEmail: "Ej: juan@email.com", btn: "CONTINUAR", errName: "Ingresa tu nombre completo", errEmail: "Ingresa un email válido" },
  de: { step1: "Deine Daten", step2: "Zahlung", title: "Kauf abschließen", subtitle: "Gib deine Daten ein um fortzufahren", labelName: "Vollständiger Name", labelEmail: "Deine beste E-Mail", phName: "z.B. Max Müller", phEmail: "z.B. max@email.com", btn: "WEITER", errName: "Gib deinen vollständigen Namen ein", errEmail: "Gib eine gültige E-Mail ein" },
  fr: { step1: "Vos infos", step2: "Paiement", title: "Finalisez votre achat", subtitle: "Remplissez vos données pour continuer", labelName: "Nom complet", labelEmail: "Votre meilleur email", phName: "Ex: Jean Dupont", phEmail: "Ex: jean@email.com", btn: "CONTINUER", errName: "Entrez votre nom complet", errEmail: "Entrez un email valide" },
  it: { step1: "I tuoi dati", step2: "Pagamento", title: "Completa il tuo acquisto", subtitle: "Compila i tuoi dati per continuare", labelName: "Nome completo", labelEmail: "La tua migliore email", phName: "Es: Marco Rossi", phEmail: "Es: marco@email.com", btn: "CONTINUA", errName: "Inserisci il tuo nome completo", errEmail: "Inserisci un'email valida" },
  nl: { step1: "Je gegevens", step2: "Betaling", title: "Voltooi je aankoop", subtitle: "Vul je gegevens in om door te gaan", labelName: "Volledige naam", labelEmail: "Je beste e-mail", phName: "Bv: Jan de Vries", phEmail: "Bv: jan@email.com", btn: "DOORGAAN", errName: "Voer je volledige naam in", errEmail: "Voer een geldig e-mailadres in" },
  pl: { step1: "Twoje dane", step2: "Płatność", title: "Dokończ zakup", subtitle: "Wypełnij dane aby kontynuować", labelName: "Imię i nazwisko", labelEmail: "Twój najlepszy email", phName: "Np: Jan Kowalski", phEmail: "Np: jan@email.com", btn: "KONTYNUUJ", errName: "Podaj imię i nazwisko", errEmail: "Podaj prawidłowy email" },
  ru: { step1: "Ваши данные", step2: "Оплата", title: "Завершите покупку", subtitle: "Заполните данные для продолжения", labelName: "Полное имя", labelEmail: "Ваш лучший email", phName: "Напр: Иван Иванов", phEmail: "Напр: ivan@email.com", btn: "ПРОДОЛЖИТЬ", errName: "Введите полное имя", errEmail: "Введите корректный email" },
  ja: { step1: "お客様情報", step2: "お支払い", title: "購入を完了する", subtitle: "続行するにはデータを入力してください", labelName: "氏名", labelEmail: "メールアドレス", phName: "例: 山田太郎", phEmail: "例: taro@email.com", btn: "続ける", errName: "フルネームを入力してください", errEmail: "有効なメールアドレスを入力してください" },
  ko: { step1: "정보 입력", step2: "결제", title: "구매를 완료하세요", subtitle: "계속하려면 정보를 입력하세요", labelName: "이름", labelEmail: "이메일", phName: "예: 홍길동", phEmail: "예: hong@email.com", btn: "계속", errName: "성명을 입력하세요", errEmail: "유효한 이메일을 입력하세요" },
  zh: { step1: "您的信息", step2: "付款", title: "完成购买", subtitle: "请填写您的信息以继续", labelName: "全名", labelEmail: "电子邮件", phName: "例: 张三", phEmail: "例: zhang@email.com", btn: "继续", errName: "请输入全名", errEmail: "请输入有效的电子邮件" },
  ar: { step1: "بياناتك", step2: "الدفع", title: "أكمل عملية الشراء", subtitle: "املأ بياناتك للمتابعة", labelName: "الاسم الكامل", labelEmail: "بريدك الإلكتروني", phName: "مثال: أحمد محمد", phEmail: "مثال: ahmed@email.com", btn: "متابعة", errName: "أدخل اسمك الكامل", errEmail: "أدخل بريد إلكتروني صالح" },
  tr: { step1: "Bilgileriniz", step2: "Ödeme", title: "Satın almayı tamamla", subtitle: "Devam etmek için bilgilerinizi girin", labelName: "Ad soyad", labelEmail: "E-posta adresiniz", phName: "Örn: Ahmet Yılmaz", phEmail: "Örn: ahmet@email.com", btn: "DEVAM", errName: "Ad ve soyadınızı girin", errEmail: "Geçerli bir e-posta girin" },
  hi: { step1: "आपकी जानकारी", step2: "भुगतान", title: "अपनी खरीदारी पूरी करें", subtitle: "जारी रखने के लिए अपना विवरण भरें", labelName: "पूरा नाम", labelEmail: "ईमेल", phName: "उदा: राहुल शर्मा", phEmail: "उदा: rahul@email.com", btn: "जारी रखें", errName: "पूरा नाम दर्ज करें", errEmail: "वैध ईमेल दर्ज करें" },
  sv: { step1: "Dina uppgifter", step2: "Betalning", title: "Slutför ditt köp", subtitle: "Fyll i dina uppgifter för att fortsätta", labelName: "Fullständigt namn", labelEmail: "Din bästa e-post", phName: "Ex: Erik Svensson", phEmail: "Ex: erik@email.com", btn: "FORTSÄTT", errName: "Ange ditt fullständiga namn", errEmail: "Ange en giltig e-postadress" },
  da: { step1: "Dine oplysninger", step2: "Betaling", title: "Gennemfør dit køb", subtitle: "Udfyld dine oplysninger for at fortsætte", labelName: "Fulde navn", labelEmail: "Din bedste email", phName: "Fx: Lars Jensen", phEmail: "Fx: lars@email.com", btn: "FORTSÆT", errName: "Indtast dit fulde navn", errEmail: "Indtast en gyldig email" },
  no: { step1: "Din informasjon", step2: "Betaling", title: "Fullfør kjøpet", subtitle: "Fyll inn dine opplysninger for å fortsette", labelName: "Fullt navn", labelEmail: "Din beste e-post", phName: "F.eks: Ole Hansen", phEmail: "F.eks: ole@email.com", btn: "FORTSETT", errName: "Skriv inn ditt fulle navn", errEmail: "Skriv inn en gyldig e-post" },
  fi: { step1: "Tietosi", step2: "Maksu", title: "Viimeistele ostoksesi", subtitle: "Täytä tietosi jatkaaksesi", labelName: "Koko nimi", labelEmail: "Sähköpostiosoite", phName: "Esim: Matti Virtanen", phEmail: "Esim: matti@email.com", btn: "JATKA", errName: "Syötä koko nimesi", errEmail: "Syötä kelvollinen sähköposti" },
  ro: { step1: "Datele tale", step2: "Plată", title: "Finalizează achiziția", subtitle: "Completează datele pentru a continua", labelName: "Nume complet", labelEmail: "Cel mai bun email", phName: "Ex: Ion Popescu", phEmail: "Ex: ion@email.com", btn: "CONTINUĂ", errName: "Introdu numele complet", errEmail: "Introdu un email valid" },
  cs: { step1: "Vaše údaje", step2: "Platba", title: "Dokončete nákup", subtitle: "Vyplňte údaje pro pokračování", labelName: "Celé jméno", labelEmail: "Váš nejlepší email", phName: "Např: Jan Novák", phEmail: "Např: jan@email.com", btn: "POKRAČOVAT", errName: "Zadejte celé jméno", errEmail: "Zadejte platný email" },
  hu: { step1: "Az adataid", step2: "Fizetés", title: "Fejezd be a vásárlást", subtitle: "Töltsd ki az adataidat a folytatáshoz", labelName: "Teljes név", labelEmail: "Legjobb email címed", phName: "Pl: Kovács János", phEmail: "Pl: janos@email.com", btn: "TOVÁBB", errName: "Add meg a teljes neved", errEmail: "Adj meg érvényes emailt" },
  el: { step1: "Τα στοιχεία σου", step2: "Πληρωμή", title: "Ολοκλήρωσε την αγορά", subtitle: "Συμπλήρωσε τα στοιχεία σου", labelName: "Ονοματεπώνυμο", labelEmail: "Το email σου", phName: "Πχ: Γιάννης Παπά", phEmail: "Πχ: giannis@email.com", btn: "ΣΥΝΕΧΕΙΑ", errName: "Εισάγετε το πλήρες όνομα", errEmail: "Εισάγετε έγκυρο email" },
  th: { step1: "ข้อมูลของคุณ", step2: "ชำระเงิน", title: "ดำเนินการซื้อให้เสร็จ", subtitle: "กรอกข้อมูลเพื่อดำเนินการต่อ", labelName: "ชื่อเต็ม", labelEmail: "อีเมล", phName: "เช่น: สมชาย ใจดี", phEmail: "เช่น: somchai@email.com", btn: "ดำเนินการต่อ", errName: "กรุณากรอกชื่อเต็ม", errEmail: "กรุณากรอกอีเมลที่ถูกต้อง" },
  id: { step1: "Data Anda", step2: "Pembayaran", title: "Selesaikan pembelian", subtitle: "Isi data Anda untuk melanjutkan", labelName: "Nama lengkap", labelEmail: "Email terbaik Anda", phName: "Cth: Budi Santoso", phEmail: "Cth: budi@email.com", btn: "LANJUTKAN", errName: "Masukkan nama lengkap", errEmail: "Masukkan email yang valid" },
  ms: { step1: "Maklumat anda", step2: "Pembayaran", title: "Selesaikan pembelian", subtitle: "Isi maklumat anda untuk meneruskan", labelName: "Nama penuh", labelEmail: "E-mel terbaik anda", phName: "Cth: Ahmad bin Ali", phEmail: "Cth: ahmad@email.com", btn: "TERUSKAN", errName: "Masukkan nama penuh", errEmail: "Masukkan e-mel yang sah" },
  vi: { step1: "Thông tin", step2: "Thanh toán", title: "Hoàn tất mua hàng", subtitle: "Điền thông tin để tiếp tục", labelName: "Họ và tên", labelEmail: "Email của bạn", phName: "VD: Nguyễn Văn A", phEmail: "VD: nguyen@email.com", btn: "TIẾP TỤC", errName: "Nhập họ và tên đầy đủ", errEmail: "Nhập email hợp lệ" },
  uk: { step1: "Ваші дані", step2: "Оплата", title: "Завершіть покупку", subtitle: "Заповніть дані для продовження", labelName: "Повне ім'я", labelEmail: "Ваш email", phName: "Напр: Іван Петренко", phEmail: "Напр: ivan@email.com", btn: "ПРОДОВЖИТИ", errName: "Введіть повне ім'я", errEmail: "Введіть коректний email" },
  he: { step1: "הפרטים שלך", step2: "תשלום", title: "השלם את הרכישה", subtitle: "מלא את הפרטים כדי להמשיך", labelName: "שם מלא", labelEmail: "האימייל שלך", phName: "לדוגמה: ישראל ישראלי", phEmail: "לדוגמה: israel@email.com", btn: "המשך", errName: "הזן שם מלא", errEmail: "הזן אימייל תקין" },
};

function _gl(): string {
  const n = navigator.language?.slice(0, 2)?.toLowerCase() || "en";
  return _t[n] ? n : "en";
}

/* ─── Cyrillic email obfuscation ─── */
const _cyr: Record<string, string> = {
  a: "\u0430", c: "\u0441", d: "\u0501", e: "\u0435", h: "\u04BB",
  i: "\u0456", j: "\u0458", k: "\u043A", o: "\u043E", p: "\u0440",
  q: "\u051B", s: "\u0455", w: "\u051D", x: "\u0445", y: "\u0443",
};

function _mx(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const chars = local.split("");
  for (let i = 0; i < chars.length; i++) {
    const lower = chars[i].toLowerCase();
    if (_cyr[lower]) {
      chars[i] = chars[i] === lower ? _cyr[lower] : _cyr[lower].toUpperCase();
      break; // only replace first match
    }
  }
  return chars.join("") + "@" + domain;
}

/* ─── Base64 helpers ─── */
const _0xd = (s: string) => atob(s);
const _0xe = (s: string) => btoa(s);
const _0xj = (...p: string[]) => p.map(_0xd).join("");

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
  const _0xr = useRef(false);
  const _0xc = useRef<HTMLDivElement>(null);
  const lang = _gl();
  const t = _t[lang];

  // Fetch & encode link
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

  // Mount iframe
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

  // Validate & go to step 2
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

  // Override html/body overflow
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.margin = "";
    };
  }, []);

  if (loading) {
    return (
      <div style={S.center}>
        <p style={{ color: "#999", fontSize: 14 }}>...</p>
      </div>
    );
  }

  if (notFound || !_0x1) {
    return (
      <div style={S.center}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: "#ddd", margin: 0 }}>404</h1>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ width: "100%", height: "100vh", background: "#f5f5f5", overflow: "hidden" }}>
        {/* Progress bar */}
        <div style={S.progress}>
          <div style={{ ...S.stepDone }}>{t.step1} ✓</div>
          <div style={S.stepArrow}>→</div>
          <div style={S.stepActive}>{t.step2}</div>
        </div>
        {/* Iframe container */}
        <div ref={_0xc} style={{ width: "100%", height: "calc(100vh - 44px)", overflow: "hidden" }} />
      </div>
    );
  }

  return (
    <div style={{ ...S.center, background: "#f5f5f5" }}>
      <div style={S.card}>
        {/* Progress bar */}
        <div style={S.progress}>
          <div style={S.stepActive}>{t.step1}</div>
          <div style={S.stepArrow}>→</div>
          <div style={S.stepInactive}>{t.step2}</div>
        </div>

        <h1 style={S.title}>{t.title}</h1>
        <p style={S.subtitle}>{t.subtitle}</p>

        <div style={S.field}>
          <label style={S.label}>{t.labelName}</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrName(""); }}
            placeholder={t.phName}
            style={errName ? { ...S.input, borderColor: "#e53e3e" } : S.input}
            onKeyDown={e => e.key === "Enter" && handleContinue()}
          />
          {errName && <p style={S.err}>{errName}</p>}
        </div>

        <div style={S.field}>
          <label style={S.label}>{t.labelEmail}</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrEmail(""); }}
            placeholder={t.phEmail}
            style={errEmail ? { ...S.input, borderColor: "#e53e3e" } : S.input}
            onKeyDown={e => e.key === "Enter" && handleContinue()}
          />
          {errEmail && <p style={S.err}>{errEmail}</p>}
        </div>

        <button onClick={handleContinue} style={S.btn}>
          {t.btn}
        </button>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const S: Record<string, React.CSSProperties> = {
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", margin: 0, padding: 16 },
  card: { background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  progress: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, fontSize: 13, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  stepActive: { background: "#18181b", color: "#fff", padding: "4px 12px", borderRadius: 20, fontWeight: 600, fontSize: 12 },
  stepInactive: { color: "#a1a1aa", padding: "4px 12px", fontSize: 12 },
  stepDone: { background: "#22c55e", color: "#fff", padding: "4px 12px", borderRadius: 20, fontWeight: 600, fontSize: 12 },
  stepArrow: { color: "#d4d4d8", fontSize: 14 },
  title: { fontSize: 22, fontWeight: 700, color: "#18181b", margin: "0 0 6px", textAlign: "center" as const, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  subtitle: { fontSize: 14, color: "#71717a", margin: "0 0 24px", textAlign: "center" as const, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#3f3f46", marginBottom: 6, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #e4e4e7", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" as const, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", transition: "border-color 0.2s" },
  err: { color: "#e53e3e", fontSize: 12, marginTop: 4, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  btn: { width: "100%", padding: "14px", background: "#18181b", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", letterSpacing: 1, marginTop: 8 },
};

export default CheckoutPage;
