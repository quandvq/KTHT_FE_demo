import { getState, priceOf } from './workflow/store';
export type SaleProduct = {
    id: string;
    category: string;
    price: number;
};
export type SaleLine = {
    product: SaleProduct;
    qty: number;
};
export type Voucher = {
    id: string;
    code: string;
    name: string;
    active: boolean;
    startsAt: string;
    endsAt: string;
    kind: 'PERCENT' | 'FIXED';
    value: number;
    maxDiscount?: number;
    minEligibleAmount: number;
    thresholdBasis?: 'BEFORE_FLASH' | 'AFTER_FLASH';
    eligibleProductIds?: string[];
    eligibleCategories?: string[];
    audiences?: string[];
    usageLimit?: number;
    perCustomerLimit?: number;
    stackWithFlash: boolean;
};
export type FlashCampaign = {
    id: string;
    name: string;
    active: boolean;
    startsAt: string;
    endsAt: string;
    productIds: string[];
    percentOff: number;
    quantityLimit?: number;
    sold: number;
    stackWithVoucher: boolean;
};
export type AppliedVoucher = {
    code: string;
    voucherId: string;
};
export type PromotionTotals = {
    subtotal: number;
    flashDiscount: number;
    voucherDiscount: number;
    shipping: number;
    total: number;
    linePrices: Record<string, number>;
    lineVoucherDiscounts: Record<string, number>;
    eligibleVoucherTotal: number;
    message?: string;
};
export const flashCampaign: FlashCampaign = { id: 'FLASH-NOV-2026', name: 'Flash Sale chăm sóc cá nhân tháng 11', active: true, startsAt: '2026-11-01T00:00:00+07:00', endsAt: '2026-11-30T23:59:59+07:00', productIds: ['PC-DEMO-0001', 'PC-DEMO-0002', 'PC-DEMO-0003'], percentOff: 15, quantityLimit: 60, sold: 0, stackWithVoucher: false };
export const voucherSeeds: Voucher[] = [{ id: 'VCH-50K-NOV', code: 'VPHARMA50', name: 'Giảm 50.000đ đơn từ 300.000đ', active: true, startsAt: '2026-11-01T00:00:00+07:00', endsAt: '2026-11-30T23:59:59+07:00', kind: 'FIXED', value: 50000, minEligibleAmount: 300000, thresholdBasis: 'BEFORE_FLASH', audiences: ['CUSTOMER'], usageLimit: 100, perCustomerLimit: 1, stackWithFlash: false }, { id: 'VCH-HELLO10-NOV', code: 'HELLO10', name: 'Giảm 10% tối đa 80.000đ', active: true, startsAt: '2026-11-01T00:00:00+07:00', endsAt: '2026-11-30T23:59:59+07:00', kind: 'PERCENT', value: 10, maxDiscount: 80000, minEligibleAmount: 200000, thresholdBasis: 'BEFORE_FLASH', audiences: ['CUSTOMER'], usageLimit: 200, perCustomerLimit: 1, stackWithFlash: false }];
export const normalizeVoucher = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();
export const getFlashCampaigns = (): FlashCampaign[] => [flashCampaign, ...getState().requests.filter(r => r.type === 'FLASH' && r.status === 'APPROVED').map(r => ({ id: r.id, name: r.title, active: true, startsAt: r.proposedValue.startsAt!, endsAt: r.proposedValue.endsAt!, productIds: r.proposedValue.category ? getState().products.filter(p => p.category === r.proposedValue.category).map(p => p.id) : r.proposedValue.productIds || [], percentOff: r.proposedValue.value!, sold: 0, quantityLimit: r.proposedValue.limit, stackWithVoucher: false }))];
const campaignActive = (c: FlashCampaign, now: number) => c.active && now >= Date.parse(c.startsAt) && now <= Date.parse(c.endsAt) && (!c.quantityLimit || getState().orders.filter(o => (o.createdAt || '') >= c.startsAt && o.status !== 'Đã hủy').flatMap(o => o.lines).filter(l => c.productIds.includes(l.product.id)).reduce((n, l) => n + l.qty, 0) < c.quantityLimit);
export const isFlashActive = (now = Date.now()) => getFlashCampaigns().some(c => campaignActive(c, now));
export const flashPrice = (p: SaleProduct, now = Date.now()) => { const base = priceOf(p.id, p.price); const discount = Math.max(0, ...getFlashCampaigns().filter(c => campaignActive(c, now) && c.productIds.includes(p.id)).map(c => c.percentOff)); return Math.round(base * (100 - discount) / 100); };
export const getVouchers = (): Voucher[] => { const s = getState(); const legacy = s.legacy['ktht.vouchers']; const seeds = Array.isArray(legacy) ? legacy as Voucher[] : voucherSeeds; return [...seeds, ...s.requests.filter(r => r.type === 'CAMPAIGN' && r.status === 'APPROVED').map(r => ({ id: r.id, code: r.proposedValue.code!, name: r.title, active: true, startsAt: r.proposedValue.startsAt!, endsAt: r.proposedValue.endsAt!, kind: r.proposedValue.kind || 'PERCENT', value: r.proposedValue.value!, minEligibleAmount: r.proposedValue.min || 0, maxDiscount: r.proposedValue.max, usageLimit: r.proposedValue.limit, eligibleProductIds: r.proposedValue.category ? undefined : r.proposedValue.productIds, eligibleCategories: r.proposedValue.category ? [r.proposedValue.category] : undefined, thresholdBasis: 'BEFORE_FLASH' as const, stackWithFlash: false }))]; };
export const saveVouchers = (_vouchers: Voucher[]) => { throw new Error('Vui lòng gửi chương trình qua Trung tâm phê duyệt.'); };
export const voucherUses = () => Object.fromEntries(getVouchers().map(v => [v.id, getState().orders.filter(o => o.coupon === v.code).map(o => o.customerId || '')]));
const eligibleLines = (v: Voucher, lines: SaleLine[], now: number) => lines.filter(l => (!v.eligibleProductIds?.length || v.eligibleProductIds.includes(l.product.id)) && (!v.eligibleCategories?.length || v.eligibleCategories.includes(l.product.category)) && (v.stackWithFlash || flashPrice(l.product, now) === priceOf(l.product.id, l.product.price)));
export const validateVoucher = (input: string, lines: SaleLine[], role: string | undefined, customerId: string | undefined, now = Date.now()) => { const voucher = getVouchers().find(v => v.code === normalizeVoucher(input)); if (!voucher)
    return { error: 'Mã khuyến mãi không tồn tại.' } as const; if (!voucher.active || now < Date.parse(voucher.startsAt) || now > Date.parse(voucher.endsAt))
    return { error: 'Mã chưa có hiệu lực hoặc đã hết hạn.' } as const; if (voucher.audiences?.length && (!role || !voucher.audiences.includes(role)))
    return { error: 'Mã không áp dụng cho tài khoản hiện tại.' } as const; const uses = voucherUses()[voucher.id] || []; if (voucher.usageLimit !== undefined && uses.length >= voucher.usageLimit)
    return { error: 'Mã đã hết lượt sử dụng.' } as const; if (voucher.perCustomerLimit !== undefined && uses.filter(id => id === customerId).length >= voucher.perCustomerLimit)
    return { error: 'Bạn đã dùng hết lượt mã này.' } as const; const eligible = eligibleLines(voucher, lines, now), amount = eligible.reduce((n, l) => n + (voucher.thresholdBasis === 'AFTER_FLASH' ? flashPrice(l.product, now) : priceOf(l.product.id, l.product.price)) * l.qty, 0); if (!eligible.length || amount < voucher.minEligibleAmount)
    return { error: 'Giá trị hàng đủ điều kiện chưa đạt ' + voucher.minEligibleAmount.toLocaleString('vi-VN') + 'đ.' } as const; return { voucher } as const; };
export const calculatePromotion = (lines: SaleLine[], applied: AppliedVoucher | null, role?: string, customerId?: string, now = Date.now()): PromotionTotals => { const linePrices: Record<string, number> = {}, lineVoucherDiscounts: Record<string, number> = {}; let subtotal = 0, flashDiscount = 0, voucherDiscount = 0, eligibleVoucherTotal = 0, message: string | undefined; for (const l of lines) {
    const base = priceOf(l.product.id, l.product.price), price = flashPrice(l.product, now);
    linePrices[l.product.id] = price;
    subtotal += base * l.qty;
    flashDiscount += (base - price) * l.qty;
} if (applied) {
    const check = validateVoucher(applied.code, lines, role, customerId, now);
    if ('error' in check)
        message = check.error;
    else {
        const v = check.voucher, eligible = eligibleLines(v, lines, now);
        eligibleVoucherTotal = eligible.reduce((n, l) => n + linePrices[l.product.id] * l.qty, 0);
        const raw = v.kind === 'PERCENT' ? Math.round(eligibleVoucherTotal * v.value / 100) : v.value;
        voucherDiscount = Math.min(raw, v.maxDiscount ?? raw, eligibleVoucherTotal);
        let allocated = 0;
        eligible.forEach((l, i) => { const discount = i === eligible.length - 1 ? voucherDiscount - allocated : Math.floor(voucherDiscount * linePrices[l.product.id] * l.qty / eligibleVoucherTotal); lineVoucherDiscounts[l.product.id] = discount; allocated += discount; });
    }
} return { subtotal, flashDiscount, voucherDiscount, shipping: 0, total: Math.max(0, subtotal - flashDiscount - voucherDiscount), linePrices, lineVoucherDiscounts, eligibleVoucherTotal, message }; };
export const recordVoucherUse = (_id: string, _customerId?: string) => { };
