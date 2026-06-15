import { Copy, Download, Gift, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TopBar from "../../components/layout/TopBar";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (values[i] ?? "").trim()));
    return row;
  });
}

function normalizeDate(value: string): string | undefined {
  if (!value) return undefined;
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

interface ImportedCoupon {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  expires_at?: string;
}

function couponsFromCSV(text: string): ImportedCoupon[] {
  return parseCSV(text)
    .map((row) => {
      const code = row["code"] || row["coupon_code"] || row["coupon code"] || "";
      if (!code) return null;

      const discountTypeRaw = (
        row["discount_type"] ||
        row["discount type"] ||
        row["type"] ||
        "percent"
      ).toLowerCase();
      const discountType: "percentage" | "fixed" = discountTypeRaw.includes("percent") ? "percentage" : "fixed";

      const discountValue = parseFloat(
        row["coupon_amount"] || row["amount"] || row["discount_value"] || row["discount value"] || "0"
      );

      const maxUsesRaw = row["usage_limit"] || row["usage limit"] || row["max_uses"] || "";
      const expiresRaw = row["expiry_date"] || row["expiry date"] || row["date_expires"] || row["expires_at"] || "";

      const coupon: ImportedCoupon = {
        code: code.toUpperCase(),
        description: row["description"] || undefined,
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: maxUsesRaw ? parseInt(maxUsesRaw, 10) : undefined,
        expires_at: normalizeDate(expiresRaw),
      };
      return coupon;
    })
    .filter((c): c is ImportedCoupon => c !== null && !isNaN(c.discount_value));
}

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [jsonImport, setJsonImport] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Bulk code generation (e.g. birthday gift codes)
  const [genPrefix, setGenPrefix] = useState("BDAY");
  const [genCount, setGenCount] = useState("10");
  const [genDescription, setGenDescription] = useState("Birthday gift");
  const [genDiscountType, setGenDiscountType] = useState<"percentage" | "fixed">("fixed");
  const [genDiscountValue, setGenDiscountValue] = useState("");
  const [genMaxUses, setGenMaxUses] = useState("1");
  const [genExpiresAt, setGenExpiresAt] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Restrict generated codes to a specific product (e.g. "Well Escape")
  const [genRestrictProduct, setGenRestrictProduct] = useState("");
  const [productMatches, setProductMatches] = useState<{ id: number; name: string }[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);

  useEffect(() => {
    if (!genRestrictProduct || genRestrictProduct === selectedProductName || !API_URL) {
      setProductMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setProductSearchLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/coupons/wc-products?search=${encodeURIComponent(genRestrictProduct)}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setProductMatches(data.products);
        }
      } catch (err) {
        console.error("Product search error:", err);
      } finally {
        setProductSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [genRestrictProduct, selectedProductName]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
    }
  };

  const handleCreateCoupon = async () => {
    if (!code || !discountValue || !API_URL) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coupons`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: code.toUpperCase(),
          description: description || undefined,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          max_uses: maxUses ? parseInt(maxUses) : undefined,
          expires_at: expiresAt || undefined,
        }),
      });

      if (res.ok) {
        setStatus({ type: "success", message: `Coupon ${code} created!` });
        setCode("");
        setDescription("");
        setDiscountValue("");
        setMaxUses("");
        setExpiresAt("");
        fetchCoupons();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Failed to create coupon" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (!genCount || !genDiscountValue || !API_URL) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coupons/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          count: parseInt(genCount),
          prefix: genPrefix || undefined,
          description: genDescription || undefined,
          discount_type: genDiscountType,
          discount_value: parseFloat(genDiscountValue),
          max_uses: genMaxUses ? parseInt(genMaxUses) : undefined,
          expires_at: genExpiresAt || undefined,
          restrict_product: selectedProductName || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedCodes(data.codes);
        setStatus({
          type: "success",
          message:
            data.failed > 0
              ? `Generated ${data.count} codes on the store (${data.failed} failed)`
              : `Generated ${data.count} codes on the store!`,
        });
        fetchCoupons();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to generate codes" });
    } finally {
      setLoading(false);
    }
  };

  const copyGeneratedCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    setStatus({ type: "success", message: "Codes copied to clipboard!" });
  };

  const downloadGeneratedCodes = () => {
    const blob = new Blob([generatedCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "birthday-coupon-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = async () => {
    if (!jsonImport || !API_URL) return;

    setLoading(true);
    try {
      const coupons = JSON.parse(jsonImport);
      const res = await fetch(`${API_URL}/api/coupons/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ coupons }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({
          type: "success",
          message: `Imported ${data.imported} coupons (${data.failed} failed)`,
        });
        setJsonImport("");
        fetchCoupons();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Invalid JSON format" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!API_URL || !confirm("Delete this coupon?")) return;

    try {
      await fetch(`${API_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      fetchCoupons();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !API_URL) return;

    setLoading(true);
    try {
      const text = await file.text();
      const parsed = couponsFromCSV(text);
      if (parsed.length === 0) {
        setStatus({ type: "error", message: "No valid coupons found in that file" });
        return;
      }

      const res = await fetch(`${API_URL}/api/coupons/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ coupons: parsed }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({
          type: "success",
          message: `Imported ${data.imported} coupons (${data.failed} failed)`,
        });
        fetchCoupons();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to read that CSV file" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        code: "WELCOME20",
        description: "20% off first purchase",
        discount_type: "percentage",
        discount_value: 20,
        max_uses: 100,
        expires_at: "2026-12-31",
      },
      {
        code: "SAVE10",
        description: "$10 off any order",
        discount_type: "fixed",
        discount_value: 10,
        max_uses: 50,
        expires_at: "2026-12-31",
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coupon-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <TopBar title="Coupon Management" subtitle="Create and manage promotional codes" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Generate Bulk Codes (e.g. birthday gifts) */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={16} className="text-brand-light" />
            <h2 className="text-sm font-bold text-text">Generate Bulk Codes</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Create a batch of unique one-time codes that all share the same discount — perfect for birthday gifts.
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={genPrefix}
                onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                placeholder="Prefix (e.g. BDAY)"
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
              <input
                type="number"
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                placeholder="How many codes"
                min={1}
                max={500}
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
            </div>
            <input
              type="text"
              value={genDescription}
              onChange={(e) => setGenDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={genDiscountType}
                onChange={(e) => setGenDiscountType(e.target.value as "percentage" | "fixed")}
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text focus:outline-none focus:border-brand-light"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input
                type="number"
                value={genDiscountValue}
                onChange={(e) => setGenDiscountValue(e.target.value)}
                placeholder="Amount"
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={genMaxUses}
                onChange={(e) => setGenMaxUses(e.target.value)}
                placeholder="Max uses per code"
                min={1}
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
              <input
                type="date"
                value={genExpiresAt}
                onChange={(e) => setGenExpiresAt(e.target.value)}
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text focus:outline-none focus:border-brand-light"
              />
            </div>
            <div>
              <input
                type="text"
                value={genRestrictProduct}
                onChange={(e) => {
                  setGenRestrictProduct(e.target.value);
                  setSelectedProductName(null);
                }}
                placeholder="Limit to a product (optional, e.g. Well Escape)"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
              {selectedProductName ? (
                <p className="text-[11px] text-brand-light mt-1.5">
                  Discount will only apply when "{selectedProductName}" is in the cart
                </p>
              ) : genRestrictProduct ? (
                <div className="mt-1.5 flex flex-col gap-1">
                  {productSearchLoading && <p className="text-[11px] text-text-dim">Searching store...</p>}
                  {!productSearchLoading && productMatches.length === 0 && (
                    <p className="text-[11px] text-text-dim">No matching products found</p>
                  )}
                  {productMatches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setGenRestrictProduct(p.name);
                        setSelectedProductName(p.name);
                        setProductMatches([]);
                      }}
                      className="text-left text-[11px] text-text-muted hover:text-brand-light px-2 py-1.5 rounded-card bg-surface-2 border border-border"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-text-dim mt-1.5">Leave blank for storewide (any purchase)</p>
              )}
            </div>
            <button
              onClick={handleGenerateCodes}
              disabled={loading || !genCount || !genDiscountValue}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Gift size={16} />
              Generate Codes
            </button>
          </div>

          {generatedCodes.length > 0 && (
            <div className="mt-3 bg-surface-2 border border-border rounded-card p-3">
              <p className="text-xs font-semibold text-text mb-2">
                {generatedCodes.length} code{generatedCodes.length === 1 ? "" : "s"} generated
              </p>
              <div className="max-h-40 overflow-y-auto mb-2">
                <div className="grid grid-cols-2 gap-1 font-mono text-xs text-text-muted">
                  {generatedCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyGeneratedCodes}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-text border border-border rounded-pill py-2"
                >
                  <Copy size={14} />
                  Copy All
                </button>
                <button
                  onClick={downloadGeneratedCodes}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-text border border-border rounded-pill py-2"
                >
                  <Download size={14} />
                  Download .txt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Single Coupon */}
        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-3">Create Single Coupon</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon Code (e.g. WELCOME20)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text focus:outline-none focus:border-brand-light"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Amount"
                className="bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />
            </div>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Max uses (optional)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text focus:outline-none focus:border-brand-light"
            />
            <button
              onClick={handleCreateCoupon}
              disabled={loading || !code || !discountValue}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Create Coupon
            </button>
          </div>
        </div>

        {/* CSV Import from Advanced Coupons */}
        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-2">Import from Advanced Coupons</h2>
          <p className="text-xs text-text-muted mb-3">
            Export your coupons as CSV from Advanced Coupons (WP Admin → Coupons → Export), then upload the file
            here.
          </p>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-50"
          >
            <Upload size={14} />
            Upload CSV
          </button>
        </div>

        {/* Bulk Import */}
        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-2">Bulk Import</h2>
          <p className="text-xs text-text-muted mb-3">Paste JSON array of coupons</p>
          <textarea
            value={jsonImport}
            onChange={(e) => setJsonImport(e.target.value)}
            placeholder='[{"code": "CODE1", "discount_type": "percentage", "discount_value": 20}, ...]'
            rows={4}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none font-mono mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-text border border-border rounded-pill py-2 disabled:opacity-50"
            >
              <Download size={14} />
              Template
            </button>
            <button
              onClick={handleBulkImport}
              disabled={loading || !jsonImport.trim()}
              className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50"
            >
              Import
            </button>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div
            className={`text-xs rounded-card p-3 ${
              status.type === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Coupons List */}
        <div>
          <h2 className="text-sm font-bold text-text mb-3">Active Coupons ({coupons.length})</h2>
          <div className="flex flex-col gap-2">
            {coupons.length === 0 ? (
              <p className="text-xs text-text-muted">No coupons yet</p>
            ) : (
              coupons.map((coupon) => (
                <div key={coupon.id} className="glass-card rounded-card p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text">{coupon.code}</p>
                    <p className="text-xs text-text-muted">
                      {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`} off
                      {coupon.description && ` • ${coupon.description}`}
                    </p>
                    {coupon.max_uses && (
                      <p className="text-xs text-text-dim">
                        {coupon.used_count}/{coupon.max_uses} used
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
