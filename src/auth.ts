export type Role='CUSTOMER'|'ORDER_STAFF'|'WAREHOUSE_STAFF'|'SUPPORT_STAFF'|'MANAGER'|'ADMIN';
export type Account={id:string;name:string;email:string;password:string;role:Role;locked?:boolean};
export const ACCOUNT_KEY='ktht.accounts.v2';export const SESSION_KEY='ktht.user';
const defaults:Account[]=[
 {id:'u-customer',name:'Nguyễn Minh An',email:'khachhang@antam.demo',password:'Demo@123',role:'CUSTOMER'},
 {id:'u-order',name:'Lê Hoàng',email:'nhanvien@antam.demo',password:'Demo@123',role:'ORDER_STAFF'},
 {id:'u-manager',name:'Vũ Quản Lý',email:'quanly@antam.demo',password:'Demo@123',role:'MANAGER'}
];
export const roleLabel:Record<Role,string>={CUSTOMER:'Khách hàng',ORDER_STAFF:'Nhân viên',WAREHOUSE_STAFF:'Nhân viên kho',SUPPORT_STAFF:'Nhân viên CSKH',MANAGER:'Quản lý',ADMIN:'Quản trị viên'};
export const accounts=():Account[]=>{try{const saved=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'[]') as Account[];const allowed=saved.filter(a=>a.role==='CUSTOMER'||a.role==='ORDER_STAFF'||a.role==='MANAGER').map(a=>a.email==='donhang@antam.demo'?{...a,email:'nhanvien@antam.demo'}:a);if(allowed.length){localStorage.setItem(ACCOUNT_KEY,JSON.stringify(allowed));return allowed}}catch{}localStorage.setItem(ACCOUNT_KEY,JSON.stringify(defaults));return defaults};
export const authenticate=(email:string,password:string)=>{const a=accounts().find(x=>x.email.toLowerCase()===email.trim().toLowerCase());if(!a||a.password!==password)return {error:'Email hoặc mật khẩu không đúng.'};if(a.locked)return {error:'Tài khoản dùng thử đang bị khóa.'};return {account:a};};
export const registerCustomer=(name:string,email:string,password:string)=>{if(accounts().some(a=>a.email.toLowerCase()===email.trim().toLowerCase()))return {error:'Email này đã được sử dụng.'};const account:Account={id:`u-${Date.now()}`,name,email:email.trim(),password,role:'CUSTOMER'};localStorage.setItem(ACCOUNT_KEY,JSON.stringify([...accounts(),account]));return {account};};
export const isStaff=(role:Role)=>role!=='CUSTOMER';
export const canManageOrders=(role:Role)=>role==='ORDER_STAFF'||role==='MANAGER'||role==='ADMIN';
export const setAccountLocked=(id:string,locked:boolean)=>{const next=accounts().map(account=>account.id===id?{...account,locked}:account);localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));return next;};
