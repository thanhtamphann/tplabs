# TPLabs ContentOps

Website quản lý nội dung đa kênh cá nhân, triển khai bằng GitHub Pages và lưu dữ liệu riêng tư trong Supabase.

## Bảo mật và quyền truy cập

- Giao diện công khai chỉ chứa mã ứng dụng, không chứa nội dung, kênh, email thành viên hoặc số liệu thật.
- Người dùng phải đăng nhập bằng Gmail.
- Gmail phải nằm trong danh sách do Owner cấp quyền; đăng nhập thành công nhưng chưa được cấp quyền vẫn không xem được dữ liệu.
- PostgreSQL Row Level Security kiểm tra quyền ở máy chủ cho mọi thao tác.
- Owner có toàn quyền thêm, sửa và xóa workspace, nội dung, kênh, bài đăng, metrics, automation, media và thành viên.
- Khi Owner thu hồi một Gmail, RLS chặn mọi truy vấn tiếp theo ngay cả khi phiên đăng nhập cũ còn tồn tại.
- `service_role`, Google Client Secret và token mạng xã hội tuyệt đối không được lưu trong repository hoặc `config.js`.

## Phân hệ

- Overview, Content Library, Calendar và Production Board.
- Publishing Queue và Post-Publish Tracking.
- Thêm link bài đăng, nhận diện nền tảng và Post/Video ID.
- Views, likes, comments, shares, saves, watch time, retention và Performance Score.
- Kênh không giới hạn, Automation Builder, Team và phân quyền theo kênh.
- Media Library lưu liên kết Drive/kho cá nhân để không dùng dung lượng cloud trả phí.
- Analytics và xuất CSV.

## Chi phí và lưu trữ

- GitHub Pages: dùng gói miễn phí.
- Supabase: project đang dùng gói Free, chi phí tạo project được xác nhận là 0 USD/tháng.
- Không bật add-on trả phí.
- File video/ảnh lớn nên để ở Google Drive hoặc ổ cứng cá nhân; TPLabs chỉ lưu metadata và link. Đây là cách phù hợp để quản lý khoảng 50 GB mà không phải mua thêm Supabase Storage.

## GitHub Pages và Pages CMS

Workflow `.github/workflows/pages.yml` tự triển khai website khi nhánh `main` thay đổi. Pages CMS chỉ được phép chỉnh `data/site.json`, tức thông tin giao diện công khai. Nội dung vận hành riêng tư không được lưu trong Pages CMS vì repository và mã GitHub Pages có thể xem công khai.

## Supabase

- Schema gốc: `supabase/schema.sql`.
- Edge Function `invite-member`: cấp, đổi hoặc thu hồi quyền Gmail; yêu cầu JWT hợp lệ.
- Edge Function `sync-metrics`: đồng bộ số liệu; chỉ Owner, Admin hoặc Content Manager được gọi.
- `config.js` chỉ chứa Project URL và publishable key; hai giá trị này được thiết kế để dùng phía trình duyệt và luôn được bảo vệ bởi RLS.
- Google Login có thể bật thêm trong Supabase Authentication. Email magic link được hỗ trợ sẵn để đăng nhập bằng Gmail.

## Trạng thái kết nối nền tảng

Thêm link bài đăng và lưu chỉ số hoạt động ngay. Đồng bộ tự động YouTube cần `YOUTUBE_API_KEY`; watch time/retention cần YouTube Analytics OAuth. TikTok, Instagram và Facebook cần developer app được nền tảng xét duyệt. Nếu chưa có API, hệ thống vẫn quản lý nội dung, lịch, thành viên, file và URL bình thường.

## Quyền sở hữu

Repository GitHub, Supabase project và dữ liệu đều thuộc tài khoản của Owner. Không có giấy phép cho bên thứ ba sử dụng lại mã nguồn.
