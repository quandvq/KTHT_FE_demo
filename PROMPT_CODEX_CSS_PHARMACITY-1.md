# Prompt cho Codex: xây dựng CSS cho project E-commerce

## Cách sử dụng

Mở project trong VS Code, đưa file này vào project rồi gửi cho Codex:

> Đọc PROMPT_CODEX_CSS_PHARMACITY.md và thực hiện yêu cầu trong file. Kiểm tra code hiện tại trước, sau đó tạo và tích hợp CSS phù hợp với project. Hãy triển khai trực tiếp, kiểm tra kết quả và báo cáo các file đã thay đổi.

Phần bên dưới là prompt đầy đủ, có thể sao chép trực tiếp vào Codex.

---

## Vai trò và mục tiêu

Bạn là Frontend Engineer có kinh nghiệm về UI/UX và CSS cho website thương mại điện tử. Hãy trực tiếp xây dựng hệ thống CSS cho project đang mở, lấy phong cách giao diện Pharmacity làm tham chiếu: xanh dương, nền sáng, phân cấp chữ rõ ràng, tìm kiếm nổi bật, thẻ sản phẩm đồng nhất và nút thao tác dễ nhận biết.

Mục tiêu là tạo CSS có thể sử dụng thật trong project, không chỉ đưa code minh họa hoặc đề xuất kế hoạch. Giữ thương hiệu, nội dung, dữ liệu và nghiệp vụ của project; không sao chép logo, hình quảng cáo hoặc nội dung sản phẩm Pharmacity.

## 1. Kiểm tra project trước khi viết

1. Đọc README, AGENTS.md và các chỉ dẫn áp dụng trong repository.
2. Kiểm tra package.json hoặc cấu hình tương đương, framework, cấu trúc frontend, CSS hiện tại và điểm import stylesheet.
3. Xác định project đang dùng CSS thuần, SCSS, CSS Modules, Bootstrap, Tailwind hay thư viện UI khác. Không tự ý đổi framework hoặc thêm thư viện chỉ để thực hiện giao diện.
4. Kiểm tra các component/trang hiện có: header, tìm kiếm, danh mục, banner, danh sách sản phẩm, chi tiết sản phẩm, giỏ hàng và biểu mẫu.
5. Kiểm tra thay đổi đang có trong working tree; bảo toàn công việc của người dùng.
6. Chọn đường dẫn stylesheet theo cấu trúc thật. Nếu chưa có quy ước, dùng `src/styles/storefront-theme.css` hoặc thư mục assets CSS tương ứng của framework. Nếu đã có theme, mở rộng nó thay vì tạo hệ thống trùng lặp.

Không giả định selector trong tài liệu này đã tồn tại. Phải đối chiếu DOM/component rồi viết selector thực sự được sử dụng. Nếu cần, bổ sung class hoặc wrapper tối thiểu để tích hợp CSS. Không thay đổi API, backend, DB, xác thực, tính giá, tính tồn kho hoặc hành vi đặt hàng.

## 2. Cơ sở tham chiếu và giới hạn

Nguồn tham chiếu: https://www.pharmacity.vn/

Thông số được khảo sát ngày 02/11/2026 trên trang chủ desktop, viewport 1363 × 936 CSS px. Đây là mẫu đo giao diện, không phải design system chính thức hoặc đặc tả đầy đủ toàn website.

### Thông số đã đo

| Thành phần | Giá trị |
| --- | --- |
| Font | Inter, sans-serif |
| Body | 16px / 24px, weight 400 |
| Tiêu đề section | 28px / 34px, weight 600 |
| Tên danh mục | 16px / 22px, weight 400 |
| Tên sản phẩm | 14px / 20px, weight 500; giới hạn 2 dòng |
| Chữ nút mua | 16px / 22px, weight 600 |
| Header desktop | 120px tổng: tiện ích 36px + điều hướng 84px |
| Header | sticky, top: 0 |
| Container header | max-width 1384px; padding ngang 16px |
| Container nội dung mẫu | 1232px gồm padding; nội dung hữu dụng 1200px |
| Banner đầu trang mẫu | cao 286px |
| Khối tìm kiếm và tiện ích mẫu | 768 × 144px; bo 12px |
| Thẻ sản phẩm mẫu | 226 × 407px; bo 12px; border 1px |
| Padding thông tin sản phẩm | 12px |
| Nút mua desktop | cao 48px; bo 8px; padding ngang 16px |
| Nút danh mục | cao 44px |
| Khoảng cách icon–chữ trong nút | 8px |
| Shadow thẻ | 0 1px 2px rgba(0,0,0,.1) |
| Shadow khối tìm kiếm | 0 8px 16px rgba(0,0,0,.1) |

Kích thước thẻ và khối tìm kiếm là mẫu đo, không được cố định cứng chiều cao nếu làm cắt nội dung hoặc phá responsive. Chiều cao header cũng có thể thích ứng với nội dung project.

### Màu đã đo

| Vai trò | HEX |
| --- | --- |
| Primary | #1B51A3 |
| Surface trắng | #FFFFFF |
| Nền body tham chiếu | #EBEBEB |
| Nền thẻ | #F8FAFC |
| Chữ mặc định | #2B2B2B |
| Chữ trung tính/tên sản phẩm | #5C5C5C |
| Viền | #E2E8F0 |
| Đỏ nhấn khuyến mãi | #F22222 |
| Cam nhấn chiến dịch | #F26522 |

Nút mua mẫu có nền trắng, viền và chữ #1B51A3. Không tự hiểu mọi nút mua đều tô xanh. Các trạng thái hover/focus/error, breakpoint và bố cục trang khác bên dưới là đề xuất triển khai, không phải thông số đã xác minh của Pharmacity.

## 3. Thiết lập design tokens

Định nghĩa CSS custom properties, dùng lại xuyên suốt stylesheet. Có thể đổi prefix để theo convention hiện có:

```css
:root {
  --shop-primary: #1b51a3;
  --shop-surface: #ffffff;
  --shop-page-bg: #ebebeb;
  --shop-card-bg: #f8fafc;
  --shop-text: #2b2b2b;
  --shop-text-muted: #5c5c5c;
  --shop-border: #e2e8f0;
  --shop-promo-red: #f22222;
  --shop-promo-orange: #f26522;
  --shop-font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --shop-radius-button: 8px;
  --shop-radius-card: 12px;
  --shop-shadow-card: 0 1px 2px rgb(0 0 0 / 10%);
  --shop-shadow-search: 0 8px 16px rgb(0 0 0 / 10%);
  --shop-space-1: 4px;
  --shop-space-2: 8px;
  --shop-space-3: 12px;
  --shop-space-4: 16px;
  --shop-space-5: 24px;
  --shop-space-6: 32px;
  --shop-space-7: 48px;
  --shop-container: 1232px;
  --shop-header-container: 1384px;
}
```

Spacing scale là quy ước đề xuất cho project. Bổ sung token semantic cho success, warning, error, hover, focus, disabled và z-index khi thực sự cần. Không dùng màu khuyến mãi thay thế tự động cho tất cả trạng thái lỗi.

Ưu tiên font Inter đang có trong project hoặc font local được phép sử dụng. Không thêm import Google Fonts nếu chưa cần; đảm bảo fallback hoạt động khi offline, và dùng font-display: swap nếu khai báo @font-face.

## 4. Yêu cầu CSS theo component

Chỉ triển khai component hiện có hoặc cần để hoàn thành phạm vi giao diện hiện tại. Không dựng thêm cả website hoặc tạo selector hàng loạt không được sử dụng.

### Nền, container và typography

- Áp dụng box-sizing phù hợp, tránh reset toàn cục gây xung đột thư viện.
- Container căn giữa, width: 100%, max-width theo token, padding ngang 16px.
- Nền tổng sáng, các khối nội dung phân biệt bằng nền, khoảng cách và đường viền nhẹ.
- Tiêu đề section desktop 28/34px, mobile đề xuất 20/28px.
- Tránh style mọi h1/h2/button/input toàn project khi có thể dùng scope storefront.
- Không làm ảnh hưởng giao diện quản trị nếu project có cả storefront và admin.

### Header và điều hướng

- Header desktop dùng primary, chữ/icon tương phản; thanh tiện ích nền trắng.
- Dùng sticky nếu không xung đột layout hiện có; kiểm tra ancestor overflow và stacking context.
- Logo dùng asset của project, không bóp méo tỷ lệ.
- Danh mục, tài khoản và giỏ hàng có hover, focus-visible, trạng thái mở nếu component hỗ trợ.
- Mobile bố trí logo, tìm kiếm, giỏ hàng gọn gàng; không chỉ thu nhỏ nguyên header desktop.
- CSS chỉ trình bày menu theo state hiện có; không giả vờ có chức năng đóng/mở nếu chưa có logic.

### Tìm kiếm

- Khối tìm kiếm desktop rộng tối đa 768px nhưng không vượt container.
- Nền trắng, bo 12px; có thể dùng shadow search.
- Ô nhập có vùng thao tác cao tối thiểu 44px theo đề xuất cho project.
- Icon, placeholder, chữ nhập và nút không chồng nhau.
- Gợi ý tìm kiếm chỉ được style nếu component/dữ liệu đã có.
- Dropdown không bị cắt bởi overflow và không phủ sai lớp lên modal.

### Banner và danh mục

- Banner tham khảo chiều cao desktop 286px, nhưng điều chỉnh theo asset thực tế; tránh cắt chữ trong banner.
- Dùng aspect-ratio/object-fit phù hợp, không kéo giãn ảnh.
- Nút carousel và indicator chỉ style khi carousel đã tồn tại.
- Danh mục có icon/ảnh, nhãn dễ đọc và hover/focus nhất quán.
- Không thêm popup quảng cáo tự mở chỉ vì website tham chiếu có popup.

### Thẻ sản phẩm

- Nền #F8FAFC, viền #E2E8F0 1px, bo 12px, shadow nhẹ.
- Vùng ảnh tỷ lệ vuông là đề xuất; dùng object-fit: contain cho ảnh sản phẩm.
- Nội dung padding 12px desktop; mobile có thể 8–12px.
- Tên sản phẩm 14/20px, weight 500, tối đa 2 dòng; tên đầy đủ vẫn nằm trong DOM và có thể đọc tại trang chi tiết.
- Giá hiện tại nổi bật; giá cũ gạch ngang khi dữ liệu có; đơn vị bán luôn được giữ rõ ràng.
- Badge giảm giá không che vùng nhận diện chính của sản phẩm.
- Dùng flex-column và margin-top: auto để căn nút cuối thẻ, không dùng chiều cao cứng làm cắt nội dung.
- Nút mua mặc định outline primary, cao 48px desktop. Nút hành động chính khác như thanh toán có thể dùng nền primary.
- Hover nhẹ, không gây dịch chuyển layout; ưu tiên transition màu/viền/shadow thay vì transition: all.
- Trạng thái hết hàng/disabled không chỉ thể hiện bằng màu; giữ nhãn trạng thái từ component.

### Biểu mẫu, giỏ hàng, chi tiết sản phẩm và footer

- Nếu đã có, đồng bộ typography, border, radius, spacing và button với theme.
- Input/select/textarea có focus-visible và invalid state gắn với markup thật như aria-invalid.
- Không dùng placeholder thay nhãn; nếu markup thiếu nhãn, sửa tối thiểu phần liên quan.
- Giỏ hàng mobile không tràn ngang; tên dài, giá lớn và bộ tăng giảm số lượng không chồng nhau.
- Trang chi tiết sản phẩm chuyển từ nhiều cột sang một cột hợp lý.
- Footer desktop chia nhóm; mobile xếp dọc. Không tạo accordion chỉ bằng CSS nếu chưa có tương tác tương ứng.

## 5. Responsive — đề xuất cho project

Ưu tiên breakpoint hiện có của repository. Nếu chưa có, dùng mobile-first với mốc 576px, 768px, 1024px, 1280px; ghi rõ đây là lựa chọn triển khai, không phải breakpoint đã đo của Pharmacity.

- Mobile: grid thường 2 cột nếu card vẫn đủ rộng; giảm còn 1 cột khi nội dung không đọc được.
- Tablet: khoảng 3 cột tùy không gian.
- Desktop: 4–5 cột trong vùng nội dung 1200px, gap đề xuất 16px.
- Không ép số cột theo viewport nếu container bị sidebar thu hẹp. Dùng CSS Grid linh hoạt hoặc media/container query tương thích project.
- Bảo đảm min-width: 0 cho flex/grid item cần co; xử lý chuỗi dài bằng overflow-wrap tại vị trí phù hợp.
- Nút mobile đề xuất tối thiểu 44px, dù class tham chiếu từng thể hiện 36px ở cấu hình cơ sở.
- Không dùng overflow-x: hidden trên body để che lỗi tràn layout.

## 6. Accessibility và chất lượng kỹ thuật

- Có focus-visible rõ trên link, nút và input; không xóa outline mà không thay thế.
- Kiểm tra tương phản chữ/nền, đặc biệt chữ trắng trên đỏ/cam khuyến mãi; điều chỉnh vai trò màu hoặc tông nếu cần.
- Tôn trọng prefers-reduced-motion; tắt animation/transition không cần thiết khi được yêu cầu.
- Giữ khả năng zoom và đọc ở 200%; không khóa kích thước chữ bằng transform.
- Tránh !important và selector độ đặc hiệu quá cao; nếu bắt buộc tương thích thư viện, giải thích phạm vi.
- Không thêm dependency, JavaScript hoặc tải asset bên ngoài nếu CSS hiện có đủ giải quyết.
- Không đổi cấu hình build hoặc lint không liên quan; không ghi đè file người dùng một cách mù quáng.

## 7. Tích hợp và kiểm tra

1. Tạo hoặc cập nhật stylesheet thật trong repository.
2. Import stylesheet ở đúng entry/layout, theo đúng thứ tự với thư viện hiện có.
3. Chỉ sửa class/markup tối thiểu để CSS có hiệu lực, giữ event handler và binding dữ liệu.
4. Chạy lint/build hiện có phù hợp với thay đổi. Không tuyên bố đã chạy lệnh nếu chưa chạy.
5. Nếu có công cụ browser, kiểm tra ở 375, 768, 1024 và 1440px; kiểm tra thêm zoom 200%, focus bàn phím và tên sản phẩm dài.
6. Kiểm tra trang chủ, danh sách sản phẩm và các trang hiện có chịu tác động; chú ý xung đột admin/storefront, header đè nội dung, nút bị cắt và modal sai lớp.
7. Nếu thiếu môi trường chạy, nêu rõ phần chưa kiểm chứng và cung cấp checklist thủ công; không tự bịa screenshot hoặc kết quả test.

Không cần viết test chỉ để xác nhận giá trị CSS tĩnh. Nếu thay đổi hành vi component ngoài styling là không thể tránh, giới hạn phạm vi và kiểm thử hành vi liên quan.

## 8. Tiêu chí hoàn thành

- [ ] Có stylesheet được tích hợp thật, không chỉ đoạn code trong câu trả lời.
- [ ] Design tokens tập trung và được sử dụng nhất quán.
- [ ] Selector khớp component hiện tại; không có theme thứ hai xung đột.
- [ ] Font, primary, typography, radius và card bám thông số tham chiếu.
- [ ] Responsive không cắt nội dung hoặc gây tràn ngang.
- [ ] Hover, focus, disabled, error có trạng thái phù hợp khi component hỗ trợ.
- [ ] Giao diện không làm thay đổi nghiệp vụ, dữ liệu hoặc chức năng đang có.
- [ ] Các kiểm tra thực hiện được đã chạy; giới hạn kiểm chứng được báo cáo.

## 9. Nội dung trả lời sau khi triển khai

Trả lời ngắn gọn bằng tiếng Việt:

1. Các file đã tạo/sửa và mục đích từng file.
2. Những component đã áp dụng theme.
3. Điểm nào giữ theo số đo, điểm nào điều chỉnh theo project.
4. Kết quả build/lint/kiểm tra giao diện đã thực sự thực hiện.
5. Phần còn hạn chế, nếu có.

Hãy bắt đầu kiểm tra repository và thực hiện ngay. Với lựa chọn styling thông thường, tự chọn phương án phù hợp rồi ghi lại; chỉ hỏi khi thiếu thông tin thực sự ngăn việc triển khai hoặc có yêu cầu mâu thuẫn không thể giải quyết.
