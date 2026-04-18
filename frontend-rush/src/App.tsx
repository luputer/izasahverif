import { useState, useEffect } from "react";
import { nativeToScVal, Address } from "@stellar/stellar-sdk";
import { useContract } from "./hooks/useContract";

// ─── Helpers ──────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : "";
}
function formatDate(ts) {
  if (!ts) return "-";
  return new Date(Number(ts) * 1000).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0a0a0f;
    --surface:  #111118;
    --border:   #1e1e2e;
    --border2:  #2a2a3e;
    --accent:   #7c6ef2;
    --accent2:  #a78bfa;
    --green:    #34d399;
    --red:      #f87171;
    --text:     #e2e0ff;
    --muted:    #6b6a8a;
    --dim:      #3a3a52;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 780px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }
  .logo-mark {
    width: 10px; height: 10px;
    background: var(--accent);
    border-radius: 2px;
    display: inline-block;
    margin-right: 8px;
    box-shadow: 0 0 12px var(--accent);
  }
  .app-title {
    font-size: 1.7rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.04em;
    display: flex;
    align-items: center;
  }
  .app-sub {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: 6px;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.02em;
  }

  /* ── Wallet ── */
  .wallet-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
  .wallet-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .addr-pill {
    font-family: 'Space Mono', monospace;
    font-size: 0.78rem;
    background: var(--surface);
    border: 1px solid var(--border2);
    color: var(--accent2);
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
  }
  .balance {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .inst-chip {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    background: rgba(124,110,242,0.15);
    color: var(--accent2);
    border: 1px solid rgba(124,110,242,0.3);
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    text-transform: uppercase;
  }

  /* ── Buttons ── */
  .btn {
    border: none;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    transition: all 0.15s ease;
    border-radius: 10px;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary {
    background: var(--accent);
    color: #fff;
    padding: 0.65rem 1.5rem;
    font-size: 0.9rem;
    box-shadow: 0 0 20px rgba(124,110,242,0.35);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--accent2);
    box-shadow: 0 0 28px rgba(124,110,242,0.5);
    transform: translateY(-1px);
  }
  .btn-outline {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--border2);
    padding: 0.55rem 1rem;
    font-size: 0.82rem;
  }
  .btn-outline:hover { border-color: var(--dim); color: var(--text); }
  .btn-green {
    background: rgba(52,211,153,0.12);
    color: var(--green);
    border: 1px solid rgba(52,211,153,0.25);
    padding: 0.65rem 1.8rem;
    font-size: 0.9rem;
  }
  .btn-green:hover:not(:disabled) {
    background: rgba(52,211,153,0.2);
    border-color: rgba(52,211,153,0.5);
  }
  .btn-red {
    background: rgba(248,113,113,0.1);
    color: var(--red);
    border: 1px solid rgba(248,113,113,0.2);
    padding: 0.4rem 0.9rem;
    font-size: 0.78rem;
    border-radius: 8px;
  }
  .btn-red:hover:not(:disabled) { background: rgba(248,113,113,0.18); }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 2.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 4px;
    width: fit-content;
  }
  .tab {
    border: none;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-weight: 500;
    font-size: 0.88rem;
    padding: 0.6rem 1.4rem;
    border-radius: 9px;
    transition: all 0.2s ease;
    color: var(--muted);
    background: transparent;
  }
  .tab.active {
    background: var(--border2);
    color: #fff;
    font-weight: 600;
  }
  .tab:hover:not(.active) { color: var(--text); }

  /* ── Verify Box ── */
  .verify-wrap {
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3.5rem 2rem;
    text-align: center;
    background: var(--surface);
  }
  .verify-icon {
    font-size: 3rem;
    margin-bottom: 1.2rem;
    display: block;
  }
  .verify-label {
    font-size: 1rem;
    color: var(--muted);
    margin-bottom: 1.8rem;
    font-weight: 400;
  }
  .verify-row {
    display: flex;
    gap: 10px;
    max-width: 460px;
    margin: 0 auto;
  }

  /* ── Inputs ── */
  .input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-family: 'Sora', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 1rem;
  }
  .input::placeholder { color: var(--dim); }
  .input:focus { border-color: var(--accent); }
  .input.mono { font-family: 'Space Mono', monospace; font-size: 0.85rem; }
  .label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.45rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Form Box ── */
  .form-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
  }

  /* ── Cert Card ── */
  .cert-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 1.8rem;
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .cert-card:hover { border-color: var(--border2); }
  .cert-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    opacity: 0.6;
  }
  .cert-card.revoked::before { background: var(--red); }
  .cert-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
  .cert-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
  }
  .cert-degree {
    font-size: 0.88rem;
    color: var(--muted);
    margin-top: 4px;
  }
  .badge {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .badge-valid {
    background: rgba(52,211,153,0.1);
    color: var(--green);
    border: 1px solid rgba(52,211,153,0.25);
  }
  .badge-revoked {
    background: rgba(248,113,113,0.1);
    color: var(--red);
    border: 1px solid rgba(248,113,113,0.2);
  }
  .cert-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding-top: 1.2rem;
    border-top: 1px solid var(--border);
  }
  .meta-item { display: flex; flex-direction: column; gap: 4px; }
  .meta-label { font-size: 0.7rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .meta-val { font-size: 0.85rem; color: var(--text); font-weight: 500; }
  .meta-val.mono { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: var(--muted); }
  .cert-actions { margin-top: 1.2rem; }

  /* ── Section title ── */
  .section-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── Alerts ── */
  .alert {
    padding: 0.8rem 1.2rem;
    border-radius: 10px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }
  .alert-err {
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    color: var(--red);
  }
  .alert-ok {
    background: rgba(52,211,153,0.08);
    border: 1px solid rgba(52,211,153,0.2);
    color: var(--green);
  }

  /* ── Empty ── */
  .empty {
    text-align: center;
    padding: 4rem 0;
    color: var(--dim);
    font-size: 0.9rem;
  }

  /* ── Divider ── */
  .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

  @media (max-width: 600px) {
    .grid2 { grid-template-columns: 1fr; }
    .cert-meta { grid-template-columns: 1fr 1fr; }
    .verify-row { flex-direction: column; }
    .header { flex-direction: column; gap: 1rem; }
    .wallet-box { align-items: flex-start; }
  }
`;

// ─── Cert Card Component ───────────────────────────────────────
function CertCard({ cert, onRevoke, canRevoke, txLoading }) {
  const revoked = cert.is_revoked;
  return (
    <div className={`cert-card ${revoked ? "revoked" : ""}`}>
      <div className="cert-top">
        <div>
          <div className="cert-name">{cert.name}</div>
          <div className="cert-degree">{cert.degree}</div>
        </div>
        <span className={`badge ${revoked ? "badge-revoked" : "badge-valid"}`}>
          {revoked ? "Dicabut" : "Valid"}
        </span>
      </div>
      <div className="cert-meta">
        <div className="meta-item">
          <span className="meta-label">Institusi</span>
          <span className="meta-val">{cert.institution}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Terbit</span>
          <span className="meta-val">{formatDate(cert.issued_at)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Cert ID</span>
          <span className="meta-val mono">{cert.id?.toString().slice(0, 14)}…</span>
        </div>
      </div>
      {canRevoke && !revoked && (
        <div className="cert-actions">
          <button
            className="btn btn-red"
            onClick={() => onRevoke(cert.id)}
            disabled={txLoading}
          >
            Cabut Ijazah
          </button>
        </div>
      )}
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

  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [myCerts, setMyCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  const [form, setForm] = useState({ recipient: "", name: "", degree: "", institution: "" });

  // ── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isWalletConnected) { setIsInstitution(false); return; }
    checkIsInstitution();
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    if (tab === "mycerts" && isWalletConnected) loadMyCerts();
  }, [tab, isWalletConnected]);

  // paste ini di console saat app terbuka dan wallet connected
  document.querySelector('.addr-pill')

  // ── Contract calls ──────────────────────────────────────────
  async function checkIsInstitution() {
    try {
      const result = await readContract("is_institution", [
        new Address(publicKey).toScVal(),
      ]);
      setIsInstitution(!!result);
    } catch { setIsInstitution(false); }
  }

  async function loadMyCerts() {
    setCertsLoading(true);
    try {
      const data = await readContract("get_certificates_by_owner", [
        new Address(publicKey).toScVal(),
      ]);
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
    } catch {
      setVerifyError("Sertifikat tidak ditemukan di blockchain.");
    } finally { setVerifyLoading(false); }
  }

  async function handleIssue() {
    try {
      await writeContract("issue_certificate", [
        new Address(publicKey).toScVal(),
        new Address(form.recipient).toScVal(),
        nativeToScVal(form.name, { type: "string" }),
        nativeToScVal(form.degree, { type: "string" }),
        nativeToScVal(form.institution, { type: "string" }),
      ]);
      setForm({ recipient: "", name: "", degree: "", institution: "" });
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

  const canIssue = form.recipient && form.name && form.degree && form.institution;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── Header ── */}
        <div className="header">
          <div>
            <div className="app-title">
              <span className="logo-mark" />
              IjazahVerify
            </div>
            <div className="app-sub">on-chain · stellar testnet · soroban</div>
          </div>

          {isWalletConnected ? (
            <div className="wallet-box">
              <div className="wallet-row">
                <span className="addr-pill">{shortAddr(publicKey)}</span>
                {isInstitution && <span className="inst-chip">Institusi</span>}
                <button className="btn btn-outline" onClick={disconnectWallet}>Keluar</button>
              </div>
              {xlmBalance && (
                <span className="balance">{parseFloat(xlmBalance).toFixed(2)} XLM</span>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet} disabled={walletLoading}>
              {walletLoading ? "Menghubungkan…" : "Hubungkan Wallet"}
            </button>
          )}
        </div>

        {/* ── Global Alerts ── */}
        {walletError && <div className="alert alert-err">⚠ {walletError}</div>}
        {txError && <div className="alert alert-err">⚠ {txError}</div>}
        {txSuccess && <div className="alert alert-ok">✓ Transaksi berhasil dikonfirmasi</div>}

        {/* ── Tabs ── */}
        <div className="tabs">
          <button
            className={`tab ${tab === "verify" ? "active" : ""}`}
            onClick={() => setTab("verify")}
          >Verifikasi</button>

          {isWalletConnected && (
            <button
              className={`tab ${tab === "mycerts" ? "active" : ""}`}
              onClick={() => setTab("mycerts")}
            >Ijazah Saya</button>
          )}

          {isInstitution && (
            <button
              className={`tab ${tab === "issue" ? "active" : ""}`}
              onClick={() => setTab("issue")}
            >Terbitkan</button>
          )}
        </div>

        {/* ── Tab: Verifikasi ── */}
        {tab === "verify" && (
          <>
            <div className="verify-wrap">
              <span className="verify-icon">🔎</span>
              <p className="verify-label">Masukkan ID sertifikat untuk verifikasi on-chain</p>
              <div className="verify-row">
                <input
                  className="input mono"
                  style={{ margin: 0, flex: 1 }}
                  placeholder="Contoh: 6404313042471320653"
                  value={verifyId}
                  onChange={e => setVerifyId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleVerify}
                  disabled={verifyLoading || !verifyId.trim()}
                  style={{ flexShrink: 0 }}
                >
                  {verifyLoading ? "Mengecek…" : "Cek"}
                </button>
              </div>
            </div>

            {verifyError && (
              <div className="alert alert-err" style={{ marginTop: "1rem" }}>{verifyError}</div>
            )}

            {verifyResult && (
              <div style={{ marginTop: "2rem" }}>
                <div className="section-title">Hasil Verifikasi</div>
                <CertCard cert={verifyResult} canRevoke={false} onRevoke={() => { }} txLoading={false} />
              </div>
            )}
          </>
        )}

        {/* ── Tab: Ijazah Saya ── */}
        {tab === "mycerts" && (
          <>
            <div className="section-title">
              Ijazah milik {shortAddr(publicKey)}
            </div>
            {certsLoading ? (
              <div className="empty">Memuat…</div>
            ) : myCerts.length === 0 ? (
              <div className="empty">Belum ada ijazah yang terdaftar untuk wallet ini.</div>
            ) : (
              myCerts.map(cert => (
                <CertCard
                  key={cert.id?.toString()}
                  cert={cert}
                  canRevoke={isInstitution}
                  onRevoke={handleRevoke}
                  txLoading={txLoading}
                />
              ))
            )}
          </>
        )}

        {/* ── Tab: Terbitkan ── */}
        {tab === "issue" && isInstitution && (
          <>
            <div className="section-title">Terbitkan Ijazah Baru</div>
            <div className="form-box">

              <label className="label">Wallet Penerima</label>
              <input
                className="input mono"
                placeholder="GABC...XYZ"
                value={form.recipient}
                onChange={e => setForm({ ...form, recipient: e.target.value })}
              />

              <div className="grid2">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input
                    className="input"
                    placeholder="Budi Santoso"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Gelar / Program Studi</label>
                  <input
                    className="input"
                    placeholder="S.Kom — Teknik Informatika"
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                  />
                </div>
              </div>

              <label className="label">Nama Institusi</label>
              <input
                className="input"
                placeholder="Universitas Nusantara"
                value={form.institution}
                onChange={e => setForm({ ...form, institution: e.target.value })}
              />

              <div className="divider" />

              <button
                className="btn btn-green"
                onClick={handleIssue}
                disabled={txLoading || !canIssue}
              >
                {txLoading ? "Menerbitkan…" : "Terbitkan Ijazah"}
              </button>
            </div>
          </>
        )}

      </div>
    </>

  );
}