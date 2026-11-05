import { catalog } from "../data/catalog";
import {
  canApproveProposals,
  canSubmitProposals,
  type Account,
  type Role,
} from "../auth";

export type ProposalStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";
export type ProposalEvent = {
  at: string;
  byId: string;
  byName: string;
  status: ProposalStatus;
  note?: string;
};
type Common = {
  id: string;
  kind: "PRICE" | "VOUCHER";
  status: ProposalStatus;
  proposerId: string;
  proposerName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewReason?: string;
  history: ProposalEvent[];
};
export type PriceProposal = Common & {
  kind: "PRICE";
  productId: string;
  productName: string;
  currentPriceSnapshot: number;
  proposedPrice: number;
  applyAt: string;
  reason: string;
};
export type VoucherProposal = Common & {
  kind: "VOUCHER";
  code: string;
  name: string;
  discountKind: "PERCENT" | "FIXED";
  value: number;
  maxDiscount?: number;
  minEligibleAmount: number;
  startsAt: string;
  endsAt: string;
  eligibleProductIds: string[];
  eligibleCategories: string[];
  usageLimit?: number;
  stackWithFlash: boolean;
  reason: string;
};
export type Proposal = PriceProposal | VoucherProposal;
export type ProposalDraftInput =
  | (Omit<
      PriceProposal,
      | keyof Common
      | "kind"
      | "status"
      | "createdAt"
      | "updatedAt"
      | "history"
      | "currentPriceSnapshot"
    > & { kind: "PRICE"; currentPriceSnapshot?: number })
  | (Omit<
      VoucherProposal,
      keyof Common | "kind" | "status" | "createdAt" | "updatedAt" | "history"
    > & { kind: "VOUCHER" });
const KEY = "ktht.proposals.v1";
const nowIso = () => new Date().toISOString();
const read = (): Proposal[] => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
const write = (proposals: Proposal[]) =>
  localStorage.setItem(KEY, JSON.stringify(proposals));
const isManager = (user: Account) => canApproveProposals(user.role);
const currentSalePrice = (productId: string) => {
  const product = catalog.find((item) => item.id === productId);
  if (!product) return undefined;
  const now = Date.now();
  return (
    read()
      .filter(
        (proposal): proposal is PriceProposal =>
          proposal.kind === "PRICE" &&
          proposal.status === "APPROVED" &&
          proposal.productId === productId &&
          Date.parse(proposal.applyAt) <= now,
      )
      .sort(
        (a, b) =>
          Date.parse(b.reviewedAt || b.updatedAt) -
          Date.parse(a.reviewedAt || a.updatedAt),
      )[0]?.proposedPrice ?? product.price
  );
};
const event = (
  user: Account,
  status: ProposalStatus,
  note?: string,
): ProposalEvent => ({
  at: nowIso(),
  byId: user.id,
  byName: user.name,
  status,
  ...(note ? { note } : {}),
});
export const getProposals = () => read();
export const currentApprovedPrice = currentSalePrice;
export const getApprovedVoucherProposals = () =>
  read().filter(
    (proposal): proposal is VoucherProposal =>
      proposal.kind === "VOUCHER" && proposal.status === "APPROVED",
  );
export const countPendingProposals = () =>
  read().filter((proposal) => proposal.status === "PENDING").length;
export const getNotifications = (userId: string) => {
  try {
    return (
      JSON.parse(localStorage.getItem("ktht.notifications.v1") || "[]") as {
        id: string;
        userId: string;
        text: string;
        at: string;
        read: boolean;
      }[]
    ).filter((item) => item.userId === userId);
  } catch {
    return [];
  }
};
export const markNotificationsRead = (userId: string) => {
  try {
    const items = JSON.parse(
      localStorage.getItem("ktht.notifications.v1") || "[]",
    ) as {
      id: string;
      userId: string;
      text: string;
      at: string;
      read: boolean;
    }[];
    localStorage.setItem(
      "ktht.notifications.v1",
      JSON.stringify(
        items.map((item) =>
          item.userId === userId ? { ...item, read: true } : item,
        ),
      ),
    );
  } catch {}
};
const notify = (userId: string, text: string) => {
  try {
    const items = JSON.parse(
      localStorage.getItem("ktht.notifications.v1") || "[]",
    ) as {
      id: string;
      userId: string;
      text: string;
      at: string;
      read: boolean;
    }[];
    localStorage.setItem(
      "ktht.notifications.v1",
      JSON.stringify(
        [
          {
            id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId,
            text,
            at: nowIso(),
            read: false,
          },
          ...items,
        ].slice(0, 200),
      ),
    );
  } catch {}
};
export const saveProposalDraft = (
  user: Account,
  input: ProposalDraftInput,
  id?: string,
) => {
  if (!canSubmitProposals(user.role))
    return { error: "Chỉ nhân viên mới được tạo đề xuất." };
  const previous = id ? read().find((item) => item.id === id) : undefined;
  if (
    id &&
    (!previous ||
      previous.status !== "DRAFT" ||
      previous.proposerId !== user.id)
  )
    return { error: "Chỉ có thể sửa bản nháp của chính bạn." };
  const at = nowIso(),
    base = {
      id: id || `PR-${Date.now()}`,
      status: "DRAFT" as const,
      proposerId: user.id,
      proposerName: user.name,
      createdAt: previous?.createdAt || at,
      updatedAt: at,
      history: previous?.history || [event(user, "DRAFT")],
    };
  let proposal: Proposal;
  if (input.kind === "PRICE") {
    const product = catalog.find((item) => item.id === input.productId);
    if (!product) return { error: "Không tìm thấy sản phẩm." };
    proposal = {
      ...base,
      ...input,
      kind: "PRICE",
      productName: product.name,
      currentPriceSnapshot: currentSalePrice(product.id) ?? product.price,
      proposedPrice: Number(input.proposedPrice),
    };
  } else
    proposal = {
      ...base,
      ...input,
      kind: "VOUCHER",
      code: input.code.trim().replace(/\s+/g, "").toUpperCase(),
      eligibleProductIds: [...new Set(input.eligibleProductIds)],
      eligibleCategories: [...new Set(input.eligibleCategories)],
    };
  const all = read();
  write([proposal, ...all.filter((item) => item.id !== proposal.id)]);
  return { proposal };
};
export const submitProposal = (user: Account, id: string) => {
  if (!canSubmitProposals(user.role))
    return { error: "Chỉ nhân viên mới được gửi đề xuất." };
  const all = read(),
    proposal = all.find((item) => item.id === id);
  if (
    !proposal ||
    proposal.proposerId !== user.id ||
    proposal.status !== "DRAFT"
  )
    return { error: "Chỉ có thể gửi bản nháp của chính bạn." };
  const reason = proposal.reason.trim();
  if (reason.length < 5) return { error: "Vui lòng nhập lý do từ 5 ký tự." };
  if (proposal.kind === "PRICE") {
    if (
      !Number.isSafeInteger(proposal.proposedPrice) ||
      proposal.proposedPrice < 1
    )
      return { error: "Giá đề xuất phải là số nguyên VNĐ dương." };
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(proposal.applyAt) ||
      Number.isNaN(Date.parse(`${proposal.applyAt}T00:00:00`))
    )
      return { error: "Ngày áp dụng không hợp lệ." };
    if (Date.parse(`${proposal.applyAt}T23:59:59`) < Date.now())
      return { error: "Ngày áp dụng không được ở quá khứ." };
    const current = currentSalePrice(proposal.productId);
    if (current === undefined) return { error: "Sản phẩm không còn tồn tại." };
    if (current !== proposal.currentPriceSnapshot)
      return {
        error: "Giá hiện hành đã thay đổi. Hãy rút và tạo lại đề xuất.",
      };
  } else {
    if (!/^[A-Z0-9_-]{3,24}$/.test(proposal.code))
      return { error: "Mã gồm 3–24 ký tự chữ, số, gạch ngang hoặc gạch dưới." };
    if (!proposal.name.trim())
      return { error: "Vui lòng nhập tên chương trình." };
    if (
      !Number.isSafeInteger(proposal.minEligibleAmount) ||
      proposal.minEligibleAmount < 0
    )
      return { error: "Giá trị đơn tối thiểu phải là số nguyên không âm." };
    if (
      proposal.discountKind === "PERCENT" &&
      (!Number.isFinite(proposal.value) ||
        proposal.value <= 0 ||
        proposal.value > 100)
    )
      return { error: "Phần trăm giảm phải lớn hơn 0 và tối đa 100%." };
    if (
      proposal.discountKind === "FIXED" &&
      (!Number.isSafeInteger(proposal.value) ||
        proposal.value < 1 ||
        proposal.value > proposal.minEligibleAmount)
    )
      return {
        error:
          "Mức giảm tiền phải là số nguyên dương và không vượt giá trị đơn tối thiểu.",
      };
    if (
      proposal.maxDiscount !== undefined &&
      (!Number.isSafeInteger(proposal.maxDiscount) ||
        proposal.maxDiscount < 1 ||
        proposal.maxDiscount > proposal.minEligibleAmount)
    )
      return { error: "Mức giảm tối đa không hợp lệ." };
    const start = Date.parse(proposal.startsAt),
      end = Date.parse(proposal.endsAt);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start >= end ||
      end < Date.now()
    )
      return {
        error: "Khoảng thời gian khuyến mãi không hợp lệ hoặc đã kết thúc.",
      };
    if (
      !proposal.eligibleProductIds.length &&
      !proposal.eligibleCategories.length
    )
      return { error: "Chọn ít nhất một sản phẩm hoặc danh mục đủ điều kiện." };
    if (
      proposal.usageLimit !== undefined &&
      (!Number.isSafeInteger(proposal.usageLimit) || proposal.usageLimit < 1)
    )
      return { error: "Giới hạn sử dụng phải là số nguyên dương." };
    const code = proposal.code.toUpperCase();
    const seeded = ["VPHARMA50", "HELLO10"];
    if (
      seeded.includes(code) ||
      JSON.parse(localStorage.getItem("ktht.vouchers") || "[]").some(
        (item: { code: string }) => item.code === code,
      ) ||
      all.some(
        (item) =>
          item.id !== id &&
          item.kind === "VOUCHER" &&
          item.code === code &&
          ["PENDING", "APPROVED"].includes(item.status),
      )
    )
      return { error: "Mã đã tồn tại hoặc đang chờ duyệt." };
  }
  const at = nowIso(),
    next = {
      ...proposal,
      status: "PENDING" as const,
      updatedAt: at,
      submittedAt: at,
      history: [...proposal.history, event(user, "PENDING")],
    };
  write(all.map((item) => (item.id === id ? next : item)));
  try {
    const accountList = JSON.parse(
      localStorage.getItem("ktht.accounts.v2") || "[]",
    ) as Account[];
    accountList
      .filter((item) => isManager(item))
      .forEach((manager) =>
        notify(
          manager.id,
          `${user.name} gửi đề xuất ${proposal.kind === "PRICE" ? "giá bán" : "mã khuyến mãi"}: ${proposal.kind === "PRICE" ? proposal.productName : proposal.code}`,
        ),
      );
  } catch {}
  return { proposal: next };
};
export const withdrawProposal = (user: Account, id: string) => {
  const all = read(),
    proposal = all.find((item) => item.id === id);
  if (
    !canSubmitProposals(user.role) ||
    !proposal ||
    proposal.proposerId !== user.id ||
    proposal.status !== "PENDING"
  )
    return { error: "Chỉ có thể rút đề xuất đang chờ của chính bạn." };
  const at = nowIso(),
    next = {
      ...proposal,
      status: "WITHDRAWN" as const,
      updatedAt: at,
      history: [...proposal.history, event(user, "WITHDRAWN")],
    };
  write(all.map((item) => (item.id === id ? next : item)));
  return { proposal: next };
};
export const decideProposal = (
  user: Account,
  id: string,
  decision: "APPROVED" | "REJECTED",
  reason = "",
) => {
  if (!isManager(user)) return { error: "Bạn không có quyền duyệt đề xuất." };
  const all = read(),
    proposal = all.find((item) => item.id === id);
  if (!proposal || proposal.status !== "PENDING")
    return { error: "Đề xuất không còn ở trạng thái chờ duyệt." };
  if (proposal.proposerId === user.id)
    return { error: "Không thể duyệt đề xuất của chính mình." };
  if (decision === "REJECTED" && reason.trim().length < 3)
    return { error: "Lý do từ chối bắt buộc phải có ít nhất 3 ký tự." };
  if (decision === "APPROVED") {
    if (
      proposal.kind === "PRICE" &&
      currentSalePrice(proposal.productId) !== proposal.currentPriceSnapshot
    )
      return { error: "Giá hiện hành đã thay đổi; cần xem xét lại đề xuất." };
    if (proposal.kind === "VOUCHER") {
      const code = proposal.code.toUpperCase(),
        vouchers = JSON.parse(
          localStorage.getItem("ktht.vouchers") || "[]",
        ) as { code: string }[];
      if (
        ["VPHARMA50", "HELLO10"].includes(code) ||
        vouchers.some((item) => item.code.toUpperCase() === code)
      )
        return {
          error: "Mã vừa được tạo ở nơi khác; cần xem xét lại đề xuất.",
        };
      if (Date.parse(proposal.endsAt) <= Date.now())
        return { error: "Thời hạn đề xuất đã kết thúc; cần xem xét lại." };
    }
  }
  const at = nowIso(),
    next = {
      ...proposal,
      status: decision,
      updatedAt: at,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewedAt: at,
      reviewReason: reason.trim() || undefined,
      history: [
        ...proposal.history,
        event(user, decision, reason.trim() || undefined),
      ],
    } as Proposal;
  write(all.map((item) => (item.id === id ? next : item)));
  notify(
    proposal.proposerId,
    `Đề xuất ${proposal.kind === "PRICE" ? "giá bán" : "mã khuyến mãi"} ${proposal.kind === "PRICE" ? proposal.productName : proposal.code} đã ${decision === "APPROVED" ? "được duyệt" : "bị từ chối"}${reason.trim() ? `: ${reason.trim()}` : ""}.`,
  );
  return { proposal: next };
};
export const refreshSchedule = () => {
  const proposals = read(),
    now = Date.now();
  return proposals.filter(
    (proposal) =>
      proposal.kind === "PRICE" &&
      proposal.status === "APPROVED" &&
      Date.parse(proposal.applyAt) <= now,
  ).length;
};
