export type Role='CUSTOMER'|'ORDER_STAFF'|'WAREHOUSE_STAFF'|'SUPPORT_STAFF'|'MANAGER'|'ADMIN';
export type Account={id:string;name:string;email:string;password:string;role:Role;locked?:boolean};
export const ACCOUNT_KEY='ktht.accounts.v2';export const SESSION_KEY='ktht.user';
const defaults:Account[]=[
 {id:'u-customer',name:'Nguyễn Minh An',email:'khachhang@antam.demo',password:'Demo@123',role:'CUSTOMER'},
 {id:'u-order',name:'Đinh Viết Quân',email:'nhanvien@antam.demo',password:'Demo@123',role:'ORDER_STAFF'},
 {id:'u-manager',name:'Nguyễn Hữu Thịnh',email:'quanly@antam.demo',password:'Demo@123',role:'MANAGER'}
];
export const roleLabel:Record<Role,string>={CUSTOMER:'Khách hàng',ORDER_STAFF:'Nhân viên',WAREHOUSE_STAFF:'Nhân viên kho',SUPPORT_STAFF:'Nhân viên CSKH',MANAGER:'Quản lý',ADMIN:'Quản trị viên'};
export const accounts=():Account[]=>{try{const saved=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'[]') as Account[];const merged=[...defaults,...saved].map(a=>a.email==='donhang@antam.demo'?{...a,id:'u-manager',name:'Nguyễn Hữu Thịnh',email:'quanly@antam.demo',role:'MANAGER' as const}:a.email==='nhanvien@antam.demo'?{...a,name:'Đinh Viết Quân'}:a.email==='quanly@antam.demo'?{...a,name:'Nguyễn Hữu Thịnh'}:a);const valid=merged.filter(a=>['CUSTOMER','ORDER_STAFF','WAREHOUSE_STAFF','SUPPORT_STAFF','MANAGER','ADMIN'].includes(a.role));const unique=[...new Map(valid.map(a=>[a.email.toLowerCase(),a])).values()];localStorage.setItem(ACCOUNT_KEY,JSON.stringify(unique));return unique}catch{localStorage.setItem(ACCOUNT_KEY,JSON.stringify(defaults));return defaults}};
export const currentSession=():Account|null=>{try{const saved=JSON.parse(localStorage.getItem(SESSION_KEY)||'null') as Account|null;if(!saved)return null;const list=accounts();const email=saved.email?.toLowerCase();const account=(email?list.find(item=>item.email.toLowerCase()===email):undefined)||list.find(item=>item.id===saved.id);if(!account||account.locked){localStorage.removeItem(SESSION_KEY);return null}localStorage.setItem(SESSION_KEY,JSON.stringify(account));return account}catch{localStorage.removeItem(SESSION_KEY);return null}};
export const authenticate=(email:string,password:string)=>{const a=accounts().find(x=>x.email.toLowerCase()===email.trim().toLowerCase());if(!a||a.password!==password)return {error:'Email hoặc mật khẩu không đúng.'};if(a.locked)return {error:'Tài khoản dùng thử đang bị khóa.'};return {account:a};};
export const registerCustomer=(name:string,email:string,password:string)=>{if(accounts().some(a=>a.email.toLowerCase()===email.trim().toLowerCase()))return {error:'Email này đã được sử dụng.'};const account:Account={id:`u-${Date.now()}`,name,email:email.trim(),password,role:'CUSTOMER'};localStorage.setItem(ACCOUNT_KEY,JSON.stringify([...accounts(),account]));return {account};};
export const isStaff=(role:Role)=>role!=='CUSTOMER';
export const canManageOrders=(role:Role)=>role==='ORDER_STAFF'||role==='MANAGER'||role==='ADMIN';
export const setAccountLocked=(id:string,locked:boolean)=>{const next=accounts().map(account=>account.id===id?{...account,locked}:account);localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));return next;};
