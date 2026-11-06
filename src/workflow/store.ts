import { catalog, type CatalogProduct } from '../data/catalog';
import { accounts, isManagement, type Account } from '../auth';
import { ensureDemoSales } from '../sales/demo';
export const STORE_KEY = 'vpharma.workflow.v1';
export type RequestKind = 'CONTENT' | 'PRICE' | 'CAMPAIGN' | 'FLASH' | 'PURCHASE' | 'STOCKTAKE' | 'EXCEPTION';
export type RequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type Payload = {
    productId?: string;
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    qty?: number;
    unitCost?: number;
    supplierId?: string;
    code?: string;
    value?: number;
    min?: number;
    max?: number;
    startsAt?: string;
    endsAt?: string;
    limit?: number;
    productIds?: string[];
    category?: string;
    orderId?: string;
    kind?: 'PERCENT' | 'FIXED';
    published?: boolean;
};
export type Request = {
    id: string;
    referenceId: string;
    type: RequestKind;
    title: string;
    description: string;
    requestedBy: string;
    requestedName: string;
    requestedDepartment: string;
    createdAt: string;
    status: RequestStatus;
    priority: 'NORMAL' | 'HIGH';
    currentApprover: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNote?: string;
    previousValue: Payload;
    proposedValue: Payload;
    revisionOf?: string;
};
export type Order = {
    id: string;
    date: string;
    customer: string;
    phone: string;
    address: string;
    customerId?: string;
    createdAt?: string;
    updatedAt?: string;
    total: number;
    status: 'Chờ xác nhận' | 'Đang xử lý' | 'Đang giao' | 'Hoàn tất' | 'Đã hủy';
    lines: {
        product: CatalogProduct;
        qty: number;
    }[];
    paymentMethod?: string;
    paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
    paidAt?: string;
    refundAmount?: number;
    refundedAt?: string;
    deliveryStatus?: 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
    coupon?: string;
    discount?: number;
    voucherSnapshot?: {
        code: string;
        name: string;
        kind: string;
        value: number;
        discount: number;
        lineDiscounts: Record<string, number>;
    };
    shippingFee?: number;
    [key: string]: unknown;
};
export type Lot = {
    id: string;
    productId: string;
    qty: number;
    reserved: number;
    receivedAt: string;
    manufacturedAt?: string;
    expiresAt: string;
};
export type Movement = {
    id: string;
    productId: string;
    qty: number;
    kind: 'IN' | 'OUT' | 'ADJUST' | 'RETURN';
    referenceId: string;
    at: string;
    by: string;
    note: string;
};
export type Shipment = {
    id: string;
    orderId: string;
    status: 'PICKING' | 'PACKING' | 'READY' | 'SHIPPING' | 'DELIVERED' | 'FAILED';
    allocations: {
        lotId: string;
        qty: number;
    }[];
    shipped: boolean;
};
export type Ticket = {
    id: string;
    customerId: string;
    question: string;
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    assignedTo?: string;
    notes: string[];
    createdAt: string;
};
export type ReturnRequest = {
    id: string;
    orderId: string;
    customerId: string;
    productId: string;
    qty: number;
    reason: string;
    kind: 'RETURN' | 'WARRANTY';
    status: 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED' | 'CLOSED';
    restock?: boolean;
    amount: number;
};
export type Payment = {
    id: string;
    orderId: string;
    amount: number;
    at: string;
    by: string;
    kind: 'PAYMENT' | 'REFUND' | 'COD';
    referenceId: string;
};
export type Payable = {
    id: string;
    supplierId: string;
    requestId: string;
    receiptId: string;
    amount: number;
    paid: number;
    dueAt: string;
};
export type Publication = {
    id: string;
    kind: 'BANNER' | 'ARTICLE';
    title: string;
    body: string;
    image: string;
    status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
    updatedAt: string;
};
export type Audit = {
    id: string;
    referenceId: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    performedBy: string;
    performedAt: string;
    description: string;
};
export type Store = {
    version: 1;
    revision: number;
    products: CatalogProduct[];
    orders: Order[];
    requests: Request[];
    lots: Lot[];
    movements: Movement[];
    shipments: Shipment[];
    tickets: Ticket[];
    returns: ReturnRequest[];
    payments: Payment[];
    payables: Payable[];
    expenses: {
        id: string;
        amount: number;
        at: string;
        referenceId: string;
    }[];
    publications: Publication[];
    cancellations: {
        id: string;
        orderId: string;
        customerId: string;
        reason: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        reviewNote?: string;
    }[];
    exceptions: {
        id: string;
        orderId: string;
        description: string;
        department: string;
        status: 'OPEN' | 'RESOLVED';
        resolution?: string;
    }[];
    suppliers: {
        id: string;
        name: string;
    }[];
    notifications: {
        id: string;
        userId: string;
        text: string;
        at: string;
        read: boolean;
    }[];
    auditLogs: Audit[];
    segmentRules: {
        repeat: number;
        loyalOrders: number;
        loyalSpend: number;
    };
    legacy: Record<string, unknown>;
};
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const read = <T,>(key: string, fallback: T): T => { try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
}
catch {
    return fallback;
} };
let cache: Store | undefined;
const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const emit = () => listeners.forEach(fn => fn());
if (typeof window !== 'undefined')
    window.addEventListener('storage', event => { if (event.key === STORE_KEY) {
        cache = undefined;
        emit();
    } });
function assert(condition: unknown, message: string): asserts condition { if (!condition)
    throw new Error(message); }
const roles = (actor: Account, allowed: string[]) => assert(isManagement(actor.role) || allowed.includes(actor.role), 'Bạn không có quyền thực hiện thao tác này.');
const integer = (value: unknown, min = 1) => assert(Number.isSafeInteger(value) && Number(value) >= min, 'Số lượng hoặc số tiền không hợp lệ.');
function migrate(): Store {
    const legacy: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        if (key.startsWith('ktht.') && !['ktht.orders', 'ktht.inventory.v1', 'ktht.accounts.v2', 'ktht.user', 'ktht.proposals.v1'].includes(key))
            legacy[key] = read(key, null);
    }
    const existing = read<Order[]>('ktht.orders', []);
    const orders = Array.isArray(existing) && existing.length ? existing : ensureDemoSales() as Order[];
    const products = catalog.map(p => ({ ...p, tags: [...p.tags] }));
    const oldInventory = read<{
        productId: string;
        physical: number;
        reserved: number;
    }[]>('ktht.inventory.v1', []);
    const lots: Lot[] = products.map(p => { const old = oldInventory.find(i => i.productId === p.id); return { id: `LOT-${p.id}`, productId: p.id, qty: Math.max(0, old?.physical ?? 30), reserved: Math.max(0, Math.min(old?.reserved ?? 0, old?.physical ?? 30)), receivedAt: now(), expiresAt: '2028-12-31' }; });
    const requests: Request[] = read<any[]>('ktht.proposals.v1', []).map(p => ({ id: p.id, referenceId: p.id, type: p.kind === 'PRICE' ? 'PRICE' : 'CAMPAIGN', title: p.productName || p.name || p.code, description: p.reason || '', requestedBy: p.proposerId, requestedName: p.proposerName, requestedDepartment: accounts().find(a => a.id === p.proposerId)?.role || 'ORDER_STAFF', createdAt: p.createdAt || now(), status: p.status === 'WITHDRAWN' ? 'CANCELLED' : p.status, priority: 'NORMAL', currentApprover: 'MANAGER', reviewedBy: p.reviewerId, reviewedAt: p.reviewedAt, reviewNote: p.reviewReason, previousValue: { price: p.currentPriceSnapshot }, proposedValue: p.kind === 'PRICE' ? { productId: p.productId, price: p.proposedPrice, startsAt: p.applyAt } : { code: p.code, name: p.name, value: p.value, min: p.minEligibleAmount, max: p.maxDiscount, kind: p.discountKind, startsAt: p.startsAt, endsAt: p.endsAt, limit: p.usageLimit, productIds: p.eligibleProductIds, category: p.eligibleCategories?.[0] } }));
    for (const r of requests.filter(r => r.type === 'PRICE' && r.status === 'APPROVED').sort((a, b) => (a.reviewedAt || '').localeCompare(b.reviewedAt || ''))) {
        const p = products.find(p => p.id === r.proposedValue.productId);
        if (p && (!r.proposedValue.startsAt || Date.parse(r.proposedValue.startsAt) <= Date.now()))
            p.price = r.proposedValue.price!;
    }
    const payments: Payment[] = orders.flatMap(o => o.paidAt ? [{ id: `MIGPAY-${o.id}`, orderId: o.id, amount: o.total, kind: 'PAYMENT' as const, at: o.paidAt, by: 'migration', referenceId: o.id }, ...(o.refundAmount ? [{ id: `MIGREF-${o.id}`, orderId: o.id, amount: o.refundAmount, kind: 'REFUND' as const, at: o.refundedAt || o.paidAt, by: 'migration', referenceId: o.id }] : [])] : []);
    return { version: 1, revision: 0, products, orders, requests, lots, payments, movements: [], shipments: [], tickets: read<any[]>('ktht.support', []).map(t => ({ id: t.id, customerId: t.customerId || '', question: t.question, status: 'OPEN', notes: [], createdAt: t.createdAt || now() })), returns: [], payables: [], expenses: [], publications: [], cancellations: [], exceptions: [], suppliers: [{ id: 'SUP-01', name: 'Dược phẩm An Tâm' }, { id: 'SUP-02', name: 'Thiết bị Y tế Việt' }], notifications: read('ktht.notifications.v1', []), auditLogs: [], segmentRules: { repeat: 2, loyalOrders: 5, loyalSpend: 2000000 }, legacy };
}
export function getState(): Store {
    if (cache)
        return cache;
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
        let value: Store;
        try {
            value = JSON.parse(raw);
        }
        catch {
            localStorage.setItem(`${STORE_KEY}.recovery.${Date.now()}`, raw);
            value = null!;
        }
        if (value) {
            assert(value.version === 1, 'Phiên bản dữ liệu mới hơn ứng dụng. Hãy cập nhật ứng dụng trước khi thao tác.');
            assert(Array.isArray(value.orders) && Array.isArray(value.products), 'Dữ liệu chưa hợp lệ; bản lưu gốc được giữ nguyên.');
            const existingIds = new Set(value.products.map(p => p.id));
            const missing = catalog.filter(p => !existingIds.has(p.id));
            if (missing.length > 0) {
                value.products.push(...missing.map(p => ({ ...p, tags: [...p.tags] })));
                for (const p of missing) {
                    if (!value.lots.some(l => l.productId === p.id)) {
                        value.lots.push({ id: `LOT-${p.id}`, productId: p.id, qty: 30, reserved: 0, receivedAt: now(), expiresAt: '2028-12-31' });
                    }
                }
                localStorage.setItem(STORE_KEY, JSON.stringify(value));
            }
            cache = value;
            return cache;
        }
    }
    const next = migrate();
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    cache = next;
    return next;
}
function transact<T>(actor: Account, referenceId: string, action: string, fn: (s: Store) => T): T {
    // One persisted document commits all related entities; a failed write leaves memory untouched.
    const disk = localStorage.getItem(STORE_KEY);
    if (disk && cache && JSON.parse(disk).revision !== cache.revision)
        cache = undefined;
    const before = getState();
    const next = structuredClone(before);
    const result = fn(next);
    const ref = referenceId === 'new' && typeof result === 'string' ? result : referenceId;
    const previous = before.orders.find(o => o.id === ref)?.status || before.requests.find(r => r.id === ref)?.status || before.tickets.find(t => t.id === ref)?.status;
    const current = next.orders.find(o => o.id === ref)?.status || next.requests.find(r => r.id === ref)?.status || next.tickets.find(t => t.id === ref)?.status;
    next.auditLogs.unshift({ id: uid('LOG'), referenceId: ref, action, previousStatus: previous, newStatus: current, performedBy: actor.id, performedAt: now(), description: action });
    next.revision++;
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    cache = next;
    emit();
    return result;
}
const tell = (s: Store, userId: string, text: string) => s.notifications.unshift({ id: uid('N'), userId, text, at: now(), read: false });
const managers = (s: Store, text: string) => accounts().filter(a => isManagement(a.role)).forEach(a => tell(s, a.id, text));
const productOf = (s: Store, id?: string) => { const p = s.products.find(p => p.id === id); assert(p, 'Không tìm thấy sản phẩm.'); return p; };
export const currentProduct = (id: string) => getState().products.find(p => p.id === id);
export const priceOf = (id: string, fallback: number) => currentProduct(id)?.price ?? fallback;
export function inventory(s = getState()) { return s.products.map(product => { const lots = s.lots.filter(l => l.productId === product.id); const physical = lots.reduce((n, l) => n + l.qty, 0), reserved = lots.reduce((n, l) => n + l.reserved, 0); const available = lots.filter(l => Date.parse(l.expiresAt + 'T23:59:59') > Date.now()).reduce((n, l) => n + Math.max(0, l.qty - l.reserved), 0); return { product, productId: product.id, warehouseId: 'demo' as const, warehouseName: 'Kho trung tâm', physical, reserved, available, updatedAt: now(), status: available === 0 ? 'Hết hàng' as const : available <= 5 ? 'Sắp hết' as const : 'Còn hàng' as const }; }); }
function requestPermission(actor: Account, type: RequestKind) { roles(actor, type === 'CONTENT' || type === 'PRICE' ? ['PRODUCT_CONTENT', 'ORDER_STAFF'] : type === 'CAMPAIGN' || type === 'FLASH' ? ['CRM_MARKETING', 'ORDER_STAFF'] : type === 'EXCEPTION' ? ['ORDER_OPERATIONS', 'ORDER_STAFF'] : ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF']); }
function validateRequest(s: Store, r: Request) {
    const p = r.proposedValue;
    assert(r.title.trim() && r.description.trim().length >= 3, 'Nhập tiêu đề và lý do (ít nhất 3 ký tự).');
    if (['CONTENT', 'PRICE', 'PURCHASE', 'STOCKTAKE'].includes(r.type))
        productOf(s, p.productId);
    if (r.type === 'PRICE')
        integer(p.price);
    if (r.type === 'CONTENT') {
        assert(p.name?.trim() && p.description?.trim(), 'Nhập tên và mô tả sản phẩm.');
        assert(!p.image || /^(https?:\/\/|\/images\/)/.test(p.image), 'Ảnh phải là URL http(s) hoặc đường dẫn /images/.');
    }
    if (r.type === 'STOCKTAKE')
        integer(p.qty, 0);
    if (r.type === 'PURCHASE') {
        integer(p.qty);
        integer(p.unitCost);
        assert(s.suppliers.some(v => v.id === p.supplierId), 'Chọn nhà cung cấp.');
    }
    if (r.type === 'CAMPAIGN' || r.type === 'FLASH') {
        assert(Number.isFinite(Date.parse(p.startsAt || '')) && Date.parse(p.startsAt!) < Date.parse(p.endsAt || '') && Date.parse(p.endsAt!) > Date.now(), 'Thời gian chương trình không hợp lệ.');
        integer(p.value);
        if (p.kind !== 'FIXED' || r.type === 'FLASH')
            assert(p.value! <= 100, 'Phần trăm tối đa 100.');
        integer(p.min ?? 0, 0);
        if (p.limit !== undefined)
            integer(p.limit);
        if (p.max !== undefined)
            integer(p.max);
        assert((p.productIds?.length || p.category), 'Chọn sản phẩm hoặc danh mục.');
        if (r.type === 'CAMPAIGN') {
            assert(/^[A-Z0-9_-]{3,24}$/.test(p.code || ''), 'Mã gồm 3–24 ký tự chữ hoa, số, gạch ngang.');
            assert(!['HELLO10', 'VPHARMA50'].includes(p.code!) && !s.requests.some(x => x.id !== r.id && x.type === 'CAMPAIGN' && ['PENDING', 'APPROVED'].includes(x.status) && x.proposedValue.code === p.code), 'Mã khuyến mãi đã tồn tại.');
        }
    }
}
export function saveRequest(actor: Account, type: RequestKind, title: string, description: string, proposedValue: Payload, id?: string, revisionOf?: string) { requestPermission(actor, type); return transact(actor, id || 'new', 'Lưu bản nháp', s => { const old = s.requests.find(r => r.id === id); if (id)
    assert(old && old.status === 'DRAFT' && old.requestedBy === actor.id, 'Chỉ sửa bản nháp của chính bạn.'); const product = s.products.find(p => p.id === proposedValue.productId); const r: Request = { id: old?.id || uid('AP'), referenceId: old?.referenceId || uid(type), type, title, description, requestedBy: actor.id, requestedName: actor.name, requestedDepartment: actor.role, createdAt: old?.createdAt || now(), status: 'DRAFT', priority: type === 'EXCEPTION' ? 'HIGH' : 'NORMAL', currentApprover: 'MANAGER', previousValue: old?.previousValue || (type === 'STOCKTAKE' ? { qty: inventory(s).find(i => i.productId === proposedValue.productId)?.physical } : product ? { price: product.price, name: product.name, description: product.description, image: product.image } : {}), proposedValue, revisionOf }; s.requests = s.requests.filter(x => x.id !== r.id); s.requests.unshift(r); return r.id; }); }
export function submitRequest(actor: Account, id: string) { return transact(actor, id, 'Gửi duyệt', s => { const r = s.requests.find(r => r.id === id); assert(r && r.requestedBy === actor.id && r.status === 'DRAFT', 'Yêu cầu không còn là bản nháp của bạn.'); requestPermission(actor, r.type); validateRequest(s, r); r.status = 'PENDING'; managers(s, `${actor.name}: ${r.title} chờ duyệt`); }); }
export function cancelRequest(actor: Account, id: string) { transact(actor, id, 'Rút yêu cầu', s => { const r = s.requests.find(r => r.id === id); assert(r && r.requestedBy === actor.id && ['DRAFT', 'PENDING'].includes(r.status), 'Không thể rút yêu cầu.'); r.status = 'CANCELLED'; }); }
export function reviewRequest(actor: Account, id: string, approve: boolean, note: string) {
    roles(actor, []);
    return transact(actor, id, approve ? 'Phê duyệt' : 'Từ chối', s => {
        const r = s.requests.find(r => r.id === id);
        assert(r && r.status === 'PENDING', 'Yêu cầu đã được xử lý.');
        assert(r.requestedBy !== actor.id, 'Không thể tự duyệt đề xuất.');
        assert(approve || note.trim().length >= 3, 'Nhập lý do từ chối.');
        if (approve) {
            validateRequest(s, r);
            const p = r.proposedValue;
            if (r.type === 'PRICE') {
                const product = productOf(s, p.productId);
                assert(product.price === r.previousValue.price, 'Giá đã thay đổi. Yêu cầu cần tạo phiên bản mới.');
                product.price = p.price!;
            }
            if (r.type === 'CONTENT') {
                const product = productOf(s, p.productId);
                assert(product.name === r.previousValue.name && product.description === r.previousValue.description && product.image === r.previousValue.image, 'Nội dung đã thay đổi. Hãy gửi phiên bản mới.');
                product.name = p.name!;
                product.description = p.description!;
                product.image = p.image || '';
            }
            if (r.type === 'STOCKTAKE') {
                const inv = inventory(s).find(i => i.productId === p.productId)!;
                assert(inv.physical === r.previousValue.qty, 'Tồn kho đã thay đổi từ lần kiểm kê.');
                assert(p.qty! >= inv.reserved, 'Tồn thực tế không được nhỏ hơn lượng đang giữ.');
                const delta = p.qty! - inv.physical;
                if (delta >= 0)
                    s.lots.push({ id: uid('LOT'), productId: p.productId!, qty: delta, reserved: 0, receivedAt: now(), expiresAt: p.endsAt || '2028-12-31' });
                else
                    consume(s, p.productId!, -delta);
                s.movements.push({ id: uid('MV'), productId: p.productId!, qty: delta, kind: 'ADJUST', referenceId: r.id, at: now(), by: actor.id, note: r.description });
            }
            if (r.type === 'EXCEPTION') {
                const ex = s.exceptions.find(x => x.orderId === p.orderId && x.status === 'OPEN');
                if (ex) {
                    ex.status = 'RESOLVED';
                    ex.resolution = note || r.description;
                }
            }
        }
        r.status = approve ? 'APPROVED' : 'REJECTED';
        r.reviewedBy = actor.id;
        r.reviewedAt = now();
        r.reviewNote = note;
        tell(s, r.requestedBy, `${r.title}: ${approve ? 'Đã duyệt' : 'Từ chối — ' + note}`);
    });
}
function consume(s: Store, productId: string, qty: number) { const lots = s.lots.filter(l => l.productId === productId && Date.parse(l.expiresAt + 'T23:59:59') > Date.now()).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)); assert(lots.reduce((n, l) => n + l.qty - l.reserved, 0) >= qty, 'Không đủ hàng khả dụng, hoặc lô đã hết hạn.'); for (const l of lots) {
    const n = Math.min(qty, l.qty - l.reserved);
    l.qty -= n;
    qty -= n;
    if (!qty)
        break;
} }
export function stockMove(actor: Account, kind: 'IN' | 'OUT', productId: string, qty: number, note: string, expiresAt: string, referenceId = uid('REF')) { roles(actor, ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF']); integer(qty); return transact(actor, referenceId, 'Xác nhận phiếu kho', s => { assert(!s.movements.some(m => m.referenceId === referenceId), 'Phiếu đã xác nhận.'); productOf(s, productId); if (kind === 'IN') {
    assert(Date.parse(expiresAt + 'T23:59:59') > Date.now(), 'Hạn sử dụng phải ở tương lai.');
    s.lots.push({ id: uid('LOT'), productId, qty, reserved: 0, receivedAt: now(), expiresAt });
}
else
    consume(s, productId, qty); s.movements.unshift({ id: uid('MV'), productId, qty, kind, referenceId, at: now(), by: actor.id, note }); }); }
export function receivePurchase(actor: Account, requestId: string, expiresAt: string) { roles(actor, ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF']); return transact(actor, requestId, 'Nhận hàng mua', s => { const r = s.requests.find(r => r.id === requestId); assert(r && r.type === 'PURCHASE' && r.status === 'APPROVED', 'Đề xuất nhập chưa được duyệt.'); assert(!s.payables.some(p => p.requestId === requestId), 'Đã nhận hàng cho yêu cầu này.'); assert(Date.parse(expiresAt + 'T23:59:59') > Date.now(), 'Hạn sử dụng không hợp lệ.'); const p = r.proposedValue, receiptId = uid('PN'); s.lots.push({ id: uid('LOT'), productId: p.productId!, qty: p.qty!, reserved: 0, receivedAt: now(), expiresAt }); s.movements.unshift({ id: receiptId, productId: p.productId!, qty: p.qty!, kind: 'IN', referenceId: requestId, at: now(), by: actor.id, note: r.title }); s.payables.push({ id: uid('DEBT'), supplierId: p.supplierId!, requestId, receiptId, amount: p.qty! * p.unitCost!, paid: 0, dueAt: new Date(Date.now() + 30 * 86400000).toISOString() }); }); }
export function placeOrder(actor: Account, order: Order) { assert(actor.role === 'CUSTOMER', 'Chỉ khách hàng được đặt hàng.'); return transact(actor, order.id, 'Đặt hàng', s => { assert(!s.orders.some(o => o.id === order.id), 'Đơn đã được tạo.'); assert(order.lines.length && order.total >= 0, 'Giỏ hàng trống hoặc tổng tiền không hợp lệ.'); order.lines.forEach(l => integer(l.qty)); s.orders.unshift({ ...order, customerId: actor.id, paymentStatus: 'UNPAID' }); tell(s, actor.id, `Đã tiếp nhận đơn ${order.id}`); }); }
function ownOrder(s: Store, id: string) { const o = s.orders.find(o => o.id === id); assert(o, 'Không tìm thấy đơn.'); return o; }
export function confirmOrder(actor: Account, id: string) {
    roles(actor, ['ORDER_OPERATIONS', 'ORDER_STAFF']);
    return transact(actor, id, 'Xác nhận đơn và chuyển kho', s => {
        const o = ownOrder(s, id);
        assert(o.status === 'Chờ xác nhận', 'Đơn đã được xác nhận hoặc hủy.');
        const missing = o.lines.find(line => (inventory(s).find(i => i.productId === line.product.id)?.available ?? 0) < line.qty);
        if (missing) {
            if (!s.exceptions.some(e => e.orderId === id && e.status === 'OPEN'))
                s.exceptions.unshift({ id: uid('EX'), orderId: id, description: `Thiếu hàng: ${missing.product.name}`, department: 'WAREHOUSE_LOGISTICS', status: 'OPEN' });
            return 'Thiếu hàng, đã chuyển vấn đề sang kho.';
        }
        const allocations: {
            lotId: string;
            qty: number;
        }[] = [];
        for (const line of o.lines) {
            let remaining = line.qty;
            for (const lot of s.lots.filter(l => l.productId === line.product.id && Date.parse(l.expiresAt + 'T23:59:59') > Date.now()).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))) {
                const q = Math.min(remaining, lot.qty - lot.reserved);
                if (q > 0) {
                    lot.reserved += q;
                    allocations.push({ lotId: lot.id, qty: q });
                    remaining -= q;
                }
                if (!remaining)
                    break;
            }
        }
        o.status = 'Đang xử lý';
        o.updatedAt = now();
        s.shipments.push({ id: uid('SHIP'), orderId: id, status: 'PICKING', allocations, shipped: false });
        tell(s, o.customerId || '', `Đơn ${id} đang chuẩn bị hàng`);
        return 'Đã chuyển công việc chuẩn bị hàng sang kho.';
    });
}
export function advanceShipment(actor: Account, orderId: string, next: Shipment['status']) { roles(actor, ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF']); transact(actor, orderId, 'Giao nhận: ' + next, s => { const o = ownOrder(s, orderId), sh = s.shipments.find(sh => sh.orderId === orderId); assert(sh, 'Chưa có công việc kho cho đơn này.'); const allowed: Record<Shipment['status'], Shipment['status'][]> = { PICKING: ['PACKING'], PACKING: ['READY'], READY: ['SHIPPING'], SHIPPING: ['DELIVERED', 'FAILED'], FAILED: ['SHIPPING'], DELIVERED: [] }; assert(allowed[sh.status].includes(next), 'Bước giao nhận không hợp lệ.'); if (next === 'SHIPPING' && !sh.shipped) {
    for (const a of sh.allocations) {
        const l = s.lots.find(l => l.id === a.lotId)!;
        assert(Date.parse(l.expiresAt + 'T23:59:59') > Date.now() && l.qty >= a.qty && l.reserved >= a.qty, 'Lô đã hết hạn hoặc không đủ hàng.');
        l.qty -= a.qty;
        l.reserved -= a.qty;
        s.movements.push({ id: uid('MV'), productId: l.productId, qty: a.qty, kind: 'OUT', referenceId: sh.id, at: now(), by: actor.id, note: orderId });
    }
    sh.shipped = true;
} sh.status = next; o.status = next === 'DELIVERED' ? 'Hoàn tất' : next === 'SHIPPING' || next === 'FAILED' ? 'Đang giao' : 'Đang xử lý'; o.deliveryStatus = next === 'DELIVERED' ? 'DELIVERED' : next === 'SHIPPING' ? 'SHIPPING' : 'PENDING'; o.updatedAt = now(); if (next === 'FAILED')
    s.exceptions.push({ id: uid('EX'), orderId, department: 'ORDER_OPERATIONS', description: 'Giao hàng thất bại', status: 'OPEN' }); tell(s, o.customerId || '', `Đơn ${orderId}: ${next}`); }); }
export function requestCancellation(actor: Account, orderId: string, reason: string) { transact(actor, orderId, 'Yêu cầu hủy', s => { const o = ownOrder(s, orderId); assert(actor.id === o.customerId && actor.role === 'CUSTOMER', 'Không phải đơn của bạn.'); assert(['Chờ xác nhận', 'Đang xử lý'].includes(o.status), 'Đơn đã xuất hàng không thể hủy.'); assert(reason.trim() && !s.cancellations.some(c => c.orderId === orderId && c.status === 'PENDING'), 'Nhập lý do hoặc đợi yêu cầu đang xử lý.'); s.cancellations.push({ id: uid('CANCEL'), orderId, customerId: actor.id, reason, status: 'PENDING' }); }); }
export function reviewCancellation(actor: Account, id: string, approve: boolean, note: string) { roles(actor, ['ORDER_OPERATIONS', 'ORDER_STAFF']); transact(actor, id, 'Xử lý hủy đơn', s => { const c = s.cancellations.find(c => c.id === id); assert(c && c.status === 'PENDING', 'Yêu cầu đã xử lý.'); assert(approve || note.trim(), 'Nhập lý do từ chối.'); const o = ownOrder(s, c.orderId), sh = s.shipments.find(sh => sh.orderId === o.id); if (approve) {
    assert(!sh?.shipped && ['Chờ xác nhận', 'Đang xử lý'].includes(o.status), 'Đơn đã xuất hàng, không thể hủy.');
    for (const a of sh?.allocations || [])
        s.lots.find(l => l.id === a.lotId)!.reserved -= a.qty;
    s.shipments = s.shipments.filter(x => x !== sh);
    o.status = 'Đã hủy';
    o.deliveryStatus = 'CANCELLED';
} c.status = approve ? 'APPROVED' : 'REJECTED'; c.reviewNote = note; tell(s, c.customerId, `Yêu cầu hủy ${o.id}: ${c.status} ${note}`); }); }
export function resolveException(actor: Account, id: string, department: string, note: string, close: boolean) { roles(actor, ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF', 'ORDER_OPERATIONS', 'ORDER_STAFF']); transact(actor, id, 'Xử lý ngoại lệ', s => { const e = s.exceptions.find(e => e.id === id); assert(e && note.trim(), 'Nhập hướng xử lý.'); e.department = department; e.resolution = note; e.status = close ? 'RESOLVED' : 'OPEN'; }); }
export function createTicket(actor: Account, question: string, customerId = actor.id) { assert(question.trim(), 'Nhập nội dung hỗ trợ.'); if (actor.role !== 'CUSTOMER')
    roles(actor, ['CRM_MARKETING', 'SUPPORT_STAFF']); return transact(actor, customerId, 'Tạo yêu cầu hỗ trợ', s => { const id = uid('TICKET'); s.tickets.unshift({ id, customerId, question, status: 'OPEN', notes: [], createdAt: now() }); return id; }); }
export function handleTicket(actor: Account, id: string, status: Ticket['status'], note: string, assignedTo: string) { roles(actor, ['CRM_MARKETING', 'SUPPORT_STAFF']); transact(actor, id, 'Xử lý ticket', s => { const t = s.tickets.find(t => t.id === id); assert(t && note.trim(), 'Nhập nội dung xử lý.'); const transitions: Record<Ticket['status'], Ticket['status'][]> = { OPEN: ['ASSIGNED'], ASSIGNED: ['IN_PROGRESS'], IN_PROGRESS: ['RESOLVED'], RESOLVED: ['CLOSED', 'IN_PROGRESS'], CLOSED: [] }; assert(transitions[t.status].includes(status), 'Trạng thái ticket không hợp lệ.'); assert(accounts().some(a => a.id === assignedTo && (isManagement(a.role) || ['CRM_MARKETING', 'SUPPORT_STAFF'].includes(a.role))), 'Chọn nhân viên CSKH.'); t.assignedTo = assignedTo; t.status = status; t.notes.push(`${now()} · ${actor.name}: ${note}`); tell(s, t.customerId, `Yêu cầu ${id}: ${status} — ${note}`); }); }
export function createReturn(actor: Account, orderId: string, productId: string, qty: number, reason: string, kind: ReturnRequest['kind']) { integer(qty); return transact(actor, orderId, 'Yêu cầu đổi trả / bảo hành', s => { const o = ownOrder(s, orderId), line = o.lines.find(l => l.product.id === productId); assert(o.customerId === actor.id && o.status === 'Hoàn tất', 'Chỉ yêu cầu cho đơn đã giao của bạn.'); assert(line && qty <= line.qty && reason.trim().length >= 3, 'Sản phẩm, số lượng hoặc lý do không hợp lệ.'); const previous = s.returns.filter(r => r.orderId === orderId && r.productId === productId && r.status !== 'REJECTED').reduce((n, r) => n + r.qty, 0); assert(previous + qty <= line.qty, 'Số lượng yêu cầu vượt số đã mua.'); const goods = o.lines.reduce((n, l) => n + l.qty * l.product.price, 0); s.returns.unshift({ id: uid('RET'), orderId, customerId: actor.id, productId, qty, reason, kind, status: 'OPEN', amount: kind === 'WARRANTY' ? 0 : Math.floor(Math.max(0, goods - (o.discount || 0)) * line.product.price * qty / Math.max(1, goods)) }); }); }
export function reviewReturn(actor: Account, id: string, accept: boolean, note: string) { roles(actor, ['CRM_MARKETING', 'SUPPORT_STAFF']); transact(actor, id, 'CSKH kiểm tra đổi trả', s => { const r = s.returns.find(r => r.id === id); assert(r && r.status === 'OPEN' && note.trim(), 'Yêu cầu đã xử lý hoặc thiếu kết quả kiểm tra.'); r.status = accept ? 'ACCEPTED' : 'REJECTED'; tell(s, r.customerId, `Yêu cầu ${id}: ${r.status} — ${note}`); }); }
export function receiveReturn(actor: Account, id: string, restock: boolean, expiresAt: string) { roles(actor, ['WAREHOUSE_LOGISTICS', 'WAREHOUSE_STAFF']); transact(actor, id, 'Kho kiểm tra hàng trả', s => { const r = s.returns.find(r => r.id === id); assert(r && r.status === 'ACCEPTED', 'Chưa được CSKH tiếp nhận hoặc đã nhận hàng.'); if (restock) {
    assert(Date.parse(expiresAt + 'T23:59:59') > Date.now(), 'Nhập hạn sử dụng còn hiệu lực.');
    s.lots.push({ id: uid('LOT'), productId: r.productId, qty: r.qty, reserved: 0, receivedAt: now(), expiresAt });
    s.movements.push({ id: uid('MV'), productId: r.productId, qty: r.qty, kind: 'RETURN', referenceId: r.id, at: now(), by: actor.id, note: 'Hàng đã kiểm tra đủ điều kiện nhập lại' });
} r.restock = restock; r.status = r.kind === 'WARRANTY' ? 'CLOSED' : 'RECEIVED'; tell(s, r.customerId, `Kho đã kiểm tra ${r.id}`); }); }
export function reconcile(actor: Account, orderId: string, amount: number) { roles(actor, ['FINANCE_ACCOUNTING']); integer(amount); transact(actor, orderId, 'Đối soát thanh toán', s => { const o = ownOrder(s, orderId); assert(o.status !== 'Đã hủy', 'Không thu tiền đơn đã hủy.'); if ((o.paymentMethod || 'COD') === 'COD')
    assert(o.status === 'Hoàn tất', 'COD chỉ đối soát sau khi đã giao hàng.'); const paid = s.payments.filter(p => p.orderId === orderId && p.kind !== 'REFUND').reduce((n, p) => n + p.amount, 0); assert(amount <= o.total - paid, 'Số tiền vượt khoản phải thu hoặc đã đối soát đủ.'); s.payments.push({ id: uid('PAY'), orderId, amount, at: now(), by: actor.id, kind: (o.paymentMethod || 'COD') === 'COD' ? 'COD' : 'PAYMENT', referenceId: orderId }); if (paid + amount === o.total) {
    o.paymentStatus = 'PAID';
    o.paidAt = now();
} tell(s, o.customerId || '', `Đơn ${orderId} đã ghi nhận ${amount.toLocaleString('vi-VN')}đ`); }); }
export function refund(actor: Account, id: string) { roles(actor, ['FINANCE_ACCOUNTING']); transact(actor, id, 'Hoàn tiền', s => { const r = s.returns.find(r => r.id === id); assert(r && r.status === 'RECEIVED', 'Kho chưa kiểm tra hoặc đã hoàn tiền.'); const o = ownOrder(s, r.orderId), net = s.payments.filter(p => p.orderId === o.id).reduce((n, p) => n + (p.kind === 'REFUND' ? -p.amount : p.amount), 0); assert(net >= r.amount && r.amount > 0, 'Chưa đủ tiền đã thu để hoàn.'); s.payments.push({ id: uid('REFUND'), orderId: o.id, amount: r.amount, at: now(), by: actor.id, kind: 'REFUND', referenceId: r.id }); r.status = 'REFUNDED'; o.refundAmount = (o.refundAmount || 0) + r.amount; o.refundedAt = now(); if (o.refundAmount >= o.total - (o.shippingFee || 0))
    o.paymentStatus = 'REFUNDED'; tell(s, r.customerId, `Đã hoàn ${r.amount.toLocaleString('vi-VN')}đ cho ${r.id}`); }); }
export function paySupplier(actor: Account, id: string, amount: number) { roles(actor, ['FINANCE_ACCOUNTING']); integer(amount); transact(actor, id, 'Thanh toán nhà cung cấp', s => { const p = s.payables.find(p => p.id === id); assert(p && amount <= p.amount - p.paid, 'Khoản trả vượt công nợ còn lại.'); p.paid += amount; s.expenses.push({ id: uid('EXP'), amount, at: now(), referenceId: p.id }); }); }
export function savePublication(actor: Account, value: Omit<Publication, 'id' | 'updatedAt'>, id?: string) { roles(actor, ['PRODUCT_CONTENT']); assert(value.title.trim() && value.body.trim(), 'Nhập tiêu đề và nội dung.'); assert(!value.image || /^(https?:\/\/|\/images\/)/.test(value.image), 'Đường dẫn ảnh không hợp lệ.'); transact(actor, id || 'new', 'Lưu nội dung xuất bản', s => { const existing = s.publications.find(p => p.id === id); assert(!id || existing, 'Không tìm thấy nội dung.'); s.publications = s.publications.filter(p => p.id !== id); s.publications.unshift({ ...value, id: id || uid('PUB'), updatedAt: now() }); }); }
export function markRead(actor: Account) { transact(actor, actor.id, 'Đọc thông báo', s => s.notifications.filter(n => n.userId === actor.id).forEach(n => { n.read = true; })); }
export function setSegmentRules(actor: Account, rules: Store['segmentRules']) { roles(actor, ['CRM_MARKETING', 'SUPPORT_STAFF']); integer(rules.repeat); integer(rules.loyalOrders); integer(rules.loyalSpend, 0); transact(actor, 'segments', 'Cập nhật phân nhóm', s => { s.segmentRules = rules; }); }
export function segments(s = getState()) { const ids = [...new Set(s.orders.map(o => o.customerId || o.customer))]; return ids.map(id => { const orders = s.orders.filter(o => (o.customerId || o.customer) === id && o.status !== 'Đã hủy'); const spend = orders.reduce((n, o) => n + o.total - (o.refundAmount || 0), 0); return { id, name: orders[0]?.customer || id, count: orders.length, spend, last: orders.map(o => o.createdAt || o.date).sort().slice(-1)[0] || '', group: orders.length >= s.segmentRules.loyalOrders && spend >= s.segmentRules.loyalSpend ? 'Khách thân thiết' : orders.length >= s.segmentRules.repeat ? 'Khách mua lại' : 'Khách hàng mới' }; }); }
export function financeTotals(s = getState()) { return { collected: s.payments.filter(p => p.kind !== 'REFUND').reduce((n, p) => n + p.amount, 0), refunds: s.payments.filter(p => p.kind === 'REFUND').reduce((n, p) => n + p.amount, 0), expenses: s.expenses.reduce((n, p) => n + p.amount, 0), payable: s.payables.reduce((n, p) => n + p.amount - p.paid, 0), purchaseCost: s.payables.reduce((n, p) => n + p.amount, 0), cod: s.orders.filter(o => (o.paymentMethod || 'COD') === 'COD' && o.status === 'Hoàn tất').reduce((n, o) => n + Math.max(0, o.total - s.payments.filter(p => p.orderId === o.id && p.kind !== 'REFUND').reduce((x, p) => x + p.amount, 0)), 0) }; }
export function resetStore(actor: Account, confirmation: string) { roles(actor, ['IT', 'ADMIN']); assert(confirmation === 'RESET', 'Nhập RESET để xác nhận.'); localStorage.setItem(`${STORE_KEY}.backup.${Date.now()}`, JSON.stringify(getState())); const s = getState(); const next: Store = { ...s, revision: s.revision + 1, requests: [], orders: [], payments: [], payables: [], expenses: [], returns: [], tickets: [], shipments: [], movements: [], cancellations: [], exceptions: [], notifications: [], auditLogs: [], publications: [], products: catalog.map(p => ({ ...p })), lots: catalog.map(p => ({ id: `LOT-${p.id}`, productId: p.id, qty: 30, reserved: 0, receivedAt: now(), expiresAt: '2028-12-31' })) }; localStorage.setItem(STORE_KEY, JSON.stringify(next)); cache = next; emit(); }
