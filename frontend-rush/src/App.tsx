import { useState, useEffect } from "react";
import { nativeToScVal, Address, xdr } from "@stellar/stellar-sdk";
import { useContract } from "./hooks/useContract";

// ─── Helpers ─────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";
}
function formatDate(ts) {
  return ts ? new Date(Number(ts) * 1000).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  }) : "-";
}

// ─── Styles ──────────────────────────────────────────────────
const s = {
  app: { maxWidth: 700, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "2px solid #e5e7eb" },
  title: { fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#111" },
  subtitle: { fontSize: "0.8rem", color: "#6b7280", margin: "2px 0 0" },
  btnPrimary: { background: "#6366f1", color: "#fff", border: "none", padding: "0.6rem 1.4rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnSuccess: { background: "#16a34a", color: "#fff", border: "none", padding: "0.6rem 1.4rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnOutline: { background: "transparent", color: "#374151", border: "1px solid #d1d5db", padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer" },
  btnDanger: { background: "#ef4444", color: "#fff", border: "none", padding: "0.35rem 0.8rem", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem" },
  tabs: { display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb" },
  tab: (active) => ({ padding: "0.6rem 1.2rem", cursor: "pointer", border: "none", background: "none", fontWeight: active ? 700 : 400, color: active ? "#6366f1" : "#6b7280", borderBottom: active ? "2px solid #6366f1" : "2px solid transparent", fontSize: "0.9rem" }),
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  validBadge: (revoked) => ({ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700, background: revoked ? "#fee2e2" : "#dcfce7", color: revoked ? "#991b1b" : "#166534" }),
  form: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "0.6rem 0.75rem", fontSize: "0.95rem", boxSizing: "border-box" as const, marginBottom: "0.75rem" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" },
  error: { color: "#ef4444", fontSize: "0.85rem", margin: "0.5rem 0" },
  success: { color: "#16a34a", fontSize: "0.85rem", margin: "0.5rem 0" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  certTitle: { margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700 },
  certSub: { margin: 0, color: "#6b7280", fontSize: "0.88rem" },
  metaRow: { display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap" },
  metaItem: { fontSize: "0.8rem", color: "#9ca3af" },
  metaVal: { fontWeight: 600, color: "#374151" },
  verifyBox: { border: "2px dashed #d1d5db", borderRadius: 12, padding: "2rem", textAlign: "center" },
  bigIcon: { fontSize: "3rem", marginBottom: "0.5rem" },
  walletInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  walletRow: { display: "flex", alignItems: "center", gap: 8 },
  address: { fontSize: "0.8rem", color: "#6b7280", fontFamily: "monospace", background: "#f3f4f6", padding: "0.35rem 0.65rem", borderRadius: 6 },
  balance: { fontSize: "0.75rem", color: "#6366f1", fontWeight: 600 },
  empty: { textAlign: "center", color: "#9ca3af", padding: "2.5rem 0", fontSize: "0.9rem" },
  sectionTitle: { fontWeight: 700, marginBottom: "1rem", color: "#111827", fontSize: "0.95rem" },
};

// ─── Certificate Card ─────────────────────────────────────────
function CertCard({ cert, onRevoke, canRevoke, txLoading }) {
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={s.certTitle}>{cert.name}</h3>
          <p style={s.certSub}>{cert.degree}</p>
        </div>
        <span style={s.validBadge(cert.is_revoked)}>
          {cert.is_revoked ? "DICABUT" : "VALID"}
        </span>
      </div>
      <div style={s.metaRow}>
        <div style={s.metaItem}>Institusi <br /><span style={s.metaVal}>{cert.institution}</span></div>
        <div style={s.metaItem}>Tanggal Terbit <br /><span style={s.metaVal}>{formatDate(cert.issued_at)}</span></div>
        <div style={s.metaItem}>ID Sertifikat <br /><span style={{ ...s.metaVal, fontFamily: "monospace", fontSize: "0.75rem" }}>{cert.id?.toString().slice(0, 16)}...</span></div>
      </div>
      {canRevoke && !cert.is_revoked && (
        <div style={{ marginTop: "1rem" }}>
          <button style={s.btnDanger} onClick={() => onRevoke(cert.id)} disabled={txLoading}>
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

  const [tab, setTab] = useState("verify");         // "verify" | "mycerts" | "issue"
  const [isInstitution, setIsInstitution] = useState(false);

  // Verify tab
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // My Certs tab
  const [myCerts, setMyCerts] = useState([]);

  // Issue tab
  const [form, setForm] = useState({ recipient: "", name: "", degree: "", institution: "" });

  // ── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isWalletConnected) { setIsInstitution(false); return; }
    checkIsInstitution();
    if (tab === "mycerts") loadMyCerts();
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    if (tab === "mycerts" && isWalletConnected) loadMyCerts();
  }, [tab]);

  // ── Helpers ─────────────────────────────────────────────────
  async function checkIsInstitution() {
    try {
      const result = await readContract("is_institution", [
        new Address(publicKey).toScVal(),
      ]);
      setIsInstitution(!!result);
    } catch { setIsInstitution(false); }
  }

  async function loadMyCerts() {
    try {
      const data = await readContract("get_certificates_by_owner", [
        new Address(publicKey).toScVal(),
      ]);
      setMyCerts(data || []);
    } catch { setMyCerts([]); }
  }

  // ── Verify ──────────────────────────────────────────────────
  async function handleVerify() {
    setVerifyError(""); setVerifyResult(null);
    if (!verifyId.trim()) return;
    setVerifyLoading(true);
    try {
      const cert = await readContract("verify_certificate", [
        nativeToScVal(BigInt(verifyId.trim()), { type: "u64" }),
      ]);
      setVerifyResult(cert);
    } catch (e) {
      setVerifyError("Sertifikat tidak ditemukan.");
    } finally {
      setVerifyLoading(false);
    }
  }

  // ── Issue ────────────────────────────────────────────────────
  async function handleIssue() {
    await writeContract("issue_certificate", [
      new Address(publicKey).toScVal(),
      new Address(form.recipient).toScVal(),
      nativeToScVal(form.name, { type: "string" }),
      nativeToScVal(form.degree, { type: "string" }),
      nativeToScVal(form.institution, { type: "string" }),
    ]);
    setForm({ recipient: "", name: "", degree: "", institution: "" });
    if (tab === "mycerts") loadMyCerts();
  }

  // ── Revoke ───────────────────────────────────────────────────
  async function handleRevoke(certId) {
    await writeContract("revoke_certificate", [
      new Address(publicKey).toScVal(),
      nativeToScVal(certId, { type: "u64" }),
    ]);
    loadMyCerts();
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={s.app}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>IjazahVerify</h1>
          <p style={s.subtitle}>Verifikasi ijazah on-chain · Stellar Testnet</p>
        </div>

        {isWalletConnected ? (
          <div style={s.walletInfo}>
            <div style={s.walletRow}>
              <span style={s.address}>{shortAddr(publicKey)}</span>
              {isInstitution && <span style={{ ...s.validBadge(false), fontSize: "0.7rem" }}>INSTITUSI</span>}
              <button style={s.btnOutline} onClick={disconnectWallet}>Keluar</button>
            </div>
            {xlmBalance && <span style={s.balance}>{parseFloat(xlmBalance).toFixed(2)} XLM</span>}
          </div>
        ) : (
          <button style={s.btnPrimary} onClick={connectWallet} disabled={walletLoading}>
            {walletLoading ? "Menghubungkan..." : "Hubungkan Wallet"}
          </button>
        )}
      </div>

      {/* Global status */}
      {walletError && <p style={s.error}>⚠ {walletError}</p>}
      {txError && <p style={s.error}>⚠ {txError}</p>}
      {txSuccess && <p style={s.success}>✓ Transaksi berhasil!</p>}

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(tab === "verify")} onClick={() => setTab("verify")}>Verifikasi</button>
        {isWalletConnected && (
          <button style={s.tab(tab === "mycerts")} onClick={() => setTab("mycerts")}>Ijazah Saya</button>
        )}
        {isInstitution && (
          <button style={s.tab(tab === "issue")} onClick={() => setTab("issue")}>Terbitkan</button>
        )}
      </div>

      {/* ── Tab: Verifikasi ────────────────────────────────── */}
      {tab === "verify" && (
        <div>
          <div style={s.verifyBox}>
            <div style={s.bigIcon}>🔍</div>
            <p style={{ margin: "0 0 1rem", color: "#374151", fontWeight: 600 }}>
              Masukkan ID sertifikat untuk verifikasi
            </p>
            <div style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto" }}>
              <input
                style={{ ...s.input, margin: 0, flex: 1 }}
                placeholder="Contoh: 12345678901234567890"
                value={verifyId}
                onChange={e => setVerifyId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
              />
              <button style={s.btnPrimary} onClick={handleVerify} disabled={verifyLoading}>
                {verifyLoading ? "..." : "Cek"}
              </button>
            </div>
          </div>

          {verifyError && <p style={{ ...s.error, textAlign: "center", marginTop: "1rem" }}>{verifyError}</p>}

          {verifyResult && (
            <div style={{ marginTop: "1.5rem" }}>
              <p style={s.sectionTitle}>Hasil Verifikasi</p>
              <CertCard cert={verifyResult} canRevoke={false} />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Ijazah Saya ───────────────────────────────── */}
      {tab === "mycerts" && (
        <div>
          <p style={s.sectionTitle}>Ijazah milik {shortAddr(publicKey)}</p>
          {myCerts.length === 0
            ? <p style={s.empty}>Belum ada ijazah.</p>
            : myCerts.map(cert => (
              <CertCard
                key={cert.id?.toString()}
                cert={cert}
                canRevoke={isInstitution}
                onRevoke={handleRevoke}
                txLoading={txLoading}
              />
            ))
          }
        </div>
      )}

      {/* ── Tab: Terbitkan (institusi) ─────────────────────── */}
      {tab === "issue" && isInstitution && (
        <div>
          <div style={s.form}>
            <p style={s.sectionTitle}>Terbitkan Ijazah Baru</p>

            <label style={s.label}>Wallet Penerima *</label>
            <input style={s.input} placeholder="G..." value={form.recipient}
              onChange={e => setForm({ ...form, recipient: e.target.value })} />

            <div style={s.grid2}>
              <div>
                <label style={s.label}>Nama Lengkap *</label>
                <input style={s.input} placeholder="Nama penerima" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Gelar / Program Studi *</label>
                <input style={s.input} placeholder="S.Kom - Teknik Informatika" value={form.degree}
                  onChange={e => setForm({ ...form, degree: e.target.value })} />
              </div>
            </div>

            <label style={s.label}>Nama Institusi *</label>
            <input style={s.input} placeholder="Universitas ..." value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })} />

            <button
              style={s.btnSuccess}
              onClick={handleIssue}
              disabled={txLoading || !form.recipient || !form.name || !form.degree || !form.institution}
            >
              {txLoading ? "Menerbitkan..." : "Terbitkan Ijazah"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}