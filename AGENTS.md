# AGENTS.md - Hệ điều hành Mercury (Quartz 5 Website)

`mercury` là mã nguồn website cá nhân (Digital Garden) chạy trên nền Quartz 5, xuất bản các ghi chép chọn lọc từ bộ não thứ hai `Neural Chamber`.

Website triển khai tại: `https://justinkaxau.github.io/mercury`

Mục tiêu: duy trì, tùy biến và triển khai website Quartz ổn định, nhanh chóng, tối ưu trải nghiệm đọc và hiển thị chuẩn xác nội dung xuất bản.

## Quy tắc chung

- Xưng hô tao - mày, thân mật và gần gũi.
- Trả lời bằng tiếng Việt. Giữ nguyên thuật ngữ kỹ thuật tiếng Anh phổ biến (build, deploy, component, hook, scss, frontmatter...).
- Xử lý rành mạch, logic; tuân thủ tiêu chuẩn và best practice của modern web, TypeScript và Quartz 5.
- Không bịa đặt. Lỗi build hoặc vấn đề tương thích chưa rõ nguyên nhân phải kiểm tra log thực tế trước khi kết luận.
- Không over-engineer; ưu tiên cấu hình có sẵn của Quartz trước khi can thiệp sâu vào core.
- Thư mục làm việc: luôn là root của repo `mercury` (`D:\Projects\mercury`).
- Nhánh Git triển khai chính: `v5`.
- Không tự ý commit hoặc push nếu tao chưa yêu cầu rõ.

## Bản đồ Project

### `content/` - dữ liệu xuất bản (Downstream Content)

- Là NTFS Junction trỏ trực tiếp tới `D:\Projects\Neural Chamber\Publish`.
- Đây là nội dung công khai một chiều từ `Neural Chamber`.
- Không dùng `content/` để viết hay sửa nội dung các note tri thức (mọi cập nhật nội dung phải thực hiện từ phía `Neural Chamber`).
- Chỉ sửa trực tiếp trong `content/` đối với các file đặc thù của website như `content/index.md` (trang chủ) hoặc trang giới thiệu không thuộc wiki.

### `quartz/` - mã nguồn Quartz

- Chứa core logic, components, layouts, plugins và styles.
- `quartz/styles/`: chứa file SCSS tùy biến giao diện.
- `quartz/components/`: các thành phần UI của Quartz.

### Cấu hình toàn cục

- `quartz.config.yaml`: cấu hình plugins, typography, bảng màu, baseUrl và analytics.
- `quartz.layout.ts`: cấu hình bố cục các trang (Header, Left, Right, Footer).

### `scripts/` - script tự động hóa

- Chứa các script tiện ích hỗ trợ đồng bộ hoặc bảo trì website.

## Quy trình cốt lõi

### 1. Phát triển và Kiểm thử cục bộ (Local Dev & Build)

Kích hoạt khi cần kiểm tra giao diện, thêm tính năng hoặc debug lỗi hiển thị.

- Chạy kiểm tra TypeScript và linting: `npm run check`.
- Chạy môi trường dev preview: `npx quartz build --serve`.
- Chỉ build cục bộ khi:
  - Thay đổi cấu hình `quartz.config.yaml` hoặc layout.
  - Sửa đổi mã nguồn components, plugins hoặc styles SCSS.
  - Kiểm tra các liên kết phức tạp, định dạng ảnh, công thức toán LaTeX hoặc render bảng.
- Khi chỉ thay đổi văn bản thông thường trong `content/`, không bắt buộc phải build cục bộ trừ khi nghi ngờ cú pháp Markdown bị lỗi.

### 2. Tinh chỉnh Giao diện và Thành phần (Theming & Styling)

- Ưu tiên điều chỉnh cấu hình qua `quartz.config.yaml` (màu sắc darkMode/lightMode, font chữ, plugins) trước khi can thiệp vào CSS/TS.
- Khi viết CSS/SCSS tùy biến:
  - Viết trong `quartz/styles/custom.scss` hoặc file scss của component liên quan.
  - Đảm bảo tương thích tốt trên cả mobile, tablet và desktop.
  - Kiểm tra độ tương phản màu ở cả hai chế độ sáng/tối.

### 3. Quy chuẩn Hiển thị Nội dung Web

Lưu ý các đặc thù của Quartz khi xử lý nội dung từ `content/`:

- Tránh trùng lặp tiêu đề: Quartz tự động hiển thị tiêu đề trang từ frontmatter hoặc tên file; nội dung bài không để dòng `# Tiêu đề` (H1) ở đầu.
- Dùng Markdown Table chuẩn thay vì ASCII art để tránh vỡ giao diện trên thiết bị di động.
- Hình ảnh và tệp đính kèm phải nằm trong `content/assets/` hoặc đường dẫn tương đối hợp lệ.
- Thẻ callout, wikilink `[[Tên file]]` và khối code phải tuân thủ cú pháp tương thích với Quartz.

### 4. Commit và Triển khai (Deploy Pipeline)

Kích hoạt khi tao yêu cầu: "đẩy lên web", "deploy", "publish", "commit".

- Xác định phạm vi thay đổi bằng `git status` và `git diff`.
- Commit với thông điệp rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat:`, `fix:`, `style:`, `content:`).
- Push lên nhánh `v5` tại `origin`:
  ```powershell
  git push origin v5
  ```
- Theo dõi trạng thái triển khai qua GitHub Actions và kiểm tra kết quả thực tế trên `https://justinkaxau.github.io/mercury`.
