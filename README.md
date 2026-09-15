# TPLabs ContentOps

Website quản lý nội dung đa kênh dành cho Thanh Tam Studio. Giao diện được triển khai bằng GitHub Pages, nội dung cấu hình có thể chỉnh sửa bằng Pages CMS, còn dữ liệu vận hành và xác thực dùng Supabase.

## Chức năng

- Dashboard tổng hợp hiệu suất.
- Content Library, Calendar và Production Board.
- Publishing Queue và Post-Publish Tracking.
- Thêm link bài đăng, tự nhận diện nền tảng và lưu Post/Video ID.
- Views, likes, comments, shares, saves, watch time, retention và Performance Score.
- Thêm/xóa không giới hạn kênh.
- Automation Builder và lịch đồng bộ sau đăng.
- Mời thành viên bằng Gmail, phân quyền theo vai trò và kênh.
- Media Library, Analytics và xuất CSV.
- Responsive trên desktop, tablet và điện thoại.

## 1. GitHub Pages

Repository đã có workflow `.github/workflows/pages.yml`. Trong GitHub, mở **Settings → Pages → Source** và chọn **GitHub Actions**. Mỗi lần thay đổi nhánh `main`, website sẽ tự triển khai lại.

## 2. Pages CMS

File `.pages.yml` tại thư mục gốc cho phép Pages CMS chỉnh:

- Workspace settings
- Channels
- Content library
- Automations
- Team display

Mở [Pages CMS](https://app.pagescms.org), đăng nhập GitHub và chọn repository này. Thay đổi được commit về GitHub và workflow Pages tự xuất bản lại.

## 3. Supabase và đăng nhập Google

1. Tạo Supabase project do chính bạn sở hữu.
2. Chạy toàn bộ `supabase/schema.sql` trong SQL Editor.
3. Trong Authentication → Providers, bật Google.
4. Thêm GitHub Pages URL vào Authentication → URL Configuration.
5. Điền `supabaseUrl` và `supabaseAnonKey` trong `config.js`.
6. Deploy ba Edge Functions `sync-metrics`, `invite-member` và `sync-cms`.
7. Thêm `YOUTUBE_API_KEY` vào Edge Function secrets nếu dùng YouTube sync.

Không đưa `SUPABASE_SERVICE_ROLE_KEY`, Google Client Secret hoặc token của mạng xã hội vào GitHub hay `config.js`.

Để dữ liệu chỉnh trong Pages CMS tự cập nhật sang ứng dụng live, thêm GitHub Actions secrets `SUPABASE_URL` và `CMS_SYNC_SECRET`. Trong Supabase Edge Function secrets, thêm cùng `CMS_SYNC_SECRET` và `CMS_WORKSPACE_ID`. Workflow `sync-cms.yml` sẽ tự chạy khi file trong `data/` thay đổi.

## 4. Đồng bộ nền tảng

`sync-metrics` đã có connector YouTube cho views, likes và comments. Watch time, retention và các chỉ số riêng tư cần YouTube Analytics OAuth. TikTok, Instagram và Facebook cần ứng dụng developer được nền tảng xét duyệt; sau khi có quyền, bổ sung connector vào Edge Function và lưu token phía server.

## Chế độ Demo

Khi chưa cấu hình Supabase, website chạy ở Demo Mode với dữ liệu mẫu. Các thay đổi được giữ trên thiết bị hiện tại để kiểm tra giao diện. Sau khi cấu hình Supabase, dữ liệu dùng chung phải được lưu vào PostgreSQL và bảo vệ bằng Row Level Security.

## Quyền sở hữu

Mã nguồn, repository, tên miền, Supabase project và các developer app nên cùng thuộc tài khoản của Owner. Repository không cấp giấy phép sử dụng lại cho bên thứ ba; mọi quyền thuộc chủ sở hữu repository.
