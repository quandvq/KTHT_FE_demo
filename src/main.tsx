import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import "@fontsource-variable/inter";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Package,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  Clock,
  LayoutDashboard,
  ClipboardList,
  LogOut,
  MessageCircle,
  X,
  BarChart3,
  Bot,
  Send,
  SlidersHorizontal,
  Pause,
  Play,
  WalletCards,
  ClipboardCheck,
  Tags,
  Warehouse,
  RotateCcw,
} from "lucide-react";
import "./styles.css";
import "./styles/storefront-theme.css";
import "./styles/v-pharma-brand.css";
import "./styles/catalog-images.css";
import "./styles/experience-polish.css";
import "./styles/auth.css";
import "./styles/customer-auth.css";
import "./styles/operations.css";
import "./styles/promotions.css";
import "./styles/chat-results.css";
import "./styles/order-detail.css";
import "./styles/order-management.css";
import "./styles/customer-footer.css";
import "./styles/reports.css";
import "./styles/report-chart-tooltip.css";
import "./styles/staff-chat.css";
import { assetUrl } from "./assets";
import "./styles/inventory.css";
import "./styles/feedback.css";
import "./styles/product-filters.css";
import "./styles/fonts.css";
import "./styles/staff-area.css";
import "./styles/layout-typography.css";
import "./styles/staff-header.css";
import "./styles/chat-faq.css";
import "./styles/health.css";
import "./styles/approvals.css";
import "./styles/master-completion.css";
import "./styles/friendly-dashboard.css";
import "./styles/text-polish.css";
import { catalog } from "./data/catalog";
import "./data/catalog-labels";
import { HealthArticlePage, HealthHomeSection, HealthHub } from "./health";
import {
  authenticate,
  registerCustomer,
  roleLabel,
  isStaff,
  isManagement,
  canManageOrders,
  canManageProducts,
  canManageWarehouse,
  canManageInventory,
  canManagePromotions,
  canAccessSupport,
  canAccessFinance,
  canAccessShipments,
  canAccessReports,
  canManageSystem,
  canSubmitProposals,
  canApproveProposals,
  accounts,
  currentSession,
  setAccountLocked,
  type Account,
  type Role,
} from "./auth";
import { answerChat, type ChatReply, type ChatAgent } from "./chat/catalog";
import { aggregateReports, dataAsOfKey, productReports, todayKey } from "./reports/analytics";
import { getInventory, LOW_STOCK_THRESHOLD } from "./inventory/store";
import {
  calculatePromotion,
  flashCampaign,
  flashPrice,
  getVouchers,
  getFlashCampaigns,
  isFlashActive,
  normalizeVoucher,
  recordVoucherUse,
  type AppliedVoucher,
  type Voucher,
  validateVoucher,
} from "./promotions";
import {
  ApprovalsPage,
  ProposalsPage,
  StaffNotifications,
} from "./approvals/pages";
import { countPendingProposals } from "./approvals/store";
import { ForecastPanel } from "./reports/ForecastPanel";
import { ensureDemoSales } from "./sales/demo";
import * as Workflow from './workflow/store';
import { WorkflowPage, DepartmentMenu, CustomerWorkflows, PublishedContent, useWorkflow } from './workflow/ui';

type Product = (typeof catalog)[number];
type CartLine = { product: Product; qty: number };
type Order = {
  id: string;
  date: string;
  customer: string;
  phone: string;
  address: string;
  province?: string;
  ward?: string;
  note?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingFee?: number;
  total: number;
  coupon?: string;
  discount?: number;
  customerId?: string;
  updatedAt?: string;
  createdAt?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  paymentStatus?: "UNPAID" | "PAID" | "REFUNDED";
  deliveryStatus?: "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED" | "RETURNED";
  subtotal?: number;
  flashDiscount?: number;
  voucherSnapshot?: {
    code: string;
    name: string;
    kind: string;
    value: number;
    discount: number;
    lineDiscounts: Record<string, number>;
  };
  status: "Chờ xác nhận" | "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy";
  lines: CartLine[];
};
let products: readonly Product[] = catalog;
const currency = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
const storage = {
  get: <T,>(key: string, fallback: T): T => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") as T;
    } catch {
      return fallback;
    }
  },
  set: (key: string, v: unknown) =>
    localStorage.setItem(key, JSON.stringify(v)),
};
const defaultRouteFor = (role: Role) => (role === "CUSTOMER" ? "/" : "/admin");
const safeNext = (value: string | null, role: Role) => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("#")
  )
    return defaultRouteFor(role);
  const path = value.split("?")[0];
  if (path.startsWith("/admin") && role === "CUSTOMER") return "/";
  if (
    (path.startsWith("/admin/approvals") ||
      path.startsWith("/admin/reports")) &&
    !canApproveProposals(role)
  )
    return "/admin";
  if (path.startsWith("/admin/proposals") && !canSubmitProposals(role))
    return "/admin";
  return value;
};
type CheckoutInfo = {
  customer: string;
  phone: string;
  address: string;
  province: string;
  ward: string;
  note: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingFee: number;
};
type AppState = {
  cart: CartLine[];
  add: (p: Product) => void;
  update: (id: string, q: number) => void;
  remove: (id: string) => void;
  orders: Order[];
  appliedVoucher: AppliedVoucher | null;
  applyVoucher: (code: string) => { error?: string; needsReplace?: boolean };
  removeVoucher: () => void;
  notify: (message: string) => void;
  requestConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => void;
  createOrder: (info: CheckoutInfo) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  user: Account | null;
  login: (
    email: string,
    password: string,
  ) => { error?: string; account?: Account };
  register: (
    name: string,
    email: string,
    password: string,
  ) => { error?: string; account?: Account };
  logout: () => void;
};
const AppContext = createContext<AppState>(null!);
const useApp = () => useContext(AppContext);
type ConfirmState = {
  title: string;
  message: string;
  onConfirm: () => void;
} | null;
function LoginRequiredModal({
  open,
  onClose,
  returnTo,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  returnTo: string;
  returnFocus: React.RefObject<HTMLElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose]);
  if (!open) return null;
  const close = () => {
    onClose();
    returnFocus.current?.focus();
  };
  const route = window.location.hash.replace(/^#/, "") || returnTo || "/";
  const login = () => {
    onClose();
    window.location.hash = "/login?next=" + encodeURIComponent(route);
  };
  return (
    <div className="app-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="dialog-close"
          aria-label="Đóng"
          onClick={close}
        >
          <X size={20} />
        </button>
        <h2 id="login-required-title">Vui lòng đăng nhập</h2>
        <p>Đăng nhập để thêm sản phẩm vào giỏ hàng và tiếp tục đặt hàng.</p>
        <div className="dialog-actions">
          <button className="secondary" onClick={close}>
            Để sau
          </button>
          <button className="primary" onClick={login}>
            Đăng nhập
          </button>
        </div>
      </section>
    </div>
  );
}
function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!state) return;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [state, onClose]);
  if (!state) return null;
  const accept = () => {
    state.onConfirm();
    onClose();
  };
  return (
    <div className="app-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="dialog-close"
          aria-label="Đóng"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 id="confirm-title">{state.title}</h2>
        <p>{state.message}</p>
        <div className="dialog-actions">
          <button className="secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="primary" onClick={accept}>
            Xác nhận
          </button>
        </div>
      </section>
    </div>
  );
}
function ToastViewport({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(id);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button aria-label="Đóng thông báo" onClick={onClose}>
        <X size={17} />
      </button>
    </div>
  );
}
function SessionSync() {
  const { logout } = useApp();
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "ktht.user" && event.newValue === null) logout();
      if (event.key === "ktht.orders" && event.newValue !== null)
        window.location.reload();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [logout]);
  return null;
}
function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState(() =>
    storage.get<CartLine[]>("ktht.cart", []),
  );
  const shared = useWorkflow();
  const orders = shared.orders as Order[];
  products = shared.products;
  const [user, setUser] = useState(() => currentSession());
  useEffect(() => {
    const changed=cart.some(line=>Workflow.priceOf(line.product.id,line.product.price)!==line.product.price);
    if(changed){
      const next=cart.map(line=>({...line,product:Workflow.currentProduct(line.product.id)||line.product}));
      storage.set('ktht.cart',next);setCart(next);
      setToast('Giá sản phẩm vừa được cập nhật. Vui lòng kiểm tra tổng tiền trước khi đặt hàng.');
    }
  },[shared.revision]);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    () => storage.get<AppliedVoucher | null>("ktht.cart.voucher", null),
  );
  const [loginModal, setLoginModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const returnTo =
    typeof window === "undefined"
      ? "/"
      : (window.location.hash.replace(/^#/, "") || "/");
  const persist = (next: CartLine[]) => {
    setCart(next);
    storage.set("ktht.cart", next);
  };
  const notify = (message: string) => setToast((current) => current || message);
  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => setConfirm({ title, message, onConfirm });
  const saveVoucher = (voucher: AppliedVoucher | null) => {
    setAppliedVoucher(voucher);
    storage.set("ktht.cart.voucher", voucher);
  };
  const add = (p: Product) => {
    if (!user) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setLoginModal(true);
      return;
    }
    const found = cart.find((x) => x.product.id === p.id);
    persist(
      found
        ? cart.map((x) =>
            x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x,
          )
        : [...cart, { product: p, qty: 1 }],
    );
    notify("Đã thêm sản phẩm vào giỏ hàng.");
  };
  const update = (id: string, q: number) =>
    persist(
      q < 1
        ? cart.filter((x) => x.product.id !== id)
        : cart.map((x) => (x.product.id === id ? { ...x, qty: q } : x)),
    );
  const remove = (id: string) =>
    requestConfirm(
      "Xóa sản phẩm?",
      "Sản phẩm sẽ được xóa khỏi giỏ hàng.",
      () => {
        persist(cart.filter((x) => x.product.id !== id));
        notify("Đã xóa sản phẩm khỏi giỏ hàng.");
      },
    );
  const applyVoucher = (raw: string) => {
    const code = normalizeVoucher(raw);
    const check = validateVoucher(code, cart, user?.role, user?.id);
    if ("error" in check) return { error: check.error };
    if (appliedVoucher && appliedVoucher.code !== code)
      return { needsReplace: true };
    saveVoucher({ code, voucherId: check.voucher.id });
    notify("Đã áp dụng mã khuyến mãi.");
    return {};
  };
  const removeVoucher = () => {
    saveVoucher(null);
    notify("Đã bỏ mã khuyến mãi.");
  };
  const createOrder = (info: CheckoutInfo) => {
    const totals = calculatePromotion(
      cart,
      appliedVoucher,
      user?.role,
      user?.id,
    );
    const voucher =
      appliedVoucher && !totals.message
        ? getVouchers().find((v) => v.id === appliedVoucher.voucherId)
        : undefined;
    if(totals.message)throw new Error(totals.message);
    const order: Order = {
      id: "DH-" + crypto.randomUUID(),
      date: new Date().toLocaleString("vi-VN"),
      ...info,
      customerId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toLocaleString("vi-VN"),
      total: totals.total + info.shippingFee,
      subtotal: totals.subtotal,
      flashDiscount: totals.flashDiscount,
      coupon: voucher?.code,
      discount: totals.voucherDiscount,
      voucherSnapshot: voucher
        ? {
            code: voucher.code,
            name: voucher.name,
            kind: voucher.kind,
            value: voucher.value,
            discount: totals.voucherDiscount,
            lineDiscounts: totals.lineVoucherDiscounts,
          }
        : undefined,
      status: "Chờ xác nhận",
      lines: cart.map((line) => ({
        ...line,
        product: { ...line.product, price: totals.linePrices[line.product.id] },
      })),
    };
    if (!user) throw new Error('Vui lòng đăng nhập.');
    Workflow.placeOrder(user, order as Workflow.Order);
    saveVoucher(null);
    persist([]);
    return order;
  };
  const updateOrderStatus = (id: string, status: Order['status']) => {
    if (!user) return;
    try {
      if (status === 'Đang xử lý') notify(Workflow.confirmOrder(user,id));
      else notify('Tiếp tục xử lý tại Giao nhận hoặc Yêu cầu hủy đơn.');
    } catch (error) { notify((error as Error).message); }
  };
  const login = (email: string, password: string) => {
    const result = authenticate(email, password);
    if (result.account) {
      setUser(result.account);
      storage.set("ktht.user", result.account);
      saveVoucher(null);
    }
    return result;
  };
  const register = (name: string, email: string, password: string) => {
    const result = registerCustomer(name, email, password);
    if (result.account) {
      setUser(result.account);
      storage.set("ktht.user", result.account);
      saveVoucher(null);
    }
    return result;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("ktht.user");
    saveVoucher(null);
  };
  return (
    <AppContext.Provider
      value={{
        cart,
        add,
        update,
        remove,
        orders,
        appliedVoucher,
        applyVoucher,
        removeVoucher,
        notify,
        requestConfirm,
        createOrder,
        updateOrderStatus,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
      <LoginRequiredModal
        open={loginModal}
        onClose={() => setLoginModal(false)}
        returnTo={returnTo}
        returnFocus={returnFocus}
      />
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      <ToastViewport message={toast} onClose={() => setToast(null)} />
    </AppContext.Provider>
  );
}
function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <Link
      className="brand v-brand"
      to={admin ? "/admin" : "/"}
      aria-label={admin ? "Khu vực nhân viên V-pharma" : "V-pharma"}
    >
      <span className="v-mark">V</span>
      <span>
        V-<b>PHARMA</b>
        {admin && <small>KHU VỰC NHÂN VIÊN</small>}
      </span>
    </Link>
  );
}
function ChatSuggestions({
  items,
  onPick,
}: {
  items: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="chat-suggestions">
      {items.map((item) => (
        <button type="button" key={item} onClick={() => onPick(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}
function ChatDemo() {
  const { user, orders } = useApp();
  const [open, setOpen] = useState(false),
    [question, setQuestion] = useState(""),
    [topic, setTopic] = useState<ChatAgent | undefined>(),
    [messages, setMessages] = useState<
      { by: "user" | "agent"; text: string; reply?: ChatReply }[]
    >([]);
  const composing = useRef(false);
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("vpharmacy-open-chat", openChat);
    return () => window.removeEventListener("vpharmacy-open-chat", openChat);
  }, []);
  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const all = Workflow.getState().tickets;
    const tickets = user
      ? all.filter((ticket) => ticket.customerId === user.id)
      : [];
    const mine = orders.filter((order) =>
      order.customerId
        ? order.customerId === user?.id
        : order.customer === user?.name,
    );
    const replies = answerChat(text, {
      role: user?.role,
      orders: mine,
      tickets,
      previousAgent: topic,
    });
    if (user?.role==='CUSTOMER') Workflow.createTicket(user,text);
    setTopic(replies[0]?.agent);
    setMessages((current) => [
      ...current,
      { by: "user", text },
      ...replies.map((reply) => ({
        by: "agent" as const,
        text: reply.text,
        reply,
      })),
    ]);
    setQuestion("");
  };
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!composing.current) ask(question);
  };
  const suggestions = ["Tìm sản phẩm", "Tra cứu đơn", "Đổi trả", "Ưu đãi"];
  return (
    <div className="chat-demo">
      {open && (
        <section className="chat-panel" aria-label="Trợ lý V-pharma">
          <div>
            <b>Trợ lý V-pharma</b>
            <button aria-label="Đóng chat" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && (
              <>
                <p className="chat-empty">
                  Chọn một gợi ý hoặc nhập câu hỏi để nhận hỗ trợ.
                </p>
                <ChatSuggestions items={suggestions} onPick={ask} />
              </>
            )}
            {messages.map((message, index) =>
              message.by === "user" ? (
                <p className="chat-user" key={index}>
                  <b>Bạn: </b>
                  {message.text}
                </p>
              ) : (
                <article className="chat-answer" key={index}>
                  {(index === 0 ||
                    messages[index - 1].by === "user" ||
                    messages[index - 1].reply?.agent !==
                      message.reply?.agent) && <b>{message.reply?.agent}</b>}
                  <p>{message.text}</p>
                  {message.reply?.products && (
                    <div className="chat-products">
                      {message.reply.products.map((item) => (
                        <article key={item.id}>
                          <ProductImage
                            p={item}
                            className="chat-product-image"
                          />
                          <div>
                            <b>{item.name}</b>
                            <span>
                              {currency(flashPrice(item))} ·{" "}
                              {item.saleUnit || "Đang cập nhật"}
                            </span>
                            <Link
                              to={"/products/" + item.id}
                              onClick={() => setOpen(false)}
                            >
                              Xem sản phẩm
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {message.reply?.records && (
                    <div className="chat-records">
                      {message.reply.records.map((record) => (
                        <p key={record.id}>
                          <b>{record.id}</b> · {record.primary}
                          <small>{record.secondary}</small>
                        </p>
                      ))}
                    </div>
                  )}
                  {message.reply?.link && (
                    <Link
                      className="chat-link"
                      to={message.reply.link.to}
                      onClick={() => setOpen(false)}
                    >
                      {message.reply.link.label}
                    </Link>
                  )}
                </article>
              ),
            )}
          </div>
          <form onSubmit={send}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
              placeholder="Nhập câu hỏi…"
            />
            <button type="submit">Gửi</button>
          </form>
          <small>Không tư vấn y tế.</small>
        </section>
      )}
      <button
        className="chat-trigger"
        aria-label="Mở Trợ lý V-pharma"
        onClick={() => setOpen(!open)}
      >
        <span>V</span>
        <MessageCircle size={22} />
      </button>
    </div>
  );
}

function PolicyDialog({
  kind,
  onClose,
}: {
  kind: "return" | "warranty";
  onClose: () => void;
}) {
  const title =
    kind === "return" ? "Chính sách đổi trả" : "Chính sách bảo hành";
  return (
    <div className="policy-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="policy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="plain policy-close"
          aria-label="Đóng"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 id="policy-title">{title}</h2>
        <p>Nội dung chính sách đang được cập nhật.</p>
        <p>
          Để được hỗ trợ theo đơn hàng và sản phẩm cụ thể, hãy gửi yêu cầu đến
          V-pharma.
        </p>
        <button
          className="primary"
          onClick={() => {
            onClose();
            window.dispatchEvent(new Event("vpharmacy-open-chat"));
          }}
        >
          Mở trợ lý V-pharma
        </button>
      </section>
    </div>
  );
}
function CustomerFooter({ user }: { user: Account | null }) {
  const [policy, setPolicy] = useState<"return" | "warranty" | null>(null);
  const openChat = () => window.dispatchEvent(new Event("vpharmacy-open-chat"));
  return (
    <>
      <footer className="customer-footer">
        <section>
          <Brand />
          <p>V-pharma · Nhà thuốc trực tuyến</p>
        </section>
        <section>
          <h2>Hỗ trợ khách hàng</h2>
          <Link to="/goc-suc-khoe">Góc sức khỏe</Link>
          <button onClick={() => setPolicy("return")}>
            Chính sách đổi trả
          </button>
          <button onClick={() => setPolicy("warranty")}>
            Chính sách bảo hành
          </button>
          <Link to={user ? "/account/orders" : "/login"}>Đơn hàng của tôi</Link>
        </section>
        <section>
          <h2>Liên hệ</h2>
          <button onClick={openChat}>Mở trợ lý V-pharma</button>
          <button onClick={openChat}>Gửi yêu cầu hỗ trợ</button>
        </section>
      </footer>
      {policy && <PolicyDialog kind={policy} onClose={() => setPolicy(null)} />}
    </>
  );
}
function CustomerLayout() {
  const { cart, user, logout } = useApp();
  const total = cart.reduce((sum, line) => sum + line.qty, 0);
  const storefrontStyle: React.CSSProperties & {
    "--home-background-image": string;
  } = {
    "--home-background-image": `url("${assetUrl("/images/home-meadow-background.jpg")}")`,
  };
  return (
    <div className="storefront" style={storefrontStyle}>
      <header>
        <Brand />
        <nav>
          <Link to="/products?category=Thuốc">Thuốc</Link>
          <Link to="/products?category=Thực">Thực phẩm bảo vệ sức khỏe</Link>
          <Link to="/products?category=Chăm">Chăm sóc cá nhân</Link>
          <Link to="/products?category=Thiết">Thiết bị y tế</Link>
          <Link to="/goc-suc-khoe">Góc sức khỏe</Link>
        </nav>
        <div className="head-actions">
          <Link aria-label="Giỏ hàng" to="/cart" className="icon">
            <ShoppingCart size={21} />
            <i>{total}</i>
          </Link>
          <Link to={user ? "/account" : "/login"} className="account">
            <User size={18} />
            {user?.name || "Đăng nhập"}
          </Link>
          {user && (
            <button className="customer-logout" onClick={logout}>
              <LogOut size={16} />
              Đăng xuất
            </button>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <CustomerFooter user={user} />
      <ChatDemo />
    </div>
  );
}
function Forbidden() {
  return (
    <section className="wrap page empty">
      <h1>403 — Không có quyền truy cập</h1>
      <p>
        Vai trò hiện tại không được phép mở khu vực này.
      </p>
      <Link className="primary" to="/">
        Về trang chủ
      </Link>
    </section>
  );
}
function StaffChat() {
  const { user, orders } = useApp();
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [topic, setTopic] = useState<ChatAgent | undefined>(),
    [messages, setMessages] = useState<
      { by: "staff" | "agent"; text: string; reply?: ChatReply }[]
    >([]);
  const composing = useRef(false);
  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || !user) return;
    const tickets = Workflow.getState().tickets;
    const replies = answerChat(text, {
      role: user.role,
      orders,
      tickets,
      previousAgent: topic,
    });
    setTopic(replies[0]?.agent);
    setMessages((current) => [
      ...current,
      { by: "staff", text },
      ...replies.map((reply) => ({
        by: "agent" as const,
        text: reply.text,
        reply,
      })),
    ]);
    setInput("");
  };
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!composing.current) ask(input);
  };
  const suggestions =
    user && isManagement(user.role)
      ? [
          "Doanh thu hôm nay",
          "Số đơn hôm nay",
          "Kiểm tra tồn kho",
          "Yêu cầu đổi trả",
        ]
      : ["Kiểm tra tồn kho", "Đơn chờ xác nhận", "Yêu cầu đổi trả"];
  return (
    <div className="staff-chat">
      {open && (
        <section className="staff-chat-panel" aria-label="Trợ lý V-pharma">
          <header>
            <div>
              <b>Trợ lý V-pharma</b>
              <small>Trợ lý V-pharma</small>
            </div>
            <button aria-label="Đóng chat" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>
          <div className="staff-chat-messages">
            {messages.length === 0 && (
              <ChatSuggestions items={suggestions} onPick={ask} />
            )}{" "}
            {messages.map((message, index) =>
              message.by === "staff" ? (
                <p className="staff-message" key={index}>
                  {message.text}
                </p>
              ) : (
                <article className="staff-answer" key={index}>
                  {(index === 0 ||
                    messages[index - 1].by === "staff" ||
                    messages[index - 1].reply?.agent !==
                      message.reply?.agent) && <b>{message.reply?.agent}</b>}
                  <p>{message.text}</p>
                  {message.reply?.records?.map((record) => (
                    <p className="staff-record" key={record.id}>
                      <b>{record.id}</b> · {record.primary}
                      <small>{record.secondary}</small>
                    </p>
                  ))}
                  {message.reply?.link && (
                    <Link
                      to={message.reply.link.to}
                      onClick={() => setOpen(false)}
                    >
                      {message.reply.link.label}
                    </Link>
                  )}
                </article>
              ),
            )}
          </div>
          <form onSubmit={send}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
              placeholder="Nhập câu hỏi…"
            />
            <button type="submit" aria-label="Gửi">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <button
        className="staff-chat-trigger"
        aria-label="Mở Trợ lý V-pharma"
        onClick={() => setOpen(!open)}
      >
        <Bot size={22} />
        <span>Trợ lý V-pharma</span>
      </button>
    </div>
  );
}
function StaffIdentity({ user }: { user: Account }) {
  const role = roleLabel[user.role];
  const initial = user.name.trim().charAt(0).toUpperCase() || "V";
  return (
    <div className="staff-identity">
      <span className="staff-avatar" aria-hidden="true">
        {initial}
      </span>
      <span>
        <b>{user.name}</b>
        <small>{role}</small>
      </span>
    </div>
  );
}

function AdminLayout() {
  const { user, logout } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!isStaff(user.role)) return <Forbidden />;
  const canOrders = ["ORDER_OPERATIONS", "ORDER_STAFF", "ECOM_MANAGER", "MANAGER", "ADMIN"].includes(user.role),
    productsAccess = canManageProducts(user.role),
    promotionsAccess = canManagePromotions(user.role),
    warehouseAccess = canManageWarehouse(user.role),
    shippingAccess = canAccessShipments(user.role),
    customerCare = canAccessSupport(user.role),
    finance = canAccessFinance(user.role),
    reportsAccess = canAccessReports(user.role),
    management = isManagement(user.role);
  const groups = [
    {
      title: "TỔNG QUAN",
      items: [{ to: "/admin", label: "Tổng quan", icon: LayoutDashboard }],
    },
    {
      title: "NGHIỆP VỤ",
      items: [
        ...(productsAccess
          ? [
              {
                to: "/admin/products",
                label: "Sản phẩm & Danh mục",
                icon: Package,
              },
            ]
          : []),
        ...(promotionsAccess && !management
          ? [
              {
                to: "/admin/promotions",
                label: "Khuyến mãi & Chiến dịch",
                icon: Tags,
              },
            ]
          : []),
        ...(warehouseAccess
          ? [{ to: "/admin/inventory", label: "Kho hàng", icon: Warehouse }]
          : []),
        ...(canOrders
          ? [
              {
                to: "/admin/orders",
                label: "Đơn hàng & Thanh toán",
                icon: ShoppingCart,
              },
            ]
          : []),
        ...(shippingAccess
          ? [{ to: "/admin/shipments", label: "Giao hàng", icon: Truck }]
          : []),
        ...(customerCare
          ? [{ to: "/admin/support", label: "Đổi trả & CSKH", icon: RotateCcw }]
          : []),
        ...(finance
          ? [
              {
                to: "/admin/finance",
                label: "Đối soát & Hóa đơn",
                icon: WalletCards,
              },
            ]
          : []),
      ],
    },
    {
      title: "QUẢN TRỊ",
      items: [
        ...(management
          ? [
              {
                to: "/admin/approvals",
                label: `Phê duyệt (${countPendingProposals()})`,
                icon: ClipboardCheck,
              },
            ]
          : []),
        ...(reportsAccess
          ? [
              {
                to: "/admin/reports",
                label: "Báo cáo & Thống kê",
                icon: BarChart3,
              },
            ]
          : []),
      ],
    },
  ].filter((group) => group.items.length);
  const pageTitle = location.pathname.includes("/products")
    ? "Sản phẩm & Danh mục"
    : location.pathname.includes("/promotions")
      ? "Khuyến mãi & Chiến dịch"
      : location.pathname.includes("/proposals")
        ? "Đề xuất"
    : location.pathname.includes("/approvals")
      ? "Phê duyệt"
      : location.pathname.includes("/orders")
        ? "Đơn hàng & Thanh toán"
        : location.pathname.includes("/shipments")
          ? "Giao hàng"
          : location.pathname.includes("/inventory")
            ? "Kho hàng"
            : location.pathname.includes("/support")
              ? "Đổi trả & CSKH"
              : location.pathname.includes("/finance")
                ? "Đối soát & Hóa đơn"
                : location.pathname.includes("/reports")
                  ? "Báo cáo & Thống kê"
                  : location.pathname.includes("/users")
                    ? "Tài khoản nhân viên"
                    : "Tổng quan";
  const close = () => setSidebarOpen(false);
  return (
    <div className="admin">
      <div className="admin-mobile-bar">
        <button
          className="admin-mobile-toggle"
          type="button"
          aria-label="Mở menu nhân viên"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
        <b>Khu vực nhân viên</b>
      </div>
      <div
        className={"admin-sidebar-backdrop " + (sidebarOpen ? "open" : "")}
        onClick={close}
      />
      <aside
        className={"staff-sidebar " + (sidebarOpen ? "open" : "")}
        aria-label="Điều hướng khu vực nhân viên"
      >
        <button
          className="sidebar-close"
          type="button"
          aria-label="Đóng menu"
          onClick={close}
        >
          <X size={21} />
        </button>
        <Brand admin />
        <nav className="staff-menu">
          <DepartmentMenu user={user} onClick={close}/>
        </nav>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut />
          Đăng xuất
        </button>
      </aside>
      <section className="admin-main">
        <div className="admin-header">
          <strong className="admin-current-page">{pageTitle}</strong>
          <Link to="/admin/workflow/overview">Thông báo ({sharedNotificationCount(user.id)})</Link>
          <details className="staff-account-menu">
            <summary>
              <StaffIdentity user={user} />
            </summary>
            <div>
              <small>{roleLabel[user.role]}</small>
              <button type="button" onClick={logout}>
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </details>
        </div>
        <Outlet />
      </section>
      <StaffChat />
    </div>
  );
}

function Finance() {
  const { user, orders, notify } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [reconciled, setReconciled] = useState<Record<string, string>>(() =>
    storage.get("ktht.finance.reconciled", {}),
  );
  if (!user || !canAccessFinance(user.role))
    return <Forbidden />;
  const filtered = orders.filter(
    (order) =>
      (order.id + " " + order.customer)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "Tất cả" ||
        (reconciled[order.id] || "Chờ đối soát") === status),
  );
  const revenue = orders
    .filter((order) => order.status === "Hoàn tất")
    .reduce((sum, order) => sum + order.total, 0);
  const unpaid = orders.filter(
    (order) => order.status !== "Hoàn tất" && order.status !== "Đã hủy",
  );
  const setOrderStatus = (id: string, value: string) => {
    const next = { ...reconciled, [id]: value };
    setReconciled(next);
    storage.set("ktht.finance.reconciled", next);
    notify("Đã cập nhật trạng thái đối soát.");
  };
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Tài chính</p>
      <h1>Đối soát & Hóa đơn</h1>
      <div className="metrics finance-metrics">
        <div>
          <span>Tổng doanh thu đã ghi nhận</span>
          <b>{currency(revenue)}</b>
        </div>
        <div>
          <span>Đơn đã thanh toán</span>
          <b>{orders.filter((order) => order.status === "Hoàn tất").length}</b>
        </div>
        <div>
          <span>Đơn chưa thanh toán</span>
          <b>{unpaid.length}</b>
        </div>
        <div>
          <span>COD đang chờ thu</span>
          <b>
            {
              orders.filter(
                (order) =>
                  (order.paymentMethod || "COD") === "COD" &&
                  order.status !== "Hoàn tất",
              ).length
            }
          </b>
        </div>
      </div>
      <section className="finance-chart">
        <h2>Doanh thu theo đơn đã hoàn tất</h2>
        <div>
          {orders.slice(0, 12).map((order) => (
            <span
              title={`${order.id}: ${currency(order.status === "Hoàn tất" ? order.total : 0)}`}
              style={{
                height: `${order.status === "Hoàn tất" ? Math.max(12, Math.min(100, order.total / 10000)) : 4}%`,
              }}
              key={order.id}
            />
          ))}
        </div>
      </section>
      <section className="finance-panel">
        <h2>Đối soát thanh toán</h2>
        <div className="finance-filters">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã đơn hoặc khách hàng"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>Tất cả</option>
            <option>Chờ đối soát</option>
            <option>Đã đối soát</option>
            <option>Cần kiểm tra</option>
          </select>
        </div>
        <div className="admin-table finance-table">
          <div className="tr th">
            <span>Mã đơn</span>
            <span>Khách hàng</span>
            <span>Tổng tiền</span>
            <span>Thanh toán</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>
          {filtered.map((order) => (
            <div className="tr" key={order.id}>
              <b>#{order.id}</b>
              <span>{order.customer}</span>
              <b>{currency(order.total)}</b>
              <span>{order.paymentMethod || "COD"}</span>
              <Status
                status={
                  (reconciled[order.id] || "Chờ đối soát") === "Đã đối soát"
                    ? "Hoàn tất"
                    : "Chờ xác nhận"
                }
              />
              <select
                aria-label={`Đối soát ${order.id}`}
                value={reconciled[order.id] || "Chờ đối soát"}
                onChange={(event) =>
                  setOrderStatus(order.id, event.target.value)
                }
              >
                <option>Chờ đối soát</option>
                <option>Đã đối soát</option>
                <option>Cần kiểm tra</option>
              </select>
            </div>
          ))}
          {!filtered.length && (
            <div className="empty">Không có giao dịch phù hợp.</div>
          )}
        </div>
      </section>
      <section className="finance-panel">
        <h2>Chứng từ</h2>
        <p className="muted">
          Bản xem trước chứng từ bán hàng nội bộ, không thay thế hóa đơn điện tử
          hợp pháp.
        </p>
        {orders.slice(0, 5).map((order) => (
          <div className="invoice-row" key={order.id}>
            <span>
              <b>CT-{order.id}</b>
              <small>{order.date}</small>
            </span>
            <span>{order.customer}</span>
            <b>{currency(order.total)}</b>
            <button
              className="secondary"
              type="button"
              onClick={() => window.print()}
            >
              In bản xem trước
            </button>
          </div>
        ))}
      </section>
    </>
  );
}

function ProductImage({ p, className }: { p: Product; className: string }) {
  const [currentSrc, setCurrentSrc] = useState(p.image || p.imageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(p.image || p.imageUrl);
    setFailed(false);
  }, [p.image, p.imageUrl]);

  const handleError = () => {
    if (currentSrc === p.image && p.imageUrl && p.imageUrl !== p.image) {
      setCurrentSrc(p.imageUrl);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className={className}>
      {currentSrc && !failed ? (
        <img
          className="catalog-image"
          src={assetUrl(currentSrc)}
          alt={p.name}
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <Package aria-label={p.name} />
      )}
    </div>
  );
}
function SalePrice({ p }: { p: Product }) {
  const sale = flashPrice(p);
  return (
    <div className="sale-price">
      <strong>{currency(sale)}</strong>
      {sale !== p.price && (
        <>
          <del>{currency(p.price)}</del>
          <small>Giảm {Math.round((1 - sale / p.price) * 100)}%</small>
        </>
      )}
    </div>
  );
}
function ProductCard({
  p,
  variant = "default",
}: {
  p: Product;
  variant?: "default" | "flash";
}) {
  const { add } = useApp();
  const sale = flashPrice(p);
  const discount = sale < p.price ? Math.round((1 - sale / p.price) * 100) : 0;
  const hasBrand = !!p.brand && p.brand !== "Đang cập nhật";
  return (
    <article
      className={
        "product-card " + (variant === "flash" ? "flash-product-card" : "")
      }
    >
      <Link
        to={"/products/" + p.id}
        className="product-card-link"
        aria-label={"Xem " + p.name}
      >
        <ProductImage p={p} className="product-image" />
        {variant === "flash" && discount > 0 && (
          <span className="flash-discount">-{discount}%</span>
        )}
        <div className="tags">
          <small>{p.category}</small>
        </div>
        <h3>{p.name}</h3>
      </Link>
      <p>
        {hasBrand && <>{p.brand} · </>}
        {p.saleUnit ? `Đơn vị bán: ${p.saleUnit}` : "Đơn vị bán đang cập nhật"}
      </p>
      <SalePrice p={p} />
      <button type="button" onClick={() => add(p)}>
        <ShoppingCart size={17} />
        {variant === "flash" ? "Chọn mua" : "Thêm vào giỏ hàng"}
      </button>
    </article>
  );
}
function HomeCarousel({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0),
    [manualPaused, setManualPaused] = useState(false),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [visible, setVisible] = useState(
      () => document.visibilityState === "visible",
    ),
    [reduced, setReduced] = useState(false),
    [failed, setFailed] = useState<Record<string, boolean>>({}),
    [fallbackAttempted, setFallbackAttempted] = useState<Record<string, boolean>>({});
  const startX = useRef<number | null>(null),
    swiped = useRef(false);
  const paused = manualPaused || hovered || focused || !visible || reduced;
  const goTo = (next: number) =>
    setActive((next + products.length) % products.length);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (paused || products.length < 2) return;
    const timer = window.setTimeout(() => goTo(active + 1), 3000);
    return () => window.clearTimeout(timer);
  }, [active, paused, products.length]);
  useEffect(() => {
    const next = products[(active + 1) % products.length];
    if (!next) return;
    const image = new Image();
    image.src = assetUrl(next.image || next.imageUrl);
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [active, products]);
  const pointerDown = (event: React.PointerEvent<HTMLElement>) => {
    startX.current = event.clientX;
    swiped.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    if (Math.abs(distance) > 42) {
      swiped.current = true;
      goTo(active + (distance < 0 ? 1 : -1));
    }
    startX.current = null;
  };
  if (!products.length) return null;
  return (
    <section
      className="home-carousel"
      aria-roledescription="carousel"
      aria-label="Sản phẩm nổi bật"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setFocused(false);
      }}
      onPointerDown={pointerDown}
      onPointerUp={pointerUp}
    >
      <div className="home-carousel-copy">
        <span>V-PHARMA</span>
        <h1>Chăm sóc sức khỏe cả gia đình</h1>
        <p>Khám phá thiết bị y tế và sản phẩm chăm sóc cá nhân.</p>
        <Link
          className="primary"
          to="/products?category=Thiết"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            if (swiped.current) {
              event.preventDefault();
              swiped.current = false;
            }
          }}
        >
          Khám phá ngay <ChevronRight size={18} />
        </Link>
      </div>
      <div className="home-carousel-product-window">
        <div
          className="home-carousel-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {products.map((product, index) => {
            const isActive = index === active;
            const source =
              !fallbackAttempted[product.id] && product.image
                ? product.image
                : product.imageUrl || product.image;
            return (
              <Link
                className="home-carousel-image"
                aria-hidden={!isActive}
                key={product.id}
                to={"/products/" + product.id}
                tabIndex={isActive ? 0 : -1}
                aria-label={"Xem " + product.name}
                onClick={(event) => {
                  if (swiped.current) {
                    event.preventDefault();
                    swiped.current = false;
                  }
                }}
              >
                {source && !failed[product.id] ? (
                  <img
                    src={assetUrl(source)}
                    alt={product.name}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    onError={() => {
                      if (
                        !fallbackAttempted[product.id] &&
                        product.imageUrl &&
                        product.imageUrl !== product.image
                      ) {
                        setFallbackAttempted((current) => ({
                          ...current,
                          [product.id]: true,
                        }));
                      } else {
                        setFailed((current) => ({
                          ...current,
                          [product.id]: true,
                        }));
                      }
                    }}
                  />
                ) : (
                  <Package aria-label={product.name} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="home-carousel-controls">
        <div
          className="home-carousel-dots"
          role="tablist"
          aria-label="Chọn slide"
        >
          {products.map((product, index) => (
            <button
              type="button"
              role="tab"
              key={product.id}
              aria-label={"Xem slide " + (index + 1)}
              aria-selected={index === active}
              className={index === active ? "active" : ""}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="home-carousel-toggle"
          onClick={() => setManualPaused((value) => !value)}
          aria-label={
            manualPaused
              ? "Tiếp tục tự chuyển slide"
              : "Tạm dừng tự chuyển slide"
          }
        >
          {manualPaused ? <Play size={16} /> : <Pause size={16} />}
          <span>{manualPaused ? "Tiếp tục" : "Tạm dừng"}</span>
        </button>
      </div>
    </section>
  );
}

function Home() {
  const [now, setNow] = useState(Date.now()),
    [homeQuery, setHomeQuery] = useState("");
  const flashRail = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const visibleCampaign = getFlashCampaigns().find(c=>now>=Date.parse(c.startsAt)&&now<=Date.parse(c.endsAt))||flashCampaign;
  const starts = Date.parse(visibleCampaign.startsAt),
    ends = Date.parse(visibleCampaign.endsAt),
    active = isFlashActive(now),
    upcoming = now < starts;
  const target = upcoming ? starts : ends,
    left = Math.max(0, target - now),
    countdown = [
      Math.floor(left / 3600000),
      Math.floor(left / 60000) % 60,
      Math.floor(left / 1000) % 60,
    ].map((value) => String(value).padStart(2, "0"));
  const flashItems = products.filter((product) =>
    getFlashCampaigns().some(c=>c.productIds.includes(product.id)&&now>=Date.parse(c.startsAt)&&now<=Date.parse(c.endsAt)),
  );
  const bannerProducts = products
    .filter(
      (product) =>
        !flashCampaign.productIds.includes(product.id) &&
        !!(product.image || product.imageUrl),
    )
    .slice(0, 4);
  const scrollFlash = (direction: number) =>
    flashRail.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  return (
    <>
      <HomeCarousel products={bannerProducts} />
      <section className="wrap home-content">
        <form
          className="home-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = homeQuery.trim();
            navigate(
              "/products" + (query ? "?q=" + encodeURIComponent(query) : ""),
            );
          }}
        >
          <label htmlFor="home-product-search">
            Tìm sản phẩm chăm sóc sức khỏe
          </label>
          <div>
            <Search size={22} />
            <input
              id="home-product-search"
              value={homeQuery}
              onChange={(event) => setHomeQuery(event.target.value)}
              placeholder="Tìm thuốc, vitamin, thiết bị y tế…"
            />
            <button type="submit">Tìm kiếm</button>
          </div>
        </form>
        <section
          className={"flash-sale " + (!active ? "ended" : "")}
          aria-label="Flash Sale"
        >
          <header className="flash-heading">
            <div>
              <span>Ưu đãi có thời hạn</span>
              <h2>FLASH SALE GIÁ TỐT</h2>
            </div>
            <Link to="/products?sale=flash">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </header>
          <div className="flash-countdown">
            <span>{upcoming ? "Bắt đầu sau" : "Kết thúc sau"}</span>
            {active || upcoming ? (
              <div
                aria-label={`${countdown[0]} giờ ${countdown[1]} phút ${countdown[2]} giây`}
              >
                <b>{countdown[0]}</b>
                <i>:</i>
                <b>{countdown[1]}</b>
                <i>:</i>
                <b>{countdown[2]}</b>
              </div>
            ) : (
              <strong>Chương trình đã kết thúc</strong>
            )}
          </div>
          {flashItems.length ? (
            <div className="flash-products-wrap">
              <button
                className="flash-nav flash-nav-prev"
                type="button"
                onClick={() => scrollFlash(-1)}
                aria-label="Xem sản phẩm Flash Sale trước"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flash-items" ref={flashRail}>
                {flashItems.map((product) => (
                  <ProductCard key={product.id} p={product} variant="flash" />
                ))}
              </div>
              <button
                className="flash-nav flash-nav-next"
                type="button"
                onClick={() => scrollFlash(1)}
                aria-label="Xem sản phẩm Flash Sale tiếp theo"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <p className="flash-empty">
              Chưa có sản phẩm thuộc chương trình Flash Sale.
            </p>
          )}
          <footer className="flash-footer">
            <Link to="/products?sale=flash">
              Xem tất cả sản phẩm Flash Sale <ChevronRight size={16} />
            </Link>
          </footer>
        </section>
        <div className="section-title">
          <div>
            <span>GỢI Ý HÔM NAY</span>
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <Link to="/products">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} p={product} />
          ))}
        </div>
        <HealthHomeSection />
        <PublishedContent kind="BANNER"/>
        <PublishedContent kind="ARTICLE"/>
      </section>
    </>
  );
}

type PriceRange = "under" | "mid" | "over" | "";
const normalText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
const onlyMoney = (value: string) => value.replace(/\D/g, "");

function ProductFilterPanel({
  range,
  min,
  max,
  onApply,
  onReset,
  buttonLabel = "Áp dụng bộ lọc",
}: {
  range: PriceRange;
  min: string;
  max: string;
  onApply: (next: { range: PriceRange; min: string; max: string }) => void;
  onReset: () => void;
  buttonLabel?: string;
}) {
  const [draftRange, setDraftRange] = useState<PriceRange>(range),
    [draftMin, setDraftMin] = useState(min),
    [draftMax, setDraftMax] = useState(max);
  useEffect(() => {
    setDraftRange(range);
    setDraftMin(min);
    setDraftMax(max);
  }, [range, min, max]);
  const error =
    draftMin && draftMax && Number(draftMin) > Number(draftMax)
      ? "Giá tối thiểu không được lớn hơn giá tối đa."
      : "";
  const choose = (next: PriceRange) => {
    setDraftRange(next);
    if (next === "under") {
      setDraftMin("");
      setDraftMax("99999");
    } else if (next === "mid") {
      setDraftMin("100000");
      setDraftMax("300000");
    } else if (next === "over") {
      setDraftMin("300001");
      setDraftMax("");
    } else {
      setDraftMin("");
      setDraftMax("");
    }
  };
  const changeMoney = (value: string, setter: (value: string) => void) => {
    setter(onlyMoney(value));
    setDraftRange("");
  };
  return (
    <aside className="product-filter-panel">
      <div className="filter-panel-title">
        <h2>Bộ lọc</h2>
        <button type="button" onClick={onReset}>
          Thiết lập lại
        </button>
      </div>
      <fieldset>
        <legend>Khoảng giá</legend>
        {(
          [
            ["under", "Dưới 100.000 ₫"],
            ["mid", "100.000 ₫ – 300.000 ₫"],
            ["over", "Trên 300.000 ₫"],
          ] as [PriceRange, string][]
        ).map(([value, label]) => (
          <label className="radio-option" key={value}>
            <input
              type="radio"
              name="price-range"
              checked={draftRange === value}
              onChange={() => choose(value)}
            />
            {label}
          </label>
        ))}
        <div className="price-inputs">
          <label>
            Tối thiểu
            <input
              inputMode="numeric"
              value={draftMin ? Number(draftMin).toLocaleString("vi-VN") : ""}
              onChange={(event) => changeMoney(event.target.value, setDraftMin)}
              placeholder="Tối thiểu"
            />
          </label>
          <label>
            Tối đa
            <input
              inputMode="numeric"
              value={draftMax ? Number(draftMax).toLocaleString("vi-VN") : ""}
              onChange={(event) => changeMoney(event.target.value, setDraftMax)}
              placeholder="Không giới hạn"
            />
          </label>
        </div>
        {error && (
          <small className="filter-error" role="alert">
            {error}
          </small>
        )}
      </fieldset>
      <button
        type="button"
        className="filter-apply"
        disabled={!!error}
        onClick={() =>
          onApply({ range: draftRange, min: draftMin, max: draftMax })
        }
      >
        {buttonLabel}
      </button>
    </aside>
  );
}

function Products() {
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const query = params.get("q") || "",
    category = params.get("category") || "",
    sale = params.get("sale") || "",
    sort = params.get("sort") || "default";
  const range = (params.get("price") || "") as PriceRange,
    min = params.get("min") || "",
    max = params.get("max") || "";
  const [searchDraft, setSearchDraft] = useState(query);
  const composing = useRef(false),
    searchTimer = useRef<number | undefined>(undefined);
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!Object.prototype.hasOwnProperty.call(patch, "page"))
      next.set("page", "1");
    setParams(next);
  };
  useEffect(() => {
    if (!composing.current) setSearchDraft(query);
  }, [query]);
  useEffect(() => {
    if (!params.has("brands")) return;
    const next = new URLSearchParams(params);
    next.delete("brands");
    setParams(next, { replace: true });
  }, [params, setParams]);
  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    },
    [],
  );
  const commitSearch = (value: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    update({ q: value || undefined });
  };
  const handleSearchChange = (value: string) => {
    setSearchDraft(value);
    if (composing.current) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => commitSearch(value), 220);
  };
  const apply = (next: { range: PriceRange; min: string; max: string }) => {
    update({
      price: next.range || undefined,
      min: next.min || undefined,
      max: next.max || undefined,
    });
    setDrawer(false);
  };
  const reset = () => {
    update({ price: undefined, min: undefined, max: undefined });
    setDrawer(false);
  };
  const currentPrice = (product: Product) => flashPrice(product);
  let data = products.filter((product) => {
    const text = normalText(
      product.name +
        " " +
        product.brand +
        " " +
        product.category +
        " " +
        product.tags.join(" "),
    );
    const price = currentPrice(product);
    return (
      (!query || text.includes(normalText(query))) &&
      (!category || product.category.includes(category)) &&
      (!sale ||
        sale !== "flash" ||
        flashPrice(product) < product.price) &&
      (!min || price >= Number(min)) &&
      (!max || price <= Number(max))
    );
  });
  if (sort === "asc")
    data = [...data].sort((a, b) => currentPrice(a) - currentPrice(b));
  if (sort === "desc")
    data = [...data].sort((a, b) => currentPrice(b) - currentPrice(a));
  const pageSize = 12,
    totalPages = Math.max(1, Math.ceil(data.length / pageSize)),
    page = Math.min(Math.max(1, Number(params.get("page") || 1)), totalPages),
    items = data.slice((page - 1) * pageSize, page * pageSize);
  const chips = [
    query && {
      id: "q",
      label: "Từ khóa: " + query,
      clear: () => update({ q: undefined }),
    },
    category && {
      id: "category",
      label: "Danh mục: " + category,
      clear: () => update({ category: undefined }),
    },
    sale === "flash" && {
      id: "sale",
      label: "Flash Sale",
      clear: () => update({ sale: undefined }),
    },
    (min || max) && {
      id: "price",
      label:
        range === "under"
          ? "Dưới 100.000 ₫"
          : range === "mid"
            ? "100.000 ₫ – 300.000 ₫"
            : range === "over"
              ? "Trên 300.000 ₫"
              : (min ? "Từ " + currency(Number(min)) : "") +
                (min && max ? " – " : "") +
                (max ? "Đến " + currency(Number(max)) : ""),
      clear: () => update({ price: undefined, min: undefined, max: undefined }),
    },
  ].filter(Boolean) as { id: string; label: string; clear: () => void }[];
  const filterProps = { range, min, max, onApply: apply, onReset: reset };
  return (
    <section className="wrap page products-page">
      <p className="crumb">Trang chủ / Sản phẩm</p>
      <div className="products-heading">
        <h1>Sản phẩm chăm sóc sức khỏe</h1>
        <button
          className="mobile-filter-button"
          type="button"
          onClick={() => setDrawer(true)}
        >
          <SlidersHorizontal size={18} />
          Bộ lọc{chips.length > 0 && <b>{chips.length}</b>}
        </button>
      </div>
      <div className="products-toolbar">
        <div>
          <Search />
          <input
            value={searchDraft}
            onChange={(event) => handleSearchChange(event.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              setSearchDraft(event.currentTarget.value);
              commitSearch(event.currentTarget.value);
            }}
            placeholder="Tìm thuốc, vitamin, thiết bị y tế…"
          />
        </div>
        <select
          value={sort}
          onChange={(event) =>
            update({
              sort:
                event.target.value === "default"
                  ? undefined
                  : event.target.value,
            })
          }
        >
          <option value="default">Sắp xếp mặc định</option>
          <option value="asc">Giá tăng dần</option>
          <option value="desc">Giá giảm dần</option>
        </select>
      </div>
      <div className="products-layout">
        <div className="desktop-filter">
          <ProductFilterPanel {...filterProps} />
        </div>
        <div>
          <div className="results-summary">
            <p>
              Tìm thấy <b>{data.length}</b> sản phẩm
            </p>
            <div className="filter-chips">
              {chips.map((chip) => (
                <button key={chip.id} type="button" onClick={chip.clear}>
                  {chip.label}
                  <X size={13} />
                </button>
              ))}
            </div>
          </div>
          {items.length ? (
            <>
              <div className="grid">
                {items.map((product) => (
                  <ProductCard key={product.id} p={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Phân trang">
                  {page > 1 && (
                    <button
                      type="button"
                      className="pagination-nav"
                      aria-label="Trang trước"
                      onClick={() => update({ page: String(page - 1) })}
                    >
                      ‹
                    </button>
                  )}
                  {(() => {
                    const items: (number | string)[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) items.push(i);
                    } else {
                      items.push(1);
                      if (page > 3) items.push("…");
                      const start = Math.max(2, page - 1);
                      const end = Math.min(totalPages - 1, page + 1);
                      for (let i = start; i <= end; i++) items.push(i);
                      if (page < totalPages - 2) items.push("…");
                      items.push(totalPages);
                    }
                    return items.map((val, idx) =>
                      typeof val === "number" ? (
                        <button
                          type="button"
                          className={val === page ? "active" : ""}
                          aria-current={val === page ? "page" : undefined}
                          onClick={() => update({ page: String(val) })}
                          key={val}
                        >
                          {val}
                        </button>
                      ) : (
                        <span className="pagination-ellipsis" key={`ellipsis-${idx}`}>
                          …
                        </span>
                      ),
                    );
                  })()}
                  {page < totalPages && (
                    <button
                      type="button"
                      className="pagination-nav"
                      aria-label="Trang sau"
                      onClick={() => update({ page: String(page + 1) })}
                    >
                      ›
                    </button>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="empty">
              <p>Không tìm thấy sản phẩm phù hợp.</p>
              {(min || max) && (
                <button className="primary" onClick={reset}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {drawer && (
        <div
          className="filter-drawer-backdrop"
          role="presentation"
          onMouseDown={() => setDrawer(false)}
        >
          <div
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc sản phẩm"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              aria-label="Đóng"
              onClick={() => setDrawer(false)}
            >
              <X size={20} />
            </button>
            <ProductFilterPanel {...filterProps} buttonLabel="Xem kết quả" />
          </div>
        </div>
      )}
    </section>
  );
}

function Detail() {
  const { id } = useParams();
  const p = products.find((x) => x.id === id);
  const { add } = useApp();
  if (!p) return <Navigate to="/products" />;
  return (
    <section className="wrap page">
      <p className="crumb">Sản phẩm / {p.category}</p>
      <div className="detail">
        <div className="detail-image">
          <ProductImage p={p} className="catalog-image" />
        </div>
        <div>
          <span className="tags">
            <small>{p.category}</small>
          </span>
          <h1>{p.name}</h1>
          <p>{p.saleUnit || "Đang cập nhật"}</p>
          <SalePrice p={p} />
          <p className="description">
            {p.description || "Thông tin mô tả đang cập nhật."}
          </p>
          <button className="primary" onClick={() => add(p)}>
            <ShoppingCart size={18} />
            Thêm vào giỏ hàng
          </button>
          <p className="disclaimer">
            Nguồn ghi nhận: {p.checkedDate || "Đang cập nhật"} ·{" "}
            {p.priceStatus || "Giá hiển thị"}.
          </p>
        </div>
      </div>
    </section>
  );
}
function VoucherBox() {
  const { appliedVoucher, applyVoucher, removeVoucher, requestConfirm } =
    useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const apply = () => {
    const result = applyVoucher(code);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsReplace) {
      requestConfirm(
        "Thay mã khuyến mãi?",
        "Mỗi đơn chỉ sử dụng một mã. Mã hiện tại sẽ được thay thế.",
        () => {
          removeVoucher();
          const again = applyVoucher(code);
          if (again.error) setError(again.error);
          else {
            setError("");
            setCode("");
          }
        },
      );
      return;
    } else {
      setError("");
      setCode("");
    }
  };
  const voucher =
    appliedVoucher &&
    getVouchers().find((v) => v.id === appliedVoucher.voucherId);
  return (
    <div className="coupon-box">
      <b>Mã khuyến mãi</b>
      {appliedVoucher && voucher ? (
        <div className="applied-voucher">
          <span>
            <b>{voucher.code}</b> · {voucher.name}
          </span>
          <button type="button" onClick={removeVoucher}>
            Bỏ mã
          </button>
        </div>
      ) : (
        <>
          <div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: VPHARMA50"
            />
            <button type="button" onClick={apply}>
              Áp dụng
            </button>
          </div>
          <small>Ngưỡng áp dụng được tính trên giá gốc trước Flash Sale. Mỗi đơn tối đa một mã.</small>
        </>
      )}
      {error && (
        <small className="coupon-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
function Summary({ children }: { children: React.ReactNode }) {
  const { cart, appliedVoucher, user } = useApp();
  const totals = calculatePromotion(cart, appliedVoucher, user?.role, user?.id);
  return (
    <aside className="summary">
      <h3>Tóm tắt đơn hàng</h3>
      <p>
        <span>Tạm tính</span>
        <b>{currency(totals.subtotal)}</b>
      </p>
      {totals.flashDiscount > 0 && (
        <p>
          <span>Ưu đãi Flash Sale</span>
          <b>-{currency(totals.flashDiscount)}</b>
        </p>
      )}
      <p>
        <span>Giảm mã</span>
        <b>-{currency(totals.voucherDiscount)}</b>
      </p>
      <p>
        <span>Phí giao hàng</span>
        <b>Miễn phí</b>
      </p>
      <hr />
      <h3>
        <span>Tổng cộng</span>
        <b>{currency(totals.total)}</b>
      </h3>
      {totals.message && (
        <p className="coupon-error">Mã đã được bỏ: {totals.message}</p>
      )}
      {children}
    </aside>
  );
}
function Cart() {
  const { cart, update, remove } = useApp();
  const { appliedVoucher, user } = useApp();
  const totals = calculatePromotion(cart, appliedVoucher, user?.role, user?.id);
  if (!cart.length)
    return (
      <section className="wrap page empty">
        <ShoppingCart size={44} />
        <h2>Giỏ hàng đang trống</h2>
        <Link className="primary" to="/products">
          Tiếp tục mua sắm
        </Link>
      </section>
    );
  return (
    <section className="wrap page cart">
      <h1>Giỏ hàng của bạn</h1>
      <div className="cart-layout">
        <div>
          {cart.map((x) => (
            <div className="cart-line" key={x.product.id}>
              <ProductImage p={x.product} className="mini-image" />
              <div>
                <b>{x.product.name}</b>
                <p>
                  {currency(totals.linePrices[x.product.id])}
                  {totals.linePrices[x.product.id] !== x.product.price && (
                    <del> {currency(x.product.price)}</del>
                  )}
                </p>
              </div>
              <div className="quantity">
                <button onClick={() => update(x.product.id, x.qty - 1)}>
                  <Minus />
                </button>
                <span>{x.qty}</span>
                <button onClick={() => update(x.product.id, x.qty + 1)}>
                  <Plus />
                </button>
              </div>
              <b>{currency(x.qty * totals.linePrices[x.product.id])}</b>
              <button className="plain" onClick={() => remove(x.product.id)}>
                <Trash2 />
              </button>
            </div>
          ))}
          <VoucherBox />
        </div>
        <Summary>
          <Link className="primary full" to="/checkout">
            Tiến hành đặt hàng
          </Link>
        </Summary>
      </div>
    </section>
  );
}
function Checkout() {
  const { cart, createOrder, user, appliedVoucher, notify } = useApp();
  const nav = useNavigate();
  const placingOrder = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer: user?.name || "",
    phone: "",
    province: "",
    ward: "",
    address: "",
    note: "",
    otherRecipient: false,
    saveAddress: true,
    paymentMethod: "COD",
    shippingMethod: "Giao hàng tiêu chuẩn",
    shippingFee: 0,
  });
  const totals = calculatePromotion(cart, appliedVoucher, user?.role, user?.id);
  if (!user)
    return (
      <section className="wrap page empty">
        <ShoppingCart size={44} />
        <h2>Đăng nhập để tiếp tục đặt hàng</h2>
        <p>Vui lòng đăng nhập trước khi thanh toán đơn hàng.</p>
        <Link className="primary" to="/login">
          Đăng nhập
        </Link>
      </section>
    );
  if (!cart.length && !placingOrder.current) return <Navigate to="/cart" />;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (placingOrder.current) return;
    if (
      !form.customer.trim() ||
      !/^[0-9]{9,11}$/.test(form.phone) ||
      !form.province ||
      !form.ward ||
      !form.address.trim()
    ) {
      notify("Vui lòng kiểm tra đầy đủ thông tin nhận hàng.");
      return;
    }
    if (totals.message) {
      notify(
        "Giỏ hàng đã thay đổi: " + totals.message + " Vui lòng kiểm tra lại.",
      );
      return;
    }
    if (form.saveAddress)
      storage.set("ktht.customer.address", {
        customer: form.customer,
        phone: form.phone,
        province: form.province,
        ward: form.ward,
        address: form.address,
      });
    placingOrder.current = true;
    setSubmitting(true);
    try {
      const order = createOrder(form);
      nav("/checkout/result/" + order.id, { replace: true });
    } catch {
      placingOrder.current = false;
      setSubmitting(false);
      notify("Không thể lưu đơn hàng. Vui lòng thử lại.");
    }
  };
  return (
    <section className="wrap page checkout-page">
      <div className="checkout-title">
        <div>
          <span>THANH TOÁN AN TOÀN</span>
          <h1>Xác nhận đặt hàng</h1>
          <p>Kiểm tra thông tin nhận hàng và lựa chọn phương thức phù hợp.</p>
        </div>
        <ShieldCheck size={38} />
      </div>
      <div className="checkout-layout">
        <form className="form checkout-form" onSubmit={submit}>
          <section>
            <h2>1. Thông tin người nhận</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={form.otherRecipient}
                onChange={(e) =>
                  setForm({ ...form, otherRecipient: e.target.checked })
                }
              />
              Giao cho người nhận khác
            </label>
            <div className="form-grid">
              <label>
                Họ và tên người nhận
                <input
                  required
                  value={form.customer}
                  onChange={(e) =>
                    setForm({ ...form, customer: e.target.value })
                  }
                />
              </label>
              <label>
                Số điện thoại
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{9,11}"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </label>
              <label>
                Tỉnh/Thành phố
                <select
                  required
                  value={form.province}
                  onChange={(e) =>
                    setForm({ ...form, province: e.target.value, ward: "" })
                  }
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  <option>TP. Hồ Chí Minh</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                  <option>Cần Thơ</option>
                </select>
              </label>
              <label>
                Phường/Xã
                <select
                  required
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                >
                  <option value="">Chọn Phường/Xã</option>
                  <option>Phường Trung Tâm</option>
                  <option>Phường An Bình</option>
                  <option>Phường Hòa Phú</option>
                </select>
              </label>
            </div>
            <label>
              Địa chỉ chi tiết
              <textarea
                required
                placeholder="Số nhà, tên đường, tòa nhà…"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label>
              Ghi chú giao hàng (không bắt buộc)
              <textarea
                placeholder="Ví dụ: Gọi trước khi giao"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.saveAddress}
                onChange={(e) =>
                  setForm({ ...form, saveAddress: e.target.checked })
                }
              />
              Lưu địa chỉ này cho lần mua sau
            </label>
          </section>
          <section>
            <h2>2. Phương thức giao hàng</h2>
            <div className="choice-grid">
              <label
                className={
                  form.shippingMethod === "Giao hàng tiêu chuẩn"
                    ? "choice active"
                    : "choice"
                }
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={form.shippingMethod === "Giao hàng tiêu chuẩn"}
                  onChange={() =>
                    setForm({
                      ...form,
                      shippingMethod: "Giao hàng tiêu chuẩn",
                      shippingFee: 0,
                    })
                  }
                />
                <span>
                  <b>Giao hàng tiêu chuẩn</b>
                  <small>2–4 ngày · Miễn phí</small>
                </span>
              </label>
              <label
                className={
                  form.shippingMethod === "Giao hàng nhanh"
                    ? "choice active"
                    : "choice"
                }
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={form.shippingMethod === "Giao hàng nhanh"}
                  onChange={() =>
                    setForm({
                      ...form,
                      shippingMethod: "Giao hàng nhanh",
                      shippingFee: 30000,
                    })
                  }
                />
                <span>
                  <b>Giao hàng nhanh</b>
                  <small>Trong 24 giờ · {currency(30000)}</small>
                </span>
              </label>
            </div>
          </section>
          <section>
            <h2>3. Phương thức thanh toán</h2>
            <div className="choice-grid payment-choices">
              {["COD", "MoMo", "ZaloPay", "Thẻ ATM"].map((method) => (
                <label
                  className={
                    form.paymentMethod === method ? "choice active" : "choice"
                  }
                  key={method}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={form.paymentMethod === method}
                    onChange={() => setForm({ ...form, paymentMethod: method })}
                  />
                  <span>
                    <b>
                      {method === "COD" ? "Thanh toán khi nhận hàng" : method}
                    </b>
                    <small>
                      {method === "COD"
                        ? "Trả tiền khi nhận sản phẩm"
                        : "Xác nhận phương thức khi đặt hàng"}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </section>
          <VoucherBox />
          <button className="primary checkout-submit" type="submit" disabled={submitting}>
            {submitting ? "Đang ghi nhận đơn hàng…" : `Đặt hàng · ${currency(totals.total + form.shippingFee)}`}
          </button>
        </form>
        <aside className="summary checkout-summary">
          <h3>Đơn hàng của bạn</h3>
          {cart.map((line) => (
            <div className="checkout-line" key={line.product.id}>
              <ProductImage p={line.product} className="mini-image" />
              <span>
                {line.product.name}
                <small>Số lượng: {line.qty}</small>
              </span>
              <b>{currency(totals.linePrices[line.product.id] * line.qty)}</b>
            </div>
          ))}
          <hr />
          <p>
            <span>Tạm tính</span>
            <b>{currency(totals.subtotal)}</b>
          </p>
          {totals.flashDiscount > 0 && (
            <p>
              <span>Tiết kiệm Flash Sale</span>
              <b>-{currency(totals.flashDiscount)}</b>
            </p>
          )}
          <p>
            <span>Giảm mã</span>
            <b>-{currency(totals.voucherDiscount)}</b>
          </p>
          <p>
            <span>Phí giao hàng</span>
            <b>{form.shippingFee ? currency(form.shippingFee) : "Miễn phí"}</b>
          </p>
          <hr />
          <h3>
            <span>Tổng thanh toán</span>
            <b>{currency(totals.total + form.shippingFee)}</b>
          </h3>
        </aside>
      </div>
    </section>
  );
}
function Success() {
  const { id } = useParams();
  const { orders } = useApp();
  const order = orders.find((item) => item.id === id);
  if (!order) return <Navigate to="/account/orders" replace />;
  return (
    <section className="wrap page success order-success">
      <div className="success-icon">
        <ShieldCheck />
      </div>
      <span>ĐƠN HÀNG ĐÃ ĐƯỢC GHI NHẬN</span>
      <h1>Bạn đã đặt hàng thành công!</h1>
      <p>
        Mã đơn hàng <b>#{order.id}</b> · Chúng tôi sẽ sớm xác nhận đơn của bạn.
      </p>
      <div className="success-card">
        <section>
          <h2>Sản phẩm đã đặt</h2>
          {order.lines.map((line) => (
            <div className="success-line" key={line.product.id}>
              <ProductImage p={line.product} className="mini-image" />
              <span>
                <b>{line.product.name}</b>
                <small>Số lượng: {line.qty}</small>
              </span>
              <strong>{currency(line.product.price * line.qty)}</strong>
            </div>
          ))}
          <p className="success-total">
            <span>Tổng thanh toán</span>
            <b>{currency(order.total)}</b>
          </p>
        </section>
        <aside>
          <h2>Thông tin giao nhận</h2>
          <dl>
            <dt>Người nhận</dt>
            <dd>
              {order.customer} · {order.phone}
            </dd>
            <dt>Địa chỉ</dt>
            <dd>
              {[order.address, order.ward, order.province]
                .filter(Boolean)
                .join(", ")}
            </dd>
            <dt>Thanh toán</dt>
            <dd>{order.paymentMethod || "Thanh toán khi nhận hàng"}</dd>
            <dt>Vận chuyển</dt>
            <dd>{order.shippingMethod || "Giao hàng tiêu chuẩn"}</dd>
            {order.note && (
              <>
                <dt>Ghi chú</dt>
                <dd>{order.note}</dd>
              </>
            )}
          </dl>
        </aside>
      </div>
      <div className="success-actions">
        <Link className="primary" to={"/account/orders/" + id}>
          Xem đơn hàng
        </Link>
        <Link className="secondary" to="/products">
          Tiếp tục mua sắm
        </Link>
      </div>
    </section>
  );
}
function AccountCenter(){const {user,orders,logout,notify}=useApp();const [tab,setTab]=useState('profile');const [profile,setProfile]=useState(()=>storage.get('ktht.customer.profile',{name:user?.name||'',email:user?.email||'',phone:''}));const [addresses,setAddresses]=useState<string[]>(()=>storage.get('ktht.customer.addresses',[]));const [newAddress,setNewAddress]=useState('');const [returns,setReturns]=useState<string[]>(()=>storage.get('ktht.customer.returns',[]));if(!user)return <Navigate to="/login"/>;const mine=orders.filter(order=>order.customerId?order.customerId===user.id:order.customer===user.name);const saveAddresses=(next:string[])=>{setAddresses(next);storage.set('ktht.customer.addresses',next)};const menu=[['profile','Thông tin cá nhân'],['addresses','Sổ địa chỉ nhận hàng'],['orders','Lịch sử đơn hàng'],['vouchers','Mã giảm giá của tôi'],['returns','Lịch sử đổi trả'],['notifications','Thông báo']];return <section className="wrap page account-center"><div className="account-heading"><div><span>TÀI KHOẢN CỦA TÔI</span><h1>Xin chào, {profile.name||user.name}</h1></div></div><div className="account-layout"><aside>{menu.map(([id,label])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>{label}</button>)}<button onClick={logout}>Đăng xuất</button></aside><main className="account-panel">{tab==='profile'&&<><h2>Thông tin cá nhân</h2><div className="form-grid"><label>Họ và tên<input value={profile.name} onChange={event=>setProfile({...profile,name:event.target.value})}/></label><label>Email<input type="email" value={profile.email} onChange={event=>setProfile({...profile,email:event.target.value})}/></label><label>Số điện thoại<input value={profile.phone} onChange={event=>setProfile({...profile,phone:event.target.value.replace(/\D/g,'')})}/></label></div><button className="primary" onClick={()=>{storage.set('ktht.customer.profile',profile);notify('Đã cập nhật thông tin cá nhân.')}}>Lưu thay đổi</button></>}{tab==='addresses'&&<><h2>Sổ địa chỉ nhận hàng</h2><div className="address-add"><input value={newAddress} onChange={event=>setNewAddress(event.target.value)} placeholder="Nhập địa chỉ mới"/><button className="primary" onClick={()=>{if(newAddress.trim()){saveAddresses([...addresses,newAddress.trim()]);setNewAddress('')}}}>Thêm địa chỉ</button></div>{addresses.map((address,index)=><div className="address-row" key={address+index}><span>{address}</span><button onClick={()=>{const value=prompt('Cập nhật địa chỉ',address);if(value?.trim())saveAddresses(addresses.map((item,i)=>i===index?value.trim():item))}}>Sửa</button><button onClick={()=>saveAddresses(addresses.filter((_,i)=>i!==index))}>Xóa</button></div>)}{!addresses.length&&<p className="empty">Bạn chưa lưu địa chỉ nào.</p>}</>}{tab==='orders'&&<><h2>Lịch sử đơn hàng</h2>{mine.map(order=><Link className="account-order" to={'/account/orders/'+order.id} key={order.id}><b>#{order.id}</b><span>{order.date}</span><Status status={order.status}/><strong>{currency(order.total)}</strong></Link>)}{!mine.length&&<p className="empty">Bạn chưa có đơn hàng nào.</p>}</>}{tab==='vouchers'&&<><h2>Mã giảm giá của tôi</h2>{getVouchers().filter(voucher=>voucher.active).map(voucher=><div className="voucher-ticket" key={voucher.id}><b>{voucher.code}</b><span>{voucher.name}</span><small>Đơn tối thiểu {currency(voucher.minEligibleAmount)} · xét trên giá trước Flash Sale</small></div>)}</>}{tab==='returns'&&<CustomerWorkflows user={user}/>}{tab==='notifications'&&<><h2>Thông báo</h2><CustomerWorkflows user={user}/></>}</main></div></section>}

function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const [email, setEmail] = useState(
    mode === "manager"
      ? "quanly@vpharma.demo"
      : mode === "staff"
        ? "donhang@vpharma.demo"
        : "khachhang@antam.demo",
  );
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const demos = [
    ["Khách hàng", "khachhang@antam.demo"],
    ["Kỹ thuật (IT)", "it@vpharma.demo"],
    ["Sản phẩm & Nội dung", "sanpham@vpharma.demo"],
    ["CRM / Marketing / CSKH", "marketing@vpharma.demo"],
    ["Kho vận", "khovan@vpharma.demo"],
    ["Vận hành đơn hàng", "donhang@vpharma.demo"],
    ["Tài chính – Kế toán", "ketoan@vpharma.demo"],
    ["Quản lý TMĐT", "quanly@vpharma.demo"],
  ] as const;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.account)
      nav(safeNext(params.get("next"), result.account.role), { replace: true });
  };
  return (
    <section className="auth">
      <form className="form" onSubmit={submit}>
        <Brand />
        <h1>Đăng nhập</h1>
        <p className="muted">
          Lựa chọn chỉ xác định lối đăng nhập; quyền được nhận diện từ tài khoản
          sau xác thực.
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="primary" type="submit">
          Đăng nhập
        </button>
        <details open>
          <summary>Chọn lối đăng nhập / tài khoản dùng thử</summary>
          <small>Mật khẩu dùng thử đã được điền sẵn.</small>
          <div className="demo-roles">
            {demos.map(([label, value]) => (
              <button
                type="button"
                className={email === value ? "selected" : ""}
                onClick={() => {
                  setEmail(value);
                  setPassword("Demo@123");
                  setError("");
                }}
                key={value}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </section>
  );
}

function Register() {
  const { register } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  return (
    <section className="auth">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const result = register(form.name, form.email, form.password);
          if (result.error) {
            setError(result.error);
            return;
          }
          nav("/");
        }}
      >
        <Brand />
        <h1>Tạo tài khoản</h1>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Họ và tên
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="primary">Đăng ký</button>
        <p>
          Tài khoản mới luôn có vai trò Khách hàng.{" "}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </section>
  );
}
function Orders() {
  const { orders, user } = useApp();
  if (!user) return <Navigate to="/login" />;
  const mine = orders.filter((o) =>
    o.customerId ? o.customerId === user.id : o.customer === user.name,
  );
  return (
    <section className="wrap page">
      <h1>Đơn hàng của tôi</h1>
      {mine.length ? (
        <div className="table">
          {mine.map((o) => (
            <Link
              className="order-row"
              to={"/account/orders/" + o.id}
              key={o.id}
            >
              <b>#{o.id}</b>
              <span>{o.date}</span>
              <Status status={o.status} />
              <b>{currency(o.total)}</b>
              <span className="view-order">
                Xem chi tiết <ChevronRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">Bạn chưa có đơn hàng nào.</div>
      )}
    </section>
  );
}
function Status({ status }: { status: Order["status"] }) {
  return (
    <span className={"status s-" + status.replace(/ /g, "")}>{status}</span>
  );
}
function OrderDetail() {
  const { id } = useParams();
  const { orders, user } = useApp();
  if (!user) return <Navigate to="/login" />;
  const o = orders.find(
    (x) =>
      x.id === id &&
      (x.customerId ? x.customerId === user.id : x.customer === user.name),
  );
  if (!o) return <Navigate to="/account/orders" />;
  const steps = ["Chờ xác nhận", "Đang chuẩn bị hàng", "Đang giao", "Đã giao"];
  const index =
    o.status === "Chờ xác nhận"
      ? 0
      : o.status === "Đang xử lý"
        ? 1
        : o.status === "Đang giao"
          ? 2
          : o.status === "Hoàn tất"
            ? 3
            : -1;
  const storedSubtotal =
    o.subtotal ??
    o.lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const hasPromotionDetail =
    o.subtotal !== undefined ||
    o.discount !== undefined ||
    o.flashDiscount !== undefined;
  return (
    <section className="wrap page order-detail-page">
      <Link className="back-orders" to="/account/orders">
        ← Quay lại đơn hàng của tôi
      </Link>
      <div className="order-heading">
        <div>
          <p className="crumb">Đơn hàng / #{o.id}</p>
          <h1>Đơn #{o.id}</h1>
          <span>Đặt lúc {o.date}</span>
        </div>
        <Status status={o.status} />
      </div>
      <section className="delivery-progress">
        <h2>Tiến trình giao hàng</h2>
        {index < 0 ? (
          <div className="delivery-exception">
            <b>
              {o.status === "Đã hủy"
                ? "Đơn hàng đã hủy"
                : "Giao hàng không thành công"}
            </b>
            <span>Cập nhật: {o.updatedAt || o.date}</span>
          </div>
        ) : (
          <ol>
            {steps.map((step, i) => (
              <li
                className={i < index ? "done" : i === index ? "current" : ""}
                key={step}
              >
                <i>{i < index ? "✓" : i + 1}</i>
                <div>
                  <b>{step}</b>
                  {i === index && (
                    <small>Cập nhật: {o.updatedAt || o.date}</small>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="payment-status">
          <b>Thanh toán:</b> {o.paymentStatus==='PAID'?'Đã thanh toán':o.paymentStatus==='REFUNDED'?'Đã hoàn tiền':'Chưa thanh toán'} · {o.paymentMethod||'COD'}
        </p>
      </section>
      <div className="cart-layout">
        <section className="ordered-lines">
          <h2>Sản phẩm đã mua</h2>
          {o.lines.map((line) => (
            <article className="ordered-line" key={line.product.id}>
              <ProductImage
                p={line.product}
                className="ordered-product-image"
              />
              <div>
                <b>{line.product.name}</b>
                <span>{line.product.saleUnit || "Đang cập nhật"}</span>
                <span>Số lượng: {line.qty}</span>
              </div>
              <div>
                <span>Đơn giá lúc đặt</span>
                <b>{currency(line.product.price)}</b>
                <strong>{currency(line.product.price * line.qty)}</strong>
              </div>
            </article>
          ))}
        </section>
        <aside className="summary order-money">
          <h2>Chi tiết thanh toán</h2>
          <p>
            <span>Tiền hàng</span>
            <b>{currency(storedSubtotal)}</b>
          </p>
          {o.flashDiscount !== undefined && o.flashDiscount > 0 && (
            <p>
              <span>Tiết kiệm Flash Sale</span>
              <b>-{currency(o.flashDiscount)}</b>
            </p>
          )}
          {o.coupon && (
            <p>
              <span>Mã {o.coupon}</span>
              <b>-{currency(o.discount || 0)}</b>
            </p>
          )}
          <p>
            <span>Phí giao hàng</span>
            <b>{currency(o.shippingFee||0)}</b>
          </p>
          {!hasPromotionDetail && (
            <p className="muted">Đơn này chưa lưu chi tiết ưu đãi.</p>
          )}
          <hr />
          <h3>
            <span>Tổng tiền đơn</span>
            <b>{currency(o.total)}</b>
          </h3>
        </aside>
      </div>
      <CustomerWorkflows user={user} orderId={o.id}/>
    </section>
  );
}
function AdminDashboard() {
  const { orders } = useApp();
  const revenue = orders
    .filter((o) => o.status !== "Đã hủy")
    .reduce((s, o) => s + o.total, 0);
  return (
    <>
      <h1>Tổng quan</h1>
      <div className="metrics">
        <div>
          <span>Đơn hàng mới</span>
          <b>{orders.length}</b>
        </div>
        <div>
          <span>Chờ xác nhận</span>
          <b>{orders.filter((o) => o.status === "Chờ xác nhận").length}</b>
        </div>
        <div>
          <span>Doanh số đặt hàng</span>
          <b>{currency(revenue)}</b>
        </div>
      </div>
      <section className="revenue-chart">
        <div>
          <h2>Doanh số đặt hàng</h2>
          <p>
            Tổng giá trị các đơn đã ghi nhận trên hệ thống.
          </p>
        </div>
        <div className="chart-area">
          <span
            style={{
              height: `${orders.length ? Math.max(22, Math.min(100, revenue / 10000)) : 0}%`,
            }}
          ></span>
          <b>{orders.length ? currency(revenue) : "Chưa có dữ liệu"}</b>
        </div>
      </section>
      <h2>Đơn hàng gần đây</h2>
      <AdminOrderTable orders={orders.slice(0, 5)} />
    </>
  );
}
const orderDate = (order: Order) => {
  const date = order.createdAt ? new Date(order.createdAt) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date)
    : order.date;
};
function AdminOrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="admin-table order-management-table">
      <div className="tr th">
        <span>Mã đơn</span>
        <span>Khách hàng</span>
        <span>Ngày đặt</span>
        <span>Trạng thái</span>
        <span>Tổng tiền</span>
      </div>
      {orders.length ? (
        orders.map((o) => (
          <Link className="tr" key={o.id} to={"/admin/orders/" + o.id}>
            <b>#{o.id}</b>
            <span>{o.customer}</span>
            <span>{orderDate(o)}</span>
            <Status status={o.status} />
            <b>{currency(o.total)}</b>
          </Link>
        ))
      ) : (
        <div className="empty">Chưa có đơn hàng.</div>
      )}
    </div>
  );
}
function AdminOrders() {
  const { orders } = useApp();
  const [q, setQ] = useState("");
  return (
    <>
      <div className="section-title">
        <div>
          <p className="crumb">Khu vực nhân viên / Đơn hàng</p>
          <h1>Quản lý đơn hàng</h1>
        </div>
      </div>
      <div className="filter">
        <div>
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm mã đơn hoặc khách hàng"
          />
        </div>
      </div>
      <AdminOrderTable
        orders={orders.filter((o) =>
          (o.id + o.customer).toLowerCase().includes(q.toLowerCase()),
        )}
      />
    </>
  );
}
function AdminOrderDetail() {
  const { id } = useParams();
  const { user, orders, updateOrderStatus, requestConfirm } = useApp();
  if (!user || !canManageOrders(user.role)) return <Navigate to="/admin" replace />;
  const o = orders.find((x) => x.id === id);
  if (!o) return <Navigate to="/admin/orders" />;
  const display = o.status;
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Đơn hàng / #{o.id}</p>
      <div className="section-title">
        <h1>Đơn #{o.id}</h1>
        <Status status={display} />
      </div>
      <div className="admin-detail">
        <div className="form">
          <h3>Thông tin khách hàng</h3>
          <p>
            <b>{o.customer}</b> · {o.phone}
            <br />
            {o.address}
          </p>
          <h3>Sản phẩm</h3>
          <div className="admin-order-products">
            {o.lines.map((x) => (
              <div key={x.product.id} className="admin-order-line">
                <div className="admin-order-line-info">
                  <span className="admin-order-line-name">{x.product.name}</span>
                  <span className="admin-order-line-qty">× {x.qty}</span>
                </div>
                <b className="admin-order-line-price">{currency(x.product.price * x.qty)}</b>
              </div>
            ))}
          </div>
          <hr />
          <div className="admin-order-total-row">
            <h3>Tổng:</h3>
            <b className="admin-order-total-val">{currency(o.total)}</b>
          </div>
        </div>
        <aside className="summary">
          <h3>Cập nhật đơn hàng</h3>
          {display === "Chờ xác nhận" && (
            <button
              className="primary full"
              onClick={() => updateOrderStatus(o.id, "Đang xử lý")}
            >
              Xác nhận đơn
            </button>
          )}
          <Link className="secondary full" to="/admin/workflow/shipping">Theo dõi giao nhận</Link>
          <Link className="secondary full" to="/admin/workflow/cancellations">Xử lý yêu cầu hủy</Link>
        </aside>
      </div>
    </>
  );
}
function Inventory() {
  const { user } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  if (
    !user ||
    !canManageInventory(user.role)
  )
    return <Forbidden />;
  const records = getInventory().filter((record) => {
    const text = (record.product.name + " " + record.product.id).toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "low" && record.status === "Sắp hết") ||
        (filter === "out" && record.status === "Hết hàng"))
    );
  });
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Kho</p>
      <h1>Kho hàng</h1>
      <p className="muted">
        Ngưỡng sắp hết: {LOW_STOCK_THRESHOLD} đơn vị. Tồn khả
        dụng = tồn vật lý − đang giữ.
      </p>
      <div className="inventory-filters">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm tên sản phẩm hoặc mã"
        />
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as "all" | "low" | "out")
          }
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="low">Sắp hết</option>
          <option value="out">Hết hàng</option>
        </select>
      </div>
      <div className="inventory-table admin-table">
        <div className="tr th">
          <span>Sản phẩm / mã</span>
          <span>Kho / đơn vị</span>
          <span>Tồn vật lý</span>
          <span>Đang giữ</span>
          <span>Khả dụng</span>
          <span>Trạng thái</span>
        </div>
        {records.map((record) => (
          <div className="tr" key={record.productId}>
            <span>
              <b>{record.product.name}</b>
              <small>{record.productId}</small>
            </span>
            <span>
              {record.warehouseName}
              <small>{record.product.saleUnit || "Đang cập nhật"}</small>
            </span>
            <b>{record.physical}</b>
            <b>{record.reserved}</b>
            <b>{record.available}</b>
            <span
              className={"inventory-status " + record.status.replace(/\s/g, "")}
            >
              {record.status}
            </span>
          </div>
        ))}
        {!records.length && (
          <div className="empty">Không có sản phẩm khớp bộ lọc.</div>
        )}
      </div>
    </>
  );
}
function AdminProducts() {
  const { user } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  if (!user || !canManageProducts(user.role)) return <Forbidden />;
  const categories = ["Tất cả", ...new Set(products.map((item) => item.category))];
  const rows = products.filter((item) => {
    const search = `${item.name} ${item.id} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
    return (
      search.includes(query.trim().toLowerCase()) &&
      (category === "Tất cả" || item.category === category)
    );
  });
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Sản phẩm & Danh mục</p>
      <h1>Sản phẩm & Danh mục</h1>
      <p className="muted">
        Quản lý danh sách sản phẩm, SKU, giá bán, danh mục, hình ảnh và trạng thái hiển thị.
      </p>
      <div className="inventory-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, SKU hoặc danh mục" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="admin-table product-admin-table">
        <div className="tr th"><span>Sản phẩm / SKU</span><span>Danh mục</span><span>Đơn vị</span><span>Giá bán</span><span>Hình ảnh</span><span>Trạng thái</span></div>
        {rows.map((item) => <div className="tr" key={item.id}><span><b>{item.name}</b><small>{item.id}</small></span><span>{item.category}</span><span>{item.saleUnit || "Đang cập nhật"}</span><b>{currency(item.price)}</b><span>{item.image || item.imageUrl ? "Đã có" : "Placeholder"}</span><Status status={item.tags.includes("Cần xác minh") ? "Chờ xác nhận" : "Hoàn tất"} /></div>)}
        {!rows.length && <div className="empty">Không có sản phẩm phù hợp.</div>}
      </div>
    </>
  );
}
function Reports() {
  const { user, orders } = useApp();
  const [preset, setPreset] = useState<"oct" | "nov" | "7" | "custom">("nov");
  const today = dataAsOfKey(orders);
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");
  const offset = (count: number) => {
    const date = new Date(today + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() - count + 1);
    return date.toISOString().slice(0, 10);
  };
  const [custom, setCustom] = useState({ from: offset(7), to: today });
  if (!user || !canAccessReports(user.role))
    return <Forbidden />;
  const range =
    preset === "oct"
      ? { from: "2026-10-01", to: "2026-10-31" }
      : preset === "nov"
        ? { from: "2026-11-01", to: today }
      : preset === "7"
        ? { from: offset(7), to: today }
        : custom;
  const data = useMemo(
    () => aggregateReports(orders, range.from, range.to),
    [orders, range.from, range.to],
  );
  const productsInRange = useMemo(() => productReports(orders, range.from, range.to, category, productId), [orders, range.from, range.to, category, productId]);
  const formatDate = (key: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(key + "T12:00:00Z"));
  const maxOrders = Math.max(1, ...data.days.map((day) => day.orders)),
    maxSales = Math.max(1, ...data.days.map((day) => day.orderSales));
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Báo cáo</p>
      <h1>Báo cáo theo ngày</h1>
      <p className="muted">
        Múi giờ Việt Nam · {formatDate(range.from)} – {formatDate(range.to)}.
        Doanh thu chỉ tính khi đơn đã ghi nhận thanh toán/COD thành công.
      </p>
      <section className="report-filters">
        <button
          className={preset === "oct" ? "active" : ""}
          onClick={() => setPreset("oct")}
        >
          Hôm nay
        </button>
        <button
          className={preset === "nov" ? "active" : ""}
          onClick={() => setPreset("nov")}
        >
          7 ngày gần nhất
        </button>
        <button
          className={preset === "7" ? "active" : ""}
          onClick={() => setPreset("7")}
        >
          30 ngày gần nhất
        </button>
        <button
          className={preset === "custom" ? "active" : ""}
          onClick={() => setPreset("custom")}
        >
          Tùy chọn
        </button>
        {preset === "custom" && (
          <>
            <label>
              Từ ngày
              <input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(event) =>
                  setCustom({ ...custom, from: event.target.value })
                }
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                max={today}
                onChange={(event) =>
                  setCustom({ ...custom, to: event.target.value })
                }
              />
            </label>
          </>
        )}
      </section>
      <div className="metrics report-metrics">
        <div>
          <span>Số đơn trong kỳ</span>
          <b>{data.periodOrders}</b>
        </div>
        <div>
          <span>Doanh thu trong kỳ</span>
          <b>{currency(data.periodRevenue)}</b>
        </div>
        <div>
          <span>Tổng doanh thu từ trước đến nay</span>
          <b>{currency(data.periodNetRevenue)}</b>
        </div>
        <div>
          <span>Doanh số đặt hàng</span>
          <b>{currency(data.periodSales)}</b>
          <small>Giá trị đơn lúc đặt</small>
        </div>
      </div>
      {data.insufficientRevenue && (
        <p className="report-warning">
          Chưa đủ dữ liệu: một số đơn hoàn tất chưa lưu mốc hoặc số tiền thanh
          toán; không dùng ngày tạo đơn thay thế.
        </p>
      )}
      <div className="report-charts">
        <ReportChart
          title="Số đơn hàng theo ngày"
          days={data.days}
          value={(day) => day.orders}
          max={maxOrders}
          label={(value) => value + " đơn hàng"}
        />
        <ReportChart
          title="Doanh số theo ngày"
          days={data.days}
          value={(day) => day.orderSales}
          max={maxSales}
          label={currency}
        />
      </div>
      <section className="report-table">
        <h2>Theo ngày</h2>
        <div className="admin-table">
          <div className="tr th">
            <span>Ngày</span>
            <span>Số đơn tạo</span>
            <span>Doanh số đặt hàng</span>
            <span>Doanh thu</span>
          </div>
          {data.days.map((day) => (
            <div className="tr" key={day.date}>
              <span>{formatDate(day.date)}</span>
              <b>{day.orders}</b>
              <b>{currency(day.orderSales)}</b>
              <b>
                {day.revenueKnown ? currency(day.revenue) : "Chưa đủ dữ liệu"}
              </b>
            </div>
          ))}
          <div className="tr report-total">
            <b>Tổng trong kỳ</b>
            <b>{data.periodOrders}</b>
            <b>{currency(data.periodSales)}</b>
            <b>{currency(data.periodRevenue)}</b>
          </div>
        </div>
      </section>
    </>
  );
}
function ReportChart({
  title,
  days,
  value,
  max,
  label,
}: {
  title: string;
  days: { date: string }[];
  value: (day: any) => number | undefined;
  max: number;
  label: (value: number) => string;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section className="report-chart">
      <h2>{title}</h2>
      <div className="chart-bars">
        {days.map((day) => {
          const amount = value(day);
          const date = new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date(day.date + "T12:00:00Z"));
          const content =
            amount === undefined
              ? date + " · Chưa có dữ liệu"
              : date + " · " + label(amount);
          const shown = active === day.date;
          return (
            <button
              type="button"
              className="chart-point"
              aria-label={content}
              onPointerEnter={() => setActive(day.date)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(day.date)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(shown ? null : day.date)}
              key={day.date}
            >
              <span
                style={{
                  height:
                    String(
                      amount === undefined
                        ? 0
                        : Math.max(0, ((amount || 0) / max) * 100),
                    ) + "%",
                }}
              />
              <small>{date.slice(0, 5)}</small>
              {shown && (
                <b className="chart-tooltip" role="status">
                  {content}
                </b>
              )}
            </button>
          );
        })}
      </div>
      <p className="muted">
        Rê chuột, dùng bàn phím hoặc chạm vào cột để xem ngày và giá trị.
      </p>
    </section>
  );
}
function Support() {
  const { user } = useApp();
  if (!user || !canAccessSupport(user.role)) return <Forbidden />;
  const [tickets] = useState(() =>
    storage.get<{ id: string; question: string; createdAt: string }[]>(
      "ktht.support",
      [],
    ),
  );
  return (
    <>
      <p className="crumb">Khu vực nhân viên / CSKH</p>
      <h1>Câu hỏi khách hàng</h1>
      <p className="muted">
        Các câu hỏi gửi từ chatbot khách hàng trong trình duyệt này. Dùng Trợ lý
        V-pharma ở góc phải để tra cứu nghiệp vụ.
      </p>
      <div className="admin-table">
        <div className="tr th">
          <span>Mã</span>
          <span>Nội dung</span>
          <span>Thời gian</span>
          <span>Trạng thái</span>
        </div>
        {tickets.length ? (
          tickets.map((ticket) => (
            <div className="tr" key={ticket.id}>
              <b>{ticket.id}</b>
              <span>{ticket.question}</span>
              <span>{ticket.createdAt}</span>
              <Status status="Chờ xác nhận" />
            </div>
          ))
        ) : (
          <div className="empty">Chưa có câu hỏi từ khách hàng.</div>
        )}
      </div>
    </>
  );
}
function Shipments() {
  const { user, orders } = useApp();
  if (!user || !canAccessShipments(user.role)) return <Forbidden />;
  const label = (status: Order["status"]) =>
    status === "Chờ xác nhận"
      ? "Chờ lấy hàng"
      : status === "Đang xử lý"
        ? "Chờ lấy hàng"
        : status === "Đang giao"
          ? "Đang giao"
          : status === "Hoàn tất"
            ? "Đã giao"
            : "Đã hủy";
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Giao hàng</p>
      <h1>Theo dõi giao hàng</h1>
      <p className="muted">
        Trạng thái giao hàng được suy ra từ trạng thái đơn.
      </p>
      <div className="admin-table">
        <div className="tr th">
          <span>Mã đơn</span>
          <span>Khách hàng</span>
          <span>Giao hàng</span>
          <span>Tổng tiền</span>
        </div>
        {orders.length ? (
          orders.map((o) => (
            <div className="tr" key={o.id}>
              <b>#{o.id}</b>
              <span>{o.customer}</span>
              <Status
                status={
                  label(o.status) === "Đã giao"
                    ? "Hoàn tất"
                    : label(o.status) === "Đang giao"
                      ? "Đang giao"
                      : "Chờ xác nhận"
                }
              />
              <b>{currency(o.total)}</b>
            </div>
          ))
        ) : (
          <div className="empty">Chưa có đơn để giao.</div>
        )}
      </div>
    </>
  );
}
function Users() {
  const { user } = useApp();
  const [list, setList] = useState(() => accounts());
  if (!user || !canManageSystem(user.role)) return <Forbidden />;
  const toggle = (id: string, locked: boolean) =>
    setList(setAccountLocked(id, !locked));
  return (
    <>
      <p className="crumb">Khu vực nhân viên / Nhân viên</p>
      <h1>Tài khoản nhân viên</h1>
      <p className="muted">
        Quản lý khóa/mở khóa tài khoản dùng thử. Mật khẩu không được hiển thị.
      </p>
      <div className="admin-table">
        <div className="tr th">
          <span>Họ tên</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>
        {list
          .filter((a) => a.role !== "CUSTOMER")
          .map((a) => (
            <div className="tr" key={a.id}>
              <b>{a.name}</b>
              <span>{roleLabel[a.role]}</span>
              <Status status={a.locked ? "Đã hủy" : "Hoàn tất"} />
              <button
                className="plain"
                onClick={() => toggle(a.id, Boolean(a.locked))}
              >
                {a.locked ? "Mở khóa" : "Khóa"}
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
function NotFound() {
  return (
    <section className="wrap page empty">
      <h1>Trang này đang ở trạng thái PLANNED</h1>
      <p>Chức năng này hiện chưa có giao diện.</p>
    </section>
  );
}
function ProposalsRoute() {
  const { user } = useApp();
  return <ProposalsPage user={user} />;
}
function PromotionsRoute() {
  const { user } = useApp();
  if (!user || !canManagePromotions(user.role)) return <Forbidden />;
  return <ProposalsPage user={user} />;
}
function ApprovalsRoute() {
  const { user } = useApp();
  return <ApprovalsPage user={user} />;
}
const sharedNotificationCount=(id:string)=>Workflow.getState().notifications.filter(n=>n.userId===id&&!n.read).length;
function WorkflowRoute({section}:{section?:React.ComponentProps<typeof WorkflowPage>['section']}){const {user}=useApp();const location=useLocation();return <WorkflowPage key={location.pathname} user={user} section={section}/>}
function App() {
  return (
    <AppProvider>
      <SessionSync />
      <HashRouter>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/goc-suc-khoe" element={<><PublishedContent kind="ARTICLE"/><HealthHub /></>} />
            <Route path="/bai-viet/:id" element={<PublishedContent kind="ARTICLE"/>}/>
            <Route path="/goc-suc-khoe/:slug" element={<HealthArticlePage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<Detail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/result/:id" element={<Success />} />
            <Route path="/account" element={<AccountCenter />} />
            <Route path="/account/orders" element={<Orders />} />
            <Route path="/account/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route
            path="/staff/login"
            element={<Navigate to="/login?mode=staff" replace />}
          />
          <Route
            path="/admin/login"
            element={<Navigate to="/login?mode=manager" replace />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<WorkflowRoute section="overview" />} />
            <Route path="workflow/:section" element={<WorkflowRoute/>}/>
            <Route path="products" element={<WorkflowRoute section="content" />} />
            <Route path="promotions" element={<WorkflowRoute section="campaigns" />} />
            <Route path="orders" element={<WorkflowRoute section="pending" />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="shipments" element={<WorkflowRoute section="shipping" />} />
            <Route path="support" element={<WorkflowRoute section="tickets" />} />
            <Route path="finance" element={<WorkflowRoute section="payments" />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/forecast" element={<ForecastReport />} />
            <Route path="proposals" element={<WorkflowRoute section="price" />} />
            <Route path="approvals" element={<WorkflowRoute section="approvals" />} />
            <Route path="inventory" element={<WorkflowRoute section="stock" />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
function ForecastReport() {
  const { user, orders } = useApp();
  return (
    <>
      <p className="crumb">Khu vực quản lý / Báo cáo / Dự báo nhu cầu</p>
      <ForecastPanel orders={orders} user={user} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
