import { useState, useEffect } from "react";
import { nativeToScVal, Address } from "@stellar/stellar-sdk";
import { useContract } from "./hooks/useContract";

// ─── Icons (inline SVG, no extra dep) ────────────────────────
const Icon = {
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Award: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Building: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  ),
  Book: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5v14" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  History: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}
function formatDate(ts) {
  if (!ts) return "-";
  return new Date(Number(ts) * 1000).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Field Component ──────────────────────────────────────────
function Field({ label, icon: IconComp, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {IconComp && <IconComp />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Input Component ──────────────────────────────────────────
function Input({ mono, amber, className = "", ...props }) {
  return (
    <input
      className={`
        w-full bg-slate-950 border border-slate-700/60 rounded-xl
        px-4 py-3 text-sm text-slate-100 placeholder-slate-600
        outline-none transition-all duration-200
        focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15
        ${mono ? "font-mono text-[13px] tracking-tight" : ""}
        ${amber ? "focus:border-amber-400 focus:ring-amber-400/15" : ""}
        ${className}
      `}
      {...props}
    />
  );
}

// ─── Cert Card ────────────────────────────────────────────────
function CertCard({ cert, canRevoke, onRevoke, txLoading }) {
  const [copied, setCopied] = useState(false);
  const revoked = cert.is_revoked;
  const certIdStr = cert.id?.toString();

  function handleCopy() {
    navigator.clipboard.writeText(certIdStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`
      relative rounded-2xl overflow-hidden border transition-all duration-300
      ${revoked
        ? "bg-slate-900 border-rose-500/20"
        : "bg-slate-900 border-slate-700/50 hover:border-violet-500/30"
      }
    `}>
      {/* top accent line */}
      <div className={`h-0.5 w-full ${revoked ? "bg-rose-500" : "bg-gradient-to-r from-violet-500 to-violet-300"}`} />

      <div className="p-6">
        {/* top row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className={`
              w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              ${revoked ? "bg-rose-500/10 text-rose-400" : "bg-violet-500/10 text-violet-400"}
            `}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">{cert.name}</p>
              <p className="text-slate-400 text-sm mt-0.5">{cert.degree}</p>
            </div>
          </div>
          <span className={`
            text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shrink-0
            ${revoked
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }
          `}>
            {revoked ? "Dicabut" : "✓ Valid"}
          </span>
        </div>

        {/* meta grid */}
        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-800">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Institusi</p>
            <p className="text-sm font-semibold text-slate-200 truncate">{cert.institution}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Terbit</p>
            <p className="text-sm font-semibold text-slate-200">{formatDate(cert.issued_at)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Cert ID</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-mono text-slate-400 truncate">{certIdStr?.slice(0, 12)}…</p>
              <button
                onClick={handleCopy}
                className="shrink-0 text-slate-500 hover:text-violet-400 transition-colors"
                title="Copy full ID"
              >
                {copied ? <Icon.Check /> : <Icon.Copy />}
              </button>
            </div>
          </div>
        </div>

        {/* revoke */}
        {canRevoke && !revoked && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => onRevoke(cert.id)}
              disabled={txLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            >
              <Icon.X /> Cabut Ijazah
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const {
    publicKey, isWalletConnected, walletLoading, walletError,
    connectWallet, disconnectWallet,
    readContract, writeContract,
    txLoading, txError, txSuccess, xlmBalance,
  } = useContract();

  const [tab, setTab] = useState("verify");
  const [isInstitution, setIsInstitution] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // verify
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // my certs
  const [myCerts, setMyCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  // issue
  const [form, setForm] = useState({ recipient: "", name: "", degree: "", institution: "" });
  const [issuedId, setIssuedId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // admin
  const [newInst, setNewInst] = useState("");
  const [adminStatus, setAdminStatus] = useState(null); // "ok" | "err"
  const [adminLoading, setAdminLoading] = useState(false);
  const [registeredList, setRegisteredList] = useState([]);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isWalletConnected) { setIsInstitution(false); setIsAdmin(false); return; }
    checkRoles();
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    if (tab === "mycerts" && isWalletConnected) loadMyCerts();
  }, [tab, isWalletConnected]);

  async function checkRoles() {
    try {
      const [inst, admin] = await Promise.all([
        readContract("is_institution", [new Address(publicKey).toScVal()]),
        readContract("get_admin", []),
      ]);
      setIsInstitution(!!inst);
      setIsAdmin(admin === publicKey);
    } catch {
      setIsInstitution(false); setIsAdmin(false);
    }
  }

  async function loadMyCerts() {
    setCertsLoading(true);
    try {
      const data = await readContract("get_certificates_by_owner", [new Address(publicKey).toScVal()]);
      setMyCerts(data || []);
    } catch { setMyCerts([]); }
    finally { setCertsLoading(false); }
  }

  async function handleVerify() {
    setVerifyError(""); setVerifyResult(null);
    if (!verifyId.trim()) return;
    setVerifyLoading(true);
    try {
      const cert = await readContract("verify_certificate", [
        nativeToScVal(BigInt(verifyId.trim()), { type: "u64" }),
      ]);
      setVerifyResult(cert);
      setShowCertModal(true);
    } catch { setVerifyError("Sertifikat tidak ditemukan di blockchain."); }
    finally { setVerifyLoading(false); }
  }

  async function handleIssue() {
    try {
      const res = await writeContract("issue_certificate", [
        new Address(publicKey).toScVal(),
        new Address(form.recipient).toScVal(),
        nativeToScVal(form.name, { type: "string" }),
        nativeToScVal(form.degree, { type: "string" }),
        nativeToScVal(form.institution, { type: "string" }),
      ]);
      setForm({ recipient: "", name: "", degree: "", institution: "" });
      if (res?.returnValue) { setIssuedId(res.returnValue.toString()); setShowSuccessModal(true); }
    } catch { }
  }

  async function handleRevoke(certId) {
    try {
      await writeContract("revoke_certificate", [
        new Address(publicKey).toScVal(),
        nativeToScVal(certId, { type: "u64" }),
      ]);
      loadMyCerts();
    } catch { }
  }

  async function handleRegister() {
    if (!newInst.trim()) return;
    setAdminLoading(true); setAdminStatus(null);
    try {
      await writeContract("register_institution", [
        new Address(publicKey).toScVal(),
        new Address(newInst.trim()).toScVal(),
      ]);
      setRegisteredList(p => [...p, newInst.trim()]);
      setAdminStatus("ok");
      setNewInst("");
    } catch (e) { setAdminStatus("err"); }
    finally { setAdminLoading(false); }
  }

  const canIssue = form.recipient && form.name && form.degree && form.institution;

  // ── Tab config ────────────────────────────────────────────────
  const tabs = [
    { id: "verify", label: "Verifikasi", icon: Icon.Search },
    ...(isWalletConnected ? [{ id: "mycerts", label: "Ijazah Saya", icon: Icon.History }] : []),
    ...(isInstitution ? [{ id: "issue", label: "Terbitkan", icon: Icon.Plus }] : []),
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Icon.Shield, admin: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* bg glow */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-violet-800/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-width mx-auto max-w-4xl px-6 py-10">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Ijazah<span className="text-violet-400">Verify</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-500">Stellar Testnet · Soroban</span>
            </div>
          </div>

          {/* wallet */}
          {isWalletConnected ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/60 rounded-full pl-4 pr-1.5 py-1.5">
                <div className="text-right mr-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 leading-tight">Wallet</p>
                  <p className="text-xs font-mono text-violet-300 leading-tight">{shortAddr(publicKey)}</p>
                </div>
                {isAdmin && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
                {isInstitution && !isAdmin && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded-full">
                    Institusi
                  </span>
                )}
                <button
                  onClick={disconnectWallet}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Icon.Logout />
                </button>
              </div>
              {xlmBalance && (
                <span className="text-[11px] font-mono text-slate-500 pr-1">
                  {parseFloat(xlmBalance).toFixed(2)} XLM
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={walletLoading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {walletLoading ? <Icon.Loader /> : <Icon.Wallet />}
              {walletLoading ? "Menghubungkan…" : "Hubungkan Wallet"}
            </button>
          )}
        </header>

        {/* ── Global Alerts ── */}
        {walletError && (
          <div className="flex items-center gap-3 bg-rose-500/8 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm font-medium mb-4">
            <Icon.X /> {walletError}
          </div>
        )}
        {txError && (
          <div className="flex items-center gap-3 bg-rose-500/8 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm font-medium mb-4">
            <Icon.X /> {txError}
          </div>
        )}
        {txSuccess && (
          <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium mb-4">
            <Icon.Check /> Transaksi berhasil dikonfirmasi di blockchain
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 w-fit mb-10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200
                ${tab === t.id
                  ? t.admin
                    ? "bg-amber-500/10 text-amber-400 font-semibold"
                    : "bg-slate-800 text-white font-semibold shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
                }
              `}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TAB: VERIFIKASI
        ════════════════════════════════════════ */}
        {tab === "verify" && (
          <div className="space-y-6">
            {/* hero */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(124,92,252,0.5)]">🔎</div>
                <h2 className="text-2xl font-bold text-white mb-2">Verifikasi Ijazah</h2>
                <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
                  Masukkan ID sertifikat untuk memverifikasi keasliannya langsung dari blockchain
                </p>
                <div className="flex gap-3 max-w-lg mx-auto">
                  <input
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-600 outline-none transition-all"
                    placeholder="Contoh: 6404313042471320653"
                    value={verifyId}
                    onChange={e => setVerifyId(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleVerify()}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={verifyLoading || !verifyId.trim()}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 shrink-0"
                  >
                    {verifyLoading ? <Icon.Loader /> : <Icon.Search />}
                    {verifyLoading ? "Mengecek…" : "Cek"}
                  </button>
                </div>
              </div>
            </div>

            {verifyError && (
              <div className="flex items-center gap-3 bg-rose-500/8 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm">
                <Icon.X /> {verifyError}
              </div>
            )}

            {verifyResult && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-3">
                  Hasil Verifikasi <span className="flex-1 h-px bg-slate-800" />
                </p>
                <CertCard cert={verifyResult} canRevoke={false} onRevoke={() => { }} txLoading={false} />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: IJAZAH SAYA
        ════════════════════════════════════════ */}
        {tab === "mycerts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-3">
                Ijazah milik {shortAddr(publicKey)} <span className="flex-1 h-px bg-slate-800" />
              </p>
              <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
                {myCerts.length} total
              </span>
            </div>

            {certsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-900 border border-slate-800 rounded-3xl">
                <Icon.Loader />
                <p className="text-slate-500 text-sm mt-3">Memuat dari blockchain…</p>
              </div>
            ) : myCerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-900 border border-dashed border-slate-800 rounded-3xl text-center px-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Icon.History />
                </div>
                <p className="font-bold text-slate-300 mb-1">Belum ada ijazah</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Tidak ada sertifikat yang terdaftar untuk wallet ini di jaringan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myCerts.map(cert => (
                  <CertCard
                    key={cert.id?.toString()}
                    cert={cert}
                    canRevoke={isInstitution}
                    onRevoke={handleRevoke}
                    txLoading={txLoading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: TERBITKAN
        ════════════════════════════════════════ */}
        {tab === "issue" && isInstitution && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            {/* header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                <Icon.Plus /> Penerbitan Sertifikat
              </div>
              <h2 className="text-2xl font-bold text-white">Terbitkan Ijazah Baru</h2>
              <p className="text-slate-400 text-sm mt-1">
                Buat sertifikat permanen yang tercatat di blockchain Stellar.
              </p>
            </div>

            {/* form */}
            <div className="px-8 py-7 space-y-6">

              {/* recipient */}
              <Field label="Wallet Penerima" icon={Icon.Wallet}>
                <input
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 font-mono text-[13px] text-slate-100 placeholder-slate-600 outline-none transition-all"
                  placeholder="GABC...XYZ — alamat wallet penerima ijazah"
                  value={form.recipient}
                  onChange={e => setForm({ ...form, recipient: e.target.value })}
                />
              </Field>

              {/* name + degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Nama Lengkap" icon={Icon.User}>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                    placeholder="Budi Santoso"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Gelar / Program Studi" icon={Icon.Book}>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                    placeholder="S.Kom — Teknik Informatika"
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                  />
                </Field>
              </div>

              {/* institution */}
              <Field label="Nama Institusi" icon={Icon.Building}>
                <input
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  placeholder="Universitas Nusantara"
                  value={form.institution}
                  onChange={e => setForm({ ...form, institution: e.target.value })}
                />
              </Field>
            </div>

            {/* footer */}
            <div className="px-8 pb-8">
              <div className="h-px bg-slate-800 mb-6" />
              <button
                onClick={handleIssue}
                disabled={txLoading || !canIssue}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 font-bold text-base py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {txLoading ? <><Icon.Loader /> Menerbitkan…</> : <><Icon.Award /> Terbitkan Ijazah</>}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: ADMIN
        ════════════════════════════════════════ */}
        {tab === "admin" && isAdmin && (
          <div className="space-y-6">
            {/* info banner */}
            <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                <Icon.Shield />
              </div>
              <div>
                <p className="font-bold text-amber-400 text-sm">Admin Panel</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Daftarkan wallet institusi agar bisa menerbitkan ijazah on-chain melalui tab Terbitkan.
                </p>
              </div>
            </div>

            {/* register form */}
            <div className="bg-slate-900 border border-amber-500/15 rounded-3xl overflow-hidden">
              <div className="px-8 pt-7 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                  <Icon.Plus /> Daftarkan Institusi
                </div>
                <h2 className="text-xl font-bold text-white">Tambah Institusi Baru</h2>
              </div>

              <div className="px-8 py-7">
                <Field label="Alamat Wallet Institusi" icon={Icon.Building}>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 rounded-xl px-4 py-3 font-mono text-[13px] text-slate-100 placeholder-slate-600 outline-none transition-all"
                    placeholder="GABC...XYZ"
                    value={newInst}
                    onChange={e => setNewInst(e.target.value)}
                  />
                </Field>
                <p className="text-xs text-slate-500 -mt-2 mb-6">
                  Setelah didaftarkan, wallet tersebut otomatis mendapat akses tab "Terbitkan".
                </p>

                {adminStatus === "ok" && (
                  <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <Icon.Check /> Institusi berhasil didaftarkan
                  </div>
                )}
                {adminStatus === "err" && (
                  <div className="flex items-center gap-2 bg-rose-500/8 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <Icon.X /> Gagal mendaftarkan institusi
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={adminLoading || !newInst.trim()}
                  className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/18 text-amber-400 border border-amber-500/20 font-bold text-sm px-7 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {adminLoading ? <><Icon.Loader /> Mendaftarkan…</> : <><Icon.Plus /> Daftarkan Institusi</>}
                </button>
              </div>
            </div>

            {/* registered list */}
            {registeredList.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Baru Didaftarkan Sesi Ini
                  </p>
                </div>
                <div className="divide-y divide-slate-800">
                  {registeredList.map((addr, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3.5">
                      <span className="font-mono text-xs text-violet-300">
                        {addr.slice(0, 10)}…{addr.slice(-10)}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        ✓ Terdaftar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-24 pt-8 border-t border-slate-900 text-center">
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
            Built on Soroban · Stellar · Secure Academic Verification
          </p>
        </footer>
      </div>

      {/* ════════════════════════════════════════
          MODAL: SUKSES TERBITKAN
      ════════════════════════════════════════ */}
      {showSuccessModal && issuedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Ijazah Diterbitkan!</h3>
              <p className="text-slate-400 text-sm mb-6">
                Sertifikat berhasil dicatat di blockchain Stellar.
              </p>

              <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 mb-6 text-left">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Certificate ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-violet-300 break-all flex-1">{issuedId}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(issuedId)}
                    className="shrink-0 text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    <Icon.Copy />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic mb-6">
                Simpan ID ini untuk verifikasi keaslian ijazah kapan saja.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setTab("verify"); setVerifyId(issuedId); setShowSuccessModal(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  <Icon.Search /> Test Verifikasi
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL: SERTIFIKAT PREMIUM
      ════════════════════════════════════════ */}
      {showCertModal && verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-2xl">
            {/* close */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowCertModal(false)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all"
              >
                <Icon.X />
              </button>
            </div>

            {/* certificate card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative">
              {verifyResult.is_revoked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="text-rose-500/25 text-8xl font-black uppercase border-[10px] border-rose-500/20 border-dashed px-10 py-4 rounded-2xl -rotate-12 select-none">
                    DICABUT
                  </div>
                </div>
              )}

              {/* cert top bar */}
              <div className={`h-2 w-full ${verifyResult.is_revoked ? "bg-rose-500" : "bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500"}`} />

              <div className="p-10 text-center">
                {/* logo */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-violet-50 rounded-full border-4 border-violet-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                    </div>
                    {!verifyResult.is_revoked && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* title */}
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Sertifikat Resmi
                </p>
                <div className="w-16 h-0.5 bg-violet-500 mx-auto mb-6" />

                {/* recipient */}
                <p className="text-slate-400 text-base mb-2 italic">Diberikan kepada</p>
                <h2 className="text-4xl font-bold text-slate-900 mb-5 tracking-tight">
                  {verifyResult.name}
                </h2>

                {/* degree */}
                <p className="text-slate-400 text-sm italic mb-3">Telah berhasil menyelesaikan</p>
                <span className="inline-block bg-slate-900 text-white font-bold text-lg px-7 py-2.5 rounded-full -rotate-1 shadow-xl">
                  {verifyResult.degree}
                </span>

                {/* meta */}
                <div className="grid grid-cols-2 gap-6 mt-10 pt-8 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Diterbitkan oleh</p>
                    <p className="font-bold text-slate-800 text-lg">{verifyResult.institution}</p>
                    <div className="w-16 h-px bg-slate-200 mx-auto mt-2" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tanggal Terbit</p>
                    <p className="font-bold text-slate-800 text-lg">{formatDate(verifyResult.issued_at)}</p>
                    <div className="w-16 h-px bg-slate-200 mx-auto mt-2" />
                  </div>
                </div>

                {/* cert id footer */}
                <div className="mt-8 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 w-fit mx-auto">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-slate-500">
                    ID: {verifyResult.id?.toString()}
                  </span>
                </div>

                {/* status */}
                <div className="mt-4">
                  <span className={`
                    inline-block text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full
                    ${verifyResult.is_revoked
                      ? "bg-rose-100 text-rose-600 border border-rose-200"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }
                  `}>
                    {verifyResult.is_revoked ? "⚠ Sertifikat Ini Telah Dicabut" : "✓ Terverifikasi di Blockchain"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}