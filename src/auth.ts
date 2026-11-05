export type Role =
  | "CUSTOMER"
  | "IT"
  | "PRODUCT_CONTENT"
  | "CRM_MARKETING"
  | "WAREHOUSE_LOGISTICS"
  | "ORDER_OPERATIONS"
  | "FINANCE_ACCOUNTING"
  | "ECOM_MANAGER"
  | "ORDER_STAFF"
  | "WAREHOUSE_STAFF"
  | "SUPPORT_STAFF"
  | "MANAGER"
  | "ADMIN";
export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  locked?: boolean;
};
export const ACCOUNT_KEY = "ktht.accounts.v2";
export const SESSION_KEY = "ktht.user";
export const DEMO_PASSWORD = "Demo@123";
const defaults: Account[] = [
  {
    id: "u-customer",
    name: "Nguyễn Minh An",
    email: "khachhang@antam.demo",
    password: DEMO_PASSWORD,
    role: "CUSTOMER",
  },
  {
    id: "u-it",
    name: "Trần Quốc Bảo",
    email: "it@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "IT",
  },
  {
    id: "u-product",
    name: "Lê Minh Trang",
    email: "sanpham@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "PRODUCT_CONTENT",
  },
  {
    id: "u-crm",
    name: "Phạm Thu Hà",
    email: "marketing@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "CRM_MARKETING",
  },
  {
    id: "u-warehouse",
    name: "Võ Hoàng Nam",
    email: "khovan@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "WAREHOUSE_LOGISTICS",
  },
  {
    id: "u-order-ops",
    name: "Đinh Viết Quân",
    email: "donhang@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "ORDER_OPERATIONS",
  },
  {
    id: "u-finance",
    name: "Nguyễn Ngọc Lan",
    email: "ketoan@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "FINANCE_ACCOUNTING",
  },
  {
    id: "u-ecom-manager",
    name: "Nguyễn Hữu Thịnh",
    email: "quanly@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "ECOM_MANAGER",
  },
  // Legacy demo accounts are retained so existing browser sessions continue to work.
  {
    id: "u-order",
    name: "Đinh Viết Quân",
    email: "nhanvien@antam.demo",
    password: DEMO_PASSWORD,
    role: "ORDER_STAFF",
  },
  {
    id: "u-manager",
    name: "Nguyễn Hữu Thịnh",
    email: "quanly@antam.demo",
    password: DEMO_PASSWORD,
    role: "MANAGER",
  },
  {
    id: "u-admin",
    name: "Quản trị V-Pharma",
    email: "admin@vpharma.demo",
    password: DEMO_PASSWORD,
    role: "ADMIN",
  },
];
export const roleLabel: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  IT: "Kỹ thuật (IT)",
  PRODUCT_CONTENT: "Sản phẩm & Nội dung số",
  CRM_MARKETING: "CRM / Marketing / CSKH",
  WAREHOUSE_LOGISTICS: "Kho vận",
  ORDER_OPERATIONS: "Vận hành đơn hàng",
  FINANCE_ACCOUNTING: "Tài chính – Kế toán",
  ECOM_MANAGER: "Quản lý TMĐT",
  ORDER_STAFF: "Nhân viên đơn hàng",
  WAREHOUSE_STAFF: "Nhân viên kho",
  SUPPORT_STAFF: "Nhân viên CSKH",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};
const validRoles = new Set<Role>(Object.keys(roleLabel) as Role[]);
export const accounts = (): Account[] => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(ACCOUNT_KEY) || "[]",
    ) as Account[];
    const valid = [...defaults, ...saved].filter((account) =>
      validRoles.has(account.role),
    );
    const unique = [
      ...new Map(
        valid.map((account) => [account.email.toLowerCase(), account]),
      ).values(),
    ];
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(unique));
    return unique;
  } catch {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(defaults));
    return defaults;
  }
};
export const currentSession = (): Account | null => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null",
    ) as Account | null;
    if (!saved) return null;
    const list = accounts(),
      email = saved.email?.toLowerCase();
    const account =
      (email
        ? list.find((item) => item.email.toLowerCase() === email)
        : undefined) || list.find((item) => item.id === saved.id);
    if (!account || account.locked) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    return account;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};
export const authenticate = (email: string, password: string) => {
  const account = accounts().find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account || account.password !== password)
    return { error: "Email hoặc mật khẩu không đúng." };
  if (account.locked) return { error: "Tài khoản dùng thử đang bị khóa." };
  return { account };
};
export const registerCustomer = (
  name: string,
  email: string,
  password: string,
) => {
  if (
    accounts().some(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
    )
  )
    return { error: "Email này đã được sử dụng." };
  const account: Account = {
    id: `u-${Date.now()}`,
    name,
    email: email.trim(),
    password,
    role: "CUSTOMER",
  };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify([...accounts(), account]));
  return { account };
};
export const isStaff = (role: Role) => role !== "CUSTOMER";
export const isManagement = (role: Role) =>
  ["ECOM_MANAGER", "MANAGER", "ADMIN"].includes(role);
export const canManageOrders = (role: Role) =>
  [
    "ORDER_OPERATIONS",
    "FINANCE_ACCOUNTING",
    "ECOM_MANAGER",
    "ORDER_STAFF",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canManageProducts = (role: Role) =>
  ["PRODUCT_CONTENT", "ECOM_MANAGER", "MANAGER", "ADMIN"].includes(role);
export const canManageWarehouse = (role: Role) =>
  [
    "WAREHOUSE_LOGISTICS",
    "WAREHOUSE_STAFF",
    "ECOM_MANAGER",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canManageInventory = (role: Role) =>
  [
    "PRODUCT_CONTENT",
    "WAREHOUSE_LOGISTICS",
    "ECOM_MANAGER",
    "WAREHOUSE_STAFF",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canManagePromotions = (role: Role) =>
  ["CRM_MARKETING", "ECOM_MANAGER", "MANAGER", "ADMIN"].includes(role);
export const canAccessSupport = (role: Role) =>
  [
    "CRM_MARKETING",
    "ECOM_MANAGER",
    "SUPPORT_STAFF",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canAccessFinance = (role: Role) =>
  ["FINANCE_ACCOUNTING", "ECOM_MANAGER", "MANAGER", "ADMIN"].includes(role);
export const canAccessShipments = (role: Role) =>
  [
    "WAREHOUSE_LOGISTICS",
    "ORDER_OPERATIONS",
    "WAREHOUSE_STAFF",
    "ORDER_STAFF",
    "ECOM_MANAGER",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canAccessReports = (role: Role) =>
  ["FINANCE_ACCOUNTING", "ECOM_MANAGER", "MANAGER", "ADMIN"].includes(role);
export const canManageSystem = (role: Role) =>
  role === "IT" || role === "ADMIN";
export const canSubmitProposals = (role: Role) =>
  [
    "PRODUCT_CONTENT",
    "CRM_MARKETING",
    "ORDER_OPERATIONS",
    "ORDER_STAFF",
    "ECOM_MANAGER",
    "MANAGER",
    "ADMIN",
  ].includes(role);
export const canApproveProposals = (role: Role) => isManagement(role);
export const setAccountLocked = (id: string, locked: boolean) => {
  const next = accounts().map((account) =>
    account.id === id ? { ...account, locked } : account,
  );
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
  return next;
};
