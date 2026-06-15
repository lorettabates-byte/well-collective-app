import { Download, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
