import { useState, useEffect } from "react";
import { nativeToScVal, Address } from "@stellar/stellar-sdk";
import { useContract } from "./hooks/useContract";
import {
  Search,
  Wallet,
  LogOut,
  GraduationCap,
  Plus,
  ShieldCheck,
  History,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Copy,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Helpers ──────────────────────────────────────────────────
function shortAddr(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

function formatDate(ts: any) {
  if (!ts) return "-";
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Cert Card Component ───────────────────────────────────────
function CertCard({ cert, onRevoke, canRevoke, txLoading }: any) {
  const revoked = cert.is_revoked;
  return (
    <Card className={`relative overflow-hidden ${revoked ? "border-red-200 bg-red-50/10" : "border-slate-200"}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${revoked ? "bg-red-500" : "bg-indigo-500"}`} />
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">{cert.name}</CardTitle>
          <CardDescription className="text-slate-500 mt-1">{cert.degree}</CardDescription>
        </div>
        <Badge variant={revoked ? "destructive" : "secondary"} className={revoked ? "" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"}>
          {revoked ? "Revoked" : "Valid"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Institution</span>
            <p className="text-sm font-medium text-slate-700">{cert.institution}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Issued Date</span>
            <p className="text-sm font-medium text-slate-700">{formatDate(cert.issued_at)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Certificate ID</span>
            <p className="text-sm font-mono text-slate-500 truncate">{cert.id?.toString()}</p>
          </div>
        </div>
      </CardContent>
      {canRevoke && !revoked && (
        <CardFooter className="flex justify-end pt-0">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => onRevoke(cert.id)}
            disabled={txLoading}
          >
            {txLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Revoke Certificate
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const {
    publicKey,
    isWalletConnected,
    walletLoading,
    walletError,
    connectWallet,
    disconnectWallet,
    readContract,
    writeContract,
    txLoading,
    txError,
    txSuccess,
    xlmBalance,
  } = useContract();

  const [tab, setTab] = useState("verify");
  const [isInstitution, setIsInstitution] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [myCerts, setMyCerts] = useState<any[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ recipient: "", name: "", degree: "", institution: "" });
  const [newInstAddr, setNewInstAddr] = useState("");

  // ── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isWalletConnected) {
      setIsInstitution(false);
      setIsAdmin(false);
      return;
    }
    checkIsInstitution();
    checkIsAdmin();
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    if (tab === "mycerts" && isWalletConnected) loadMyCerts();
  }, [tab, isWalletConnected]);

  // ── Contract calls ──────────────────────────────────────────
  async function checkIsInstitution() {
    try {
      const result = await readContract("is_institution", [
        new Address(publicKey).toScVal(),
      ]);
      setIsInstitution(!!result);
    } catch {
      setIsInstitution(false);
    }
  }

  async function checkIsAdmin() {
    try {
      const adminAddr = await readContract("get_admin");
      setIsAdmin(publicKey === adminAddr);
    } catch {
      setIsAdmin(false);
    }
  }

  async function loadMyCerts() {
    setCertsLoading(true);
    try {
      const data = await readContract("get_certificates_by_owner", [
        new Address(publicKey).toScVal(),
      ]);
      setMyCerts(data || []);
    } catch {
      setMyCerts([]);
    } finally {
      setCertsLoading(false);
    }
  }

  async function handleVerify() {
    setVerifyError("");
    setVerifyResult(null);
    if (!verifyId.trim()) return;
    setVerifyLoading(true);
    try {
      const cert = await readContract("verify_certificate", [
        nativeToScVal(BigInt(verifyId.trim()), { type: "u64" }),
      ]);
      setVerifyResult(cert);
    } catch {
      setVerifyError("Certificate not found on the blockchain.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleIssue() {
    try {
      const res: any = await writeContract("issue_certificate", [
        new Address(publicKey).toScVal(),
        new Address(form.recipient).toScVal(),
        nativeToScVal(form.name, { type: "string" }),
        nativeToScVal(form.degree, { type: "string" }),
        nativeToScVal(form.institution, { type: "string" }),
      ]);
      setForm({ recipient: "", name: "", degree: "", institution: "" });
      if (res?.returnValue) {
        setIssuedCertId(res.returnValue.toString());
      }
      if (tab === "mycerts") loadMyCerts();
    } catch { }
  }

  async function handleRevoke(certId: any) {
    try {
      await writeContract("revoke_certificate", [
        new Address(publicKey).toScVal(),
        nativeToScVal(certId, { type: "u64" }),
      ]);
      loadMyCerts();
    } catch { }
  }

  async function handleRegisterInstitution() {
    if (!newInstAddr.trim()) return;
    try {
      await writeContract("register_institution", [
        new Address(publicKey as string).toScVal(),
        new Address(newInstAddr.trim()).toScVal(),
      ]);
      setNewInstAddr("");
    } catch { }
  }

  const canIssue = form.recipient && form.name && form.degree && form.institution;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Ijazah<span className="text-indigo-600">Verify</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2 text-sm pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stellar Testnet · Soroban Smart Contracts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isWalletConnected ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-4 pr-1 py-1 shadow-sm">
                  <div className="flex flex-col mr-2">
                    <span className="text-[10px] font-bold text-slate-400 leading-tight uppercase">Wallet</span>
                    <span className="text-xs font-mono font-medium text-slate-600 leading-tight">{shortAddr(publicKey)}</span>
                  </div>
                  {isInstitution && (
                    <Badge variant="outline" className="mr-1 bg-indigo-50 text-indigo-700 border-indigo-100 py-0.5">
                      Institution
                    </Badge>
                  )}
                  {isAdmin && (
                    <Badge variant="outline" className="mr-1 bg-amber-50 text-amber-700 border-amber-100 py-0.5">
                      Admin
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-red-500" onClick={disconnectWallet}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
                {xlmBalance && (
                  <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase px-2">
                    {parseFloat(xlmBalance).toFixed(2)} XLM
                  </span>
                )}
              </div>
            ) : (
              <Button onClick={connectWallet} disabled={walletLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-indigo-200 shadow-lg">
                {walletLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                Connect Wallet
              </Button>
            )}
          </div>
        </header>

        {/* ── Global Alerts ── */}
        <div className="space-y-4 mb-8">
          {walletError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Connection Error</AlertTitle>
              <AlertDescription>{walletError}</AlertDescription>
            </Alert>
          )}
          {txError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transaction Failed</AlertTitle>
              <AlertDescription>{txError}</AlertDescription>
            </Alert>
          )}
          {txSuccess && (
            <Alert className="border-emerald-200 bg-emerald-50/50 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Transaction confirmed on-chain!</AlertDescription>
            </Alert>
          )}
        </div>

        {/* ── Main Navigation ── */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px] h-12 p-1 bg-slate-200/50 rounded-xl">
            <TabsTrigger value="verify" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Verify
            </TabsTrigger>
            <TabsTrigger
              value="mycerts"
              disabled={!isWalletConnected}
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm disabled:opacity-50"
            >
              <History className="w-4 h-4 mr-2" />
              My Certs
            </TabsTrigger>
            <TabsTrigger
              value="issue"
              disabled={!isInstitution}
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Issue
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Tab: Verify ── */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/60 overflow-hidden">
              <CardHeader className="bg-white pb-8">
                <CardTitle className="text-2xl">On-Chain Verification</CardTitle>
                <CardDescription>
                  Verify any certificate instantly using its unique identification number.
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Enter Certificate ID (e.g. 1640431304247...)"
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:ring-indigo-500 rounded-xl font-mono text-sm"
                      value={verifyId}
                      onChange={e => setVerifyId(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleVerify()}
                    />
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={verifyLoading || !verifyId.trim()}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100"
                  >
                    {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Now"}
                  </Button>
                </div>

                {verifyError && (
                  <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    {verifyError}
                  </div>
                )}
              </CardContent>
            </Card>

            {verifyResult && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Result Found</h3>
                </div>
                <CertCard cert={verifyResult} canRevoke={false} onRevoke={() => { }} txLoading={false} />
              </div>
            )}
          </TabsContent>

          {/* ── Tab: My Certificates ── */}
          <TabsContent value="mycerts" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Owned Certificates</h3>
              <Badge variant="outline" className="text-slate-500">{myCerts.length} Total</Badge>
            </div>

            {certsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Querying blockchain...</p>
              </div>
            ) : myCerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-900 font-bold text-lg">No Certificates Found</h4>
                <p className="text-slate-500 max-w-xs mt-2">
                  There are no certificates registered for this wallet address on the network.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
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
          </TabsContent>

          {/* ── Tab: Issue ── */}
          <TabsContent value="issue" className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/60">
              <CardHeader>
                <CardTitle>Issue New Credentials</CardTitle>
                <CardDescription>
                  Create a permanent, verifiable certificate for a recipient.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-slate-700 font-semibold">Recipient Wallet Address</Label>
                  <Input
                    id="recipient"
                    placeholder="GABC...XYZ"
                    className="h-11 bg-slate-50 border-slate-200 rounded-lg font-mono"
                    value={form.recipient}
                    onChange={e => setForm({ ...form, recipient: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-semibold">Student Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      className="h-11 bg-slate-50 border-slate-200 rounded-lg"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="degree" className="text-slate-700 font-semibold">Degree / Certification</Label>
                    <Input
                      id="degree"
                      placeholder="Master of Science"
                      className="h-11 bg-slate-50 border-slate-200 rounded-lg"
                      value={form.degree}
                      onChange={e => setForm({ ...form, degree: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-slate-700 font-semibold">Issuing Institution</Label>
                  <Input
                    id="institution"
                    placeholder="Global Tech University"
                    className="h-11 bg-slate-50 border-slate-200 rounded-lg"
                    value={form.institution}
                    onChange={e => setForm({ ...form, institution: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end py-4">
                <Button
                  onClick={handleIssue}
                  disabled={txLoading || !canIssue}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-8 py-6 h-auto text-lg shadow-lg shadow-emerald-100"
                >
                  {txLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirming...</>
                  ) : (
                    <><Plus className="w-5 h-5 mr-2" /> Issue Certificate</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          {/* ── Tab: Admin ── */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/60">
                <CardHeader>
                  <CardTitle>Institution Management</CardTitle>
                  <CardDescription>
                    Authorize new wallet addresses to issue academic certificates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inst-addr" className="text-slate-700 font-semibold">Institution Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="inst-addr"
                        placeholder="GABC...XYZ"
                        className="h-11 bg-slate-50 border-slate-200 rounded-lg font-mono"
                        value={newInstAddr}
                        onChange={e => setNewInstAddr(e.target.value)}
                      />
                      <Button
                        onClick={handleRegisterInstitution}
                        disabled={txLoading || !newInstAddr.trim()}
                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                      >
                        {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400">
          <p className="text-xs font-medium tracking-widest uppercase">
            Built with Soroban & Stellar · Secure Academic Verification
          </p>
        </footer>
      </div>

      {/* ── Success Modal ── */}
      {issuedCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-2 bg-emerald-500" />
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Certificate Issued!</CardTitle>
              <CardDescription>
                The certificate has been successfully recorded on the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Your Certificate ID</Label>
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl group relative">
                  <code className="text-sm font-mono font-bold text-indigo-600 break-all flex-1">
                    {issuedCertId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:bg-white hover:text-indigo-600"
                    onClick={() => handleCopy(issuedCertId)}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 italic">
                Save this ID to verify the certificate authenticity anytime.
              </p>
            </CardContent>
            <CardFooter className="bg-slate-50 p-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12"
                onClick={() => {
                  setTab("verify");
                  setVerifyId(issuedCertId);
                  setIssuedCertId(null);
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Test Verify
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12"
                onClick={() => setIssuedCertId(null)}
              >
                Done
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
