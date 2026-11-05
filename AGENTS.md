# Quy tắc làm việc & Bảo vệ môi trường Deploy (GitHub Pages)

Tài liệu này quy định các nguyên tắc bất biến cho AI Agent và lập trình viên khi làm việc trên codebase này, đặc biệt nhằm bảo vệ tính ổn định của quy trình build và deploy tự động qua **GitHub Actions** lên **GitHub Pages**.

---

## 1. Phạm vi & Kiến trúc dự án
- **Phạm vi:** Frontend demo React + TypeScript + Vite; tuyệt đối **không tạo backend, API server hay cơ sở dữ liệu**.
- **Trạng thái & Dữ liệu:** Lưu trữ trong `localStorage` và dữ liệu tĩnh tại `src/data/`. Không coi đây là cơ chế bảo mật thật.
- **Cơ chế review:** Áp dụng **sequential-self-review** (tự rà soát kỹ lưỡng sau khi sửa đổi); không tự nhận có reviewer độc lập.

---

## 2. Quy tắc BẤT BIẾN để không làm hỏng GitHub Pages Deploy

### 2.1. Routing: Bắt buộc dùng `HashRouter`
- **Quy tắc:** Ứng dụng **bắt buộc** dùng `HashRouter` từ `react-router-dom` trong `src/main.tsx`.
- **Tuyệt đối không:** Đổi sang `BrowserRouter`. GitHub Pages là môi trường static hosting không hỗ trợ server rewrite; đổi sang `BrowserRouter` sẽ gây lỗi 404 trắng trang ngay khi tải lại trang (reload) hoặc truy cập trực tiếp route con.
- **Tệp `public/404.html`:** Phải được duy trì nguyên vẹn để tự động chuyển hướng các truy cập không có hash về dạng `/#/...`.

### 2.2. Cấu hình Base URL trong `vite.config.ts`
- **Quy tắc:** `base` phải luôn được tính toán tự động dựa trên biến môi trường `GITHUB_REPOSITORY` khi build production (ví dụ `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`), hoặc fallback về `/KTHT_FE_demo/`. Khi chạy local dev (`command !== 'build'`), base là `/`.
- **Tuyệt đối không:** Sửa cứng `base: '/'` trong chế độ build production. Việc này sẽ làm đứt toàn bộ đường dẫn CSS, JS, ảnh và fonts khi triển khai lên domain `https://<owner>.github.io/<repo>/`.

### 2.3. Đường dẫn Assets & Ảnh (`assetUrl`)
- **Quy tắc:** Mọi tham chiếu tới tệp tĩnh trong thư mục `public/` (ảnh, icon, font...) khi render trong JSX/TSX **bắt buộc** phải bọc qua hàm `assetUrl(...)` từ `src/assets.ts`:
  ```tsx
  // ĐÚNG:
  <img src={assetUrl(currentSrc)} alt={name} />
  "--home-background-image": `url("${assetUrl("/images/home-meadow-background.jpg")}")`
  ```
- **Tuyệt đối không:** Đặt đường dẫn cứng dạng `<img src="/images/..." />` trực tiếp trong code TSX vì trình duyệt sẽ tìm ở domain gốc thay vì subpath của repository.
- **Cơ chế Fallback ảnh:** Giữ cơ chế dự phòng: nếu ảnh nội bộ (`p.image`) tải thất bại, phải tự động thử lại bằng link trực tuyến CDN (`p.imageUrl`) trước khi hiển thị placeholder icon.

### 2.4. Tính phân biệt chữ hoa / chữ thường (Case-Sensitivity) trên Linux
- **Quy tắc:** GitHub Actions chạy trên môi trường Linux (`ubuntu-latest`) — nơi hệ điều hành phân biệt tuyệt đối chữ hoa/chữ thường trong tên tệp.
- **Tuyệt đối không:** Sai lệch chữ hoa/thường giữa lệnh `import` và tên tệp thực tế trên đĩa (ví dụ `import ... from './Health'` trong khi tên file là `health.tsx`). Điều này có thể chạy được trên Windows nhưng sẽ khiến GitHub Actions **bị gãy build ngay lập tức**.

### 2.5. Đồng bộ Dependency & Khóa `package-lock.json`
- **Quy tắc:** File `.github/workflows/deploy-pages.yml` sử dụng lệnh `npm ci` để cài đặt môi trường sạch và tối ưu tốc độ.
- **Yêu cầu:** `package.json` và `package-lock.json` phải luôn đồng bộ. Không thêm package lạ hoặc làm lệch lockfile. Không sửa xóa file workflow `.github/workflows/deploy-pages.yml` nếu không có yêu cầu cụ thể.

---

## 3. Quy trình bắt buộc trước khi hoàn tất task (Self-Review Checklist)
Mỗi khi chỉnh sửa mã nguồn, agent/developer **phải chạy lệnh sau trong terminal** để tự kiểm tra:

```bash
npm run build
```

Chỉ được xác nhận hoàn thành khi lệnh `npm run build` (`tsc -b && vite build`) kết thúc với mã thành công (`code 0`), không có lỗi TypeScript, thiếu module, hay cảnh báo gãy bundle.
