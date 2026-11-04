# Danh mục 40 màn hình

Đã đọc `docs/source/yeu-cau-trien-khai.pdf`. Toàn bộ là frontend mock/localStorage; owner: Codex, reviewer: sequential-self-review. Tiêu chí chung: responsive, tiếng Việt, validation và trạng thái loading/empty/error/forbidden phù hợp.

| ID | Route · mục tiêu | Role/module mock · dependency | TT |
|---|---|---|---|
| C01 | `/` Trang chủ | Khách/catalog · C02 | IMPLEMENTED |
| C02 | `/products` Danh sách SP | Khách/catalog · C03; tìm/lọc/sắp xếp/phân trang | IMPLEMENTED* |
| C03 | `/products/:slug` Chi tiết SP | Khách/catalog · C04; SKU/giá/quy tắc hạn chế | IMPLEMENTED* |
| C04 | `/cart` Giỏ hàng | Khách/cart localStorage · C05 | IMPLEMENTED |
| C05 | `/checkout` Đặt hàng | Khách/order mock · C04; validation/thanh toán mô phỏng | IMPLEMENTED* |
| C06 | `/checkout/result/:orderId` Kết quả | Khách/order mock · C05; không mặc định thanh toán | IMPLEMENTED |
| C07 | `/login` Đăng nhập | Khách/Admin/session mock · route guard/lỗi demo | IMPLEMENTED* |
| C08 | `/register` Đăng ký | Khách/session mock · validation | IMPLEMENTED* |
| C09 | `/account` Tài khoản/địa chỉ | Khách/profile mock · C10; modal/drawer | PLANNED |
| C10 | `/account/orders` Đơn của tôi | Khách/order mock · C11; ownership/tìm/lọc/trang | IMPLEMENTED* |
| C11 | `/account/orders/:id` Chi tiết đơn | Khách/order mock · C10; trạng thái/lịch sử/hậu mãi | IMPLEMENTED* |
| C12 | `/account/requests` Hậu mãi | Khách/requests mock · C13; tab loại yêu cầu | PLANNED |
| C13 | `/account/requests/:id` Chi tiết yêu cầu | Khách/requests mock · C12 | PLANNED |
| A01 | `/admin` Dashboard | Admin/order mock · A05; KPI/cảnh báo/nguồn | IMPLEMENTED* |
| A02 | `/admin/products` Danh sách SP | Admin/catalog mock · A03; tìm/lọc/trạng thái | PLANNED |
| A03 | `/admin/products/:id`, `/new` Chi tiết SP | Admin/catalog mock · A02; SKU/giá/validation | PLANNED |
| A04 | `/admin/categories` Danh mục | Admin/catalog mock · A02; modal | PLANNED |
| A05 | `/admin/orders` Danh sách đơn | Admin/order mock · A06; lọc | IMPLEMENTED* |
| A06 | `/admin/orders/:id` Xử lý đơn | Admin/order mock · A05; transition hợp lệ | IMPLEMENTED* |
| A07 | `/admin/customers` Khách hàng | Admin/customer mock · A08 | PLANNED |
| A08 | `/admin/customers/:id` Chi tiết KH | Admin/customer/order mock · A07 | PLANNED |
| A09 | `/admin/inventory` Tồn kho | Admin/inventory mock · SKU-kho/loại tồn | PLANNED |
| A10 | `/admin/inventory/documents` Chứng từ | Admin/inventory mock · A11 | PLANNED |
| A11 | `/admin/inventory/documents/:id`, `/new` Chi tiết CT | Admin/inventory mock · A10 | PLANNED |
| A12 | `/admin/inventory/reservations` Giữ hàng | Admin/inventory mock · đơn/chứng từ | PLANNED |
| A13 | `/admin/channels` Kênh bán | Admin/channel mock · drawer/hạn mức | PLANNED |
| A14 | `/admin/integrations` Tích hợp | Admin/integration mock · retry an toàn | PLANNED |
| A15 | `/admin/shipments` Vận đơn | Admin/shipment mock · A16 | PLANNED |
| A16 | `/admin/shipments/:id` Chi tiết vận đơn | Admin/shipment mock · A15/timeline | PLANNED |
| A17 | `/admin/returns` Đổi trả | Admin/returns mock · A18 | PLANNED |
| A18 | `/admin/returns/:id` Xử lý đổi trả | Admin/returns mock · A17 | PLANNED |
| A19 | `/admin/warranties` Bảo hành | Admin/warranty mock · A20 | PLANNED |
| A20 | `/admin/warranties/:id` Xử lý BH | Admin/warranty mock · A19 | PLANNED |
| A21 | `/admin/support` Ticket CSKH | Admin/support mock · A22 | PLANNED |
| A22 | `/admin/support/:id` Chi tiết ticket | Admin/support mock · A21/internal note | PLANNED |
| A23 | `/admin/payments` Thanh toán | Admin/payment mock · refund chống trùng | PLANNED |
| A24 | `/admin/reports` Báo cáo | Admin/report mock · filter/KPI | PLANNED |
| A25 | `/admin/users` Nhân viên/quyền | Admin/user mock · modal/quyền demo | PLANNED |
| A26 | `/admin/settings` Cấu hình/audit | Admin/settings mock · tab/không lộ bí mật | PLANNED |
| A27 | `/admin/simulator` Trung tâm mô phỏng | Admin/simulator mock · chỉ demo/kịch bản | PLANNED |

`*` Có FE1 nhưng chưa đủ toàn bộ acceptance criteria PDF, nên không VERIFIED. Tổng: IMPLEMENTED 13, PLANNED 27, IN_PROGRESS 0, VERIFIED 0.
