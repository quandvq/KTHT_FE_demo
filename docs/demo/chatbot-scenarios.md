# Kịch bản chatbot mô phỏng

| Câu mẫu | Agent | Quyền | Kết quả |
|---|---|---|---|
| Tôi muốn tìm vitamin C | Sản phẩm & Kinh doanh | Công khai | Hướng dẫn tra danh mục, không tư vấn điều trị |
| Đơn hàng của tôi đang ở đâu? | Vận hành TMĐT | Đăng nhập | Chỉ xem dữ liệu theo quyền |
| Sản phẩm bị hỏng, cần đổi trả | CSKH & Hậu mãi | Công khai | Tiếp nhận yêu cầu, không tự duyệt |
| Tôi muốn xem doanh thu hôm nay | Phân tích & Báo cáo | Manager | Khách bị từ chối dữ liệu nội bộ |

Trợ lý là mô phỏng rule-based tại trình duyệt; không gọi AI API, không cung cấp tư vấn y tế và không tự thực thi nghiệp vụ.
