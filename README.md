# V-pharma — Frontend mô phỏng

Frontend mô phỏng thương hiệu V-pharma, xây bằng React + TypeScript + Vite và React Router. Bản này chỉ mô phỏng trình duyệt: không có backend, API, SQL Server hay bảo mật thật. Giỏ hàng, phiên mô phỏng và đơn hàng dùng `localStorage`; vì vậy đơn khách tạo sẽ xuất hiện ở quản trị trong cùng trình duyệt.

## Cài và chạy (PowerShell)

Chạy tại thư mục gốc dự án:

```powershell
npm install
npm run dev
```

Mở URL Vite in trong terminal (thông thường `http://localhost:5173`). Kiểm tra bản production bằng `npm run build`.

## Triển khai GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` tự build và deploy lên GitHub Pages khi push lên nhánh `main` hoặc chạy thủ công. Vào **Settings → Pages**, chọn **GitHub Actions** làm nguồn deploy. Giả định triển khai là project site của repository này, với URL `https://quandvq.github.io/KTHT_FE_demo/`; nếu đổi tên repository hoặc dùng custom domain, cần cập nhật `base` trong `vite.config.ts`. Ứng dụng dùng hash routing để các đường dẫn con hoạt động khi làm mới trang; URL có dạng `https://quandvq.github.io/KTHT_FE_demo/#/products`. Ảnh và tệp tĩnh được phục vụ từ base path của repository.

## Nhập lại catalog sản phẩm

Nguồn Excel nằm tại `docs/source/pharmacity_products_2026-11-03.xlsx`. Sau khi thay file, chạy `npm run import:catalog`. Lệnh tạo `src/data/catalog.ts`, tải ảnh từ đúng `image_url` vào `public/images/products`, và ghi thống kê lỗi vào `docs/source/catalog-import-report.json`.

Catalog là dữ liệu mô phỏng từ Excel: mô tả, giá và tình trạng kiểm chứng không phải thông tin chuyên môn đã xác minh. Sản phẩm đều ở trạng thái “Cần xác minh” trước khi mua online; ứng dụng không suy diễn quyền bán hàng từ tên hoặc danh mục.

## Tài khoản dùng thử và quyền

Mật khẩu chung cho tất cả tài khoản là `Demo@123`: `khachhang@antam.demo` (Khách hàng), `donhang@antam.demo` (Nhân viên đơn hàng), `kho@antam.demo` (Nhân viên kho), `cskh@antam.demo` (Nhân viên CSKH), `quanly@antam.demo` (Quản lý), `admin@antam.demo` (Quản trị viên).

Vai trò được xác định từ bản ghi tài khoản mock, không có checkbox tự nâng quyền. Khách chỉ vào storefront; nhân viên vào `/admin` với menu theo quyền; customer mở `/admin` nhận 403. Đây chỉ là kiểm tra phía client/localStorage, không phải cơ chế bảo mật thực.

## Phạm vi

FE1 hoàn thành C01–C10 và A01–A03: duyệt sản phẩm, sản phẩm hạn chế bán online, giỏ hàng, checkout không mặc định thanh toán, tạo/xem/xử lý đơn mô phỏng. Các màn hình còn lại được ghi `PLANNED` trong [page-inventory.md](docs/ui/page-inventory.md). FE2: hàng hóa/kho/kênh; FE3: giao vận–CSKH; FE4: thanh toán–báo cáo–cấu hình.

Đã đọc và đối chiếu nguồn yêu cầu [yeu-cau-trien-khai.pdf](docs/source/yeu-cau-trien-khai.pdf). Danh mục 40 route chuẩn và trạng thái thực tế nằm trong [page-inventory.md](docs/ui/page-inventory.md).



## Flash Sale và mã khuyến mãi (mô phỏng frontend)

Flash Sale có thời gian cố định trong `src/promotions.ts`, do đó đồng hồ không khởi động lại khi tải trang; hết thời hạn, giá tự trở về giá catalog.

- `VPHARMA50`: giảm 50.000đ trên tổng giá trị hàng đủ điều kiện từ 300.000đ.
- `HELLO10`: giảm 10%, tối đa 80.000đ, trên tổng giá trị hàng đủ điều kiện từ 200.000đ.
- Mỗi đơn chỉ dùng một mã. Mã mặc định không giảm thêm dòng Flash Sale; phí giao hàng hiện là 0đ trong mô phỏng.

Mã, giỏ hàng, lượt dùng và đơn hàng được lưu trong `localStorage`. Đây chỉ là hành vi frontend mô phỏng, không phải kiểm soát khuyến mãi hay thanh toán bảo mật.

## Góc sức khỏe

`/goc-suc-khoe` và `/goc-suc-khoe/:slug` là hai trang nội dung frontend. Sáu bài hiện đang ở trạng thái xuất bản, dùng minh họa SVG nội bộ và có liên kết nguồn trực tiếp trong từng bài: WHO (dinh dưỡng, sức khỏe răng miệng), CDC (giấc ngủ) và FDA (bảo quản thuốc, thiết bị dùng tại nhà).

Nội dung được viết lại để cung cấp thông tin chung, không phải tư vấn, chẩn đoán, liều dùng hoặc khuyến nghị điều trị cá nhân. Các bài và nguồn được quản lý tập trung tại `src/data/health-articles.ts`.
