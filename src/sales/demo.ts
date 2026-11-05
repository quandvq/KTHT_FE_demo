import { catalog, type CatalogProduct } from "../data/catalog";

/** Versioned, deterministic sales seed. It only ever appends missing ids. */
export const SALES_SEED_VERSION = "2026-11-v4";
const KEY = "ktht.orders";
const MARKER = "ktht.sales-demo.version";
type DemoLine = { product: CatalogProduct; qty: number };
export type DemoOrder = {
  id: string; date: string; customer: string; phone: string; address: string;
  customerId: string; createdAt: string; updatedAt: string; paidAt?: string; refundedAt?: string;
  paymentMethod: string; shippingMethod: string; shippingFee: number; total: number;
  subtotal: number; flashDiscount: number; discount: number; coupon?: string;
  status: "Chờ xác nhận" | "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  deliveryStatus: "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED" | "RETURNED";
  refundAmount?: number; lines: DemoLine[];
};

let state = 20261106;
const rnd = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rnd() * items.length)]!;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (key: string, n: number) => `${key}T${pad(8 + (n % 11))}:${pad((n * 7) % 60)}:00.000+07:00`;
const read = (): DemoOrder[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };

export function ensureDemoSales(): DemoOrder[] {
  const existing = read();
  // Keep the repository's isolated browser smoke fixtures deterministic too.
  if (typeof window !== "undefined" && window.location.search.includes("e2e=")) return existing;
  // Reset PRNG on each call: the same version always produces the same records.
  state = 20261106;
  const dates = Array.from({ length: 37 }, (_, i) => i < 31 ? `2026-10-${pad(i + 1)}` : `2026-11-${pad(i - 30)}`);
  // Keep the sales volume realistic for the management dashboard: approximately 80M VND.
  const candidates = catalog.filter(p => p.price > 0 && p.price <= 150000);
  const group = (from: number, to: number) => {
    const rows = candidates.slice(from, to);
    return rows.length ? rows : candidates;
  };
  const rising = group(18, 28), steady = group(45, 67), declining = group(88, 98), highStock = group(115, 125);
  const all = [...rising, ...steady, ...declining, ...highStock].filter(Boolean);
  const customers = ["Minh Anh", "Hoàng Nam", "Thu Hà", "Quốc Bảo", "Kim Ngân", "Gia Hân", "Bảo Trâm", "Đức Anh", "Phương Linh", "Hải Đăng", "Thanh Thảo", "Ngọc Huyền", "Tuấn Kiệt", "Mai Phương", "Khánh Vy", "Anh Khoa", "Bích Ngọc", "Nhật Minh", "Thảo Nhi", "Quỳnh Anh", "Gia Bảo", "Trúc Ly", "Minh Khang", "Yến Nhi", "Đức Thành", "Hà My", "Khôi Nguyên", "Diệu Linh", "Tú Anh", "Hồng Phúc", "Bảo Yến", "Nam Phong"];
  const generated: DemoOrder[] = Array.from({ length: 720 }, (_, index) => {
    const dayIndex = Math.floor((index * 37) / 720);
    const key = dates[dayIndex]!;
    // More rising SKUs in early November, less declining SKUs in the same period.
    const pool = dayIndex >= 31 && index % 3 ? rising : index % 5 === 0 ? declining : index % 7 === 0 ? highStock : all;
    const roll = rnd();
    const count = roll < .78 ? 1 : roll < .97 ? 2 : 3, used = new Set<string>();
    const lines: DemoLine[] = [];
    while (lines.length < count) { const product = pick(pool); if (!used.has(product.id)) { used.add(product.id); lines.push({ product: { ...product }, qty: 1 + Math.floor(rnd() * 3) }); } }
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const productDiscount = index % 6 === 0 ? Math.round(subtotal * 0.05) : 0;
    const discount = index % 9 === 0 ? Math.min(30000, Math.round((subtotal - productDiscount) * 0.08)) : 0;
    const shippingFee = subtotal > 300000 ? 0 : 18000;
    const total = Math.max(0, subtotal - productDiscount - discount + shippingFee);
    const status = index % 29 === 0 ? "Đã hủy" : index % 31 === 0 ? "Chờ xác nhận" : index % 17 === 0 ? "Đang giao" : index % 13 === 0 ? "Đang xử lý" : "Hoàn tất";
    const completed = status === "Hoàn tất";
    const refunded = completed && index % 53 === 0;
    const createdAt = iso(key, index);
    return { id: `SIM-2611-${String(index + 1).padStart(4, "0")}`, date: new Intl.DateTimeFormat("vi-VN").format(new Date(`${key}T12:00:00Z`)), customer: pick(customers), phone: `09${String(10000000 + index).slice(-8)}`, address: "Phường Bến Nghé, TP. Hồ Chí Minh", customerId: `customer-${index % customers.length}`, createdAt, updatedAt: createdAt, ...(completed ? { paidAt: iso(key, index + 1) } : {}), ...(refunded ? { refundedAt: iso(key, index + 3), refundAmount: total } : {}), paymentMethod: index % 2 ? "COD" : "Ví điện tử", shippingMethod: "Giao tiêu chuẩn", shippingFee, subtotal, flashDiscount: productDiscount, discount, ...(discount ? { coupon: "SIMSALE" } : {}), total, status, paymentStatus: refunded ? "REFUNDED" : completed ? "PAID" : "UNPAID", deliveryStatus: status === "Đã hủy" ? "CANCELLED" : completed ? (refunded ? "RETURNED" : "DELIVERED") : status === "Đang giao" ? "SHIPPING" : "PENDING", lines };
  });
  const versionChanged = localStorage.getItem(MARKER) !== SALES_SEED_VERSION;
  const base = versionChanged ? existing.filter(order => !order.id.startsWith("SIM-")) : existing;
  const ids = new Set(base.map(order => order.id));
  const next = [...base, ...generated.filter(order => !ids.has(order.id))];
  if (next.length !== existing.length || versionChanged) {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(MARKER, SALES_SEED_VERSION);
  }
  return next;
}
