# Tích lũy tư bản

Game giáo dục theo lượt cho môn Kinh tế chính trị Mác-Lênin. Người chơi là nhà tư bản, trả lời câu hỏi: sau khi thu được giá trị thặng dư thì dùng nó như thế nào?

Một ván có tối đa 6 chu kỳ, chơi hết trong khoảng 3 phút. Chạy offline hoàn toàn, không backend, không gọi API.

Thế giới game 2D nhìn từ trên xuống làm bằng Phaser 3; HUD, menu, popup, màn chọn vốn và màn kết thúc là HTML/CSS (React + Tailwind) phủ lên canvas để chữ sắc nét. Hình vẽ trong game được sinh bằng code; ảnh splash được cung cấp trong `public/assets`.

## Cách chơi

| Phím | Tác dụng |
| --- | --- |
| WASD hoặc phím mũi tên | Di chuyển nhà tư bản |
| Nhấp vào sàn | Tự tìm đường ngắn nhất đến vị trí đã chọn |
| Nhấp sát công cụ | Đi đến và mở công cụ khi đứng đủ gần |
| E | Mở menu khu vực đang đứng gần (có gợi ý "Nhấn E") |
| 1-5 | Mở nhanh menu từng khu vực mà không cần đi tới |
| ↑ ↓ và Enter | Chọn và bấm nút trong menu, popup |
| Esc | Đóng menu |

Năm khu vực: **1 Khu máy móc** (nâng cấp máy), **2 Phòng nhân sự** (thuê người, tăng lương, Team Building, ép tăng ca), **3 Cần gạt sản xuất** (chạy một chu kỳ), **4 Két sắt** (phân bổ giá trị thặng dư), **5 Cổng xưởng** (mở xưởng mới).

Một chu kỳ: chuẩn bị ở khu 1, 2, 5 → kéo cần gạt → xem popup kết quả → mang m về két sắt để chọn tái đầu tư hay tiêu dùng. Sự kiện ngẫu nhiên hiện thành popup đầu chu kỳ.

## Chạy

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev        # mở địa chỉ Vite in ra, thường là http://localhost:5173
```

Nếu PowerShell báo "running scripts is disabled", gõ `npm.cmd` thay cho `npm`, hoặc chạy một lần `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Build và mở offline

```bash
npm run build      # ra thư mục dist/
npm run preview    # mở thử bản build tại http://localhost:4173
```

Thư mục `dist/` dùng đường dẫn tương đối (`base: "./"`), chép sang máy khác rồi mở bằng bất kỳ static server nào đều chạy, ví dụ `npx serve dist`. Không mở thẳng `index.html` bằng `file://` vì trình duyệt chặn module script ở chế độ đó.

Giao diện thiết kế cho 1280x720 và tự co giãn đều theo cửa sổ. Khi trình chiếu nên bấm F11 để toàn màn hình.

## Đăng lên GitHub Pages

Workflow tại `.github/workflows/deploy-pages.yml` tự build và deploy khi có push lên nhánh `main`. Để bật lần đầu, vào **Settings → Pages**, chọn **GitHub Actions** làm nguồn deploy. Có thể chạy thủ công workflow **Deploy to GitHub Pages** từ tab **Actions**. Sau khi deploy, trang game sẽ có tại `https://<tài-khoản>.github.io/KTCT-game/`.

Ứng dụng chạy hoàn toàn ở phía trình duyệt, không cần backend hay secret để build/deploy. Mọi biến môi trường được nhúng vào ứng dụng frontend đều có thể xem công khai trong trình duyệt; không đặt API key, mật khẩu hoặc thông tin cá nhân trong mã nguồn hay GitHub Actions. Tệp `.env` được bỏ qua bởi Git.

## Bảo mật

Xem [SECURITY.md](SECURITY.md) để biết cách báo cáo riêng tư một lỗ hổng. `.github/dependabot.yml` bật đề xuất cập nhật dependency và GitHub Actions; nên bật thêm **Dependabot alerts** trong **Settings → Code security and analysis** của repository.

## Chỉnh số liệu

Mọi con số và câu chữ nằm trong [src/config.ts](src/config.ts): vốn và mục tiêu từng mức, lương, giá máy, giá xưởng, mức hài lòng, tham số sự kiện, toàn bộ câu giải thích và đoạn phân tích cuối ván. Phần logic không chứa số cố định. Riêng tọa độ các phòng và khu vực nằm trong [src/world/layout.ts](src/world/layout.ts).

Sau khi đổi số, kiểm tra lại cân bằng:

```bash
npm run simulate           # 300 ván cho mỗi chiến thuật ở mỗi mức vốn
npm run simulate -- curve  # tư bản trung vị theo từng chu kỳ, dùng để chọn mốc thắng
```

## Mô hình kinh tế

| Đại lượng | Công thức |
| --- | --- |
| Năng suất | 1 + 0,3 × cấp máy (+0,5 nếu có máy thế hệ mới) |
| Doanh thu | số công nhân × $300 × năng suất (× 1,4 khi ép tăng ca) |
| c | nguyên liệu (40% doanh thu) + khấu hao (giá mua máy chia đều 10 chu kỳ) |
| v | tổng lương ($100 mỗi người, nhóm thất nghiệp nhận 40%) |
| m | doanh thu − c − v |
| Tổng tư bản | tiền mặt + giá trị máy còn lại + giá trị xưởng |

Mỗi chu kỳ tổng tư bản tăng đúng bằng m trừ phần tiêu dùng cá nhân. Thắng khi vừa đạt mục tiêu tư bản vừa đáp ứng ít nhất 60% nhu cầu tiêu dùng trong tối đa 6 chu kỳ; thanh nhu cầu tiêu dùng tăng theo phần thặng dư được chi tiêu. Các mức vốn và mục tiêu đã được mô phỏng với nhiều tỷ lệ đầu tư/tiêu dùng bằng `npm run simulate`. Thua khi phá sản, đình công 2 chu kỳ liên tiếp, hoặc hết 6 chu kỳ.

| Lý thuyết | Cơ chế |
| --- | --- |
| Quy mô tư bản ứng trước | Chọn vốn đầu game |
| Bản chất tích lũy | Phân bổ m sau mỗi chu kỳ |
| Năng suất lao động, cấu tạo hữu cơ | Nâng cấp máy |
| Sử dụng hiệu quả tư bản | Khấu hao chia nhiều chu kỳ |
| Trình độ bóc lột | Mức hài lòng, ép tăng ca, tăng lương |
| Tích tụ và tập trung | Mở xưởng, mua lại xưởng đối thủ |
| Lao động dự trữ | Sự kiện thất nghiệp |

## Kết quả mô phỏng

300 ván cho mỗi ô. Cột "Lượt thắng" là trung vị, trong ngoặc là sớm nhất và muộn nhất.

| Chiến thuật | Khởi nghiệp ($500 → $9,500) | Trung lưu ($5,000 → $40,000) | Thừa kế ($50,000 → $100,000) |
| --- | --- | --- | --- |
| (a) Tái đầu tư hết, ưu tiên máy | thắng 97%, lượt 11 (9-12) | thắng 100%, lượt 10 (8-12) | thắng 100%, lượt 7 (6-7) |
| (b) Tái đầu tư hết, ưu tiên nhân công | thắng 96%, lượt 11 (9-12) | thắng 100%, lượt 9 (8-11) | thắng 100%, lượt 7 (6-7) |
| (c) Ép tăng ca liên tục | thắng 0% (đình công 69%, phá sản 31%) | thắng 0% (đình công 100%) | thắng 0% (đình công 100%) |
| (d) Tiêu dùng 70% | thắng 0% | thắng 0% | thắng 0% |
| (e) Tái đầu tư 70% | thắng 3% | thắng 47%, lượt 12 | thắng 100%, lượt 9 (8-10) |

Các bot (a) và (b) chơi gần tối ưu: luôn thuê kín chỗ và mua ngay khi đủ tiền. Người chơi thật thường chậm hơn một hai lượt.

## Giả định đã chọn

- **Tổng tư bản** tính cả giá trị máy còn lại và xưởng, không chỉ tiền mặt. Nhờ vậy mua máy không làm "mất" tư bản mà chỉ đổi hình thái.
- **Phải ứng trước nguyên liệu và lương.** Bấm SẢN XUẤT khi tiền mặt không đủ thì phá sản. Game chặn việc thuê người và bật tăng ca quá khả năng, còn mua máy, mở xưởng, tăng lương, Team Building quá tay thì chỉ cảnh báo đỏ để người chơi vẫn có thể thua vì dồn vốn sai chỗ.
- **Đình công** xảy ra ngay trong chu kỳ mà Mức hài lòng về 0. Sau đó công nhân quay lại với mức hài lòng 10, nên nếu ép tăng ca tiếp thì đình công lần hai liên tiếp và thua.
- **Mức hài lòng** tự giảm 3 điểm mỗi chu kỳ thường, giảm 25 điểm mỗi chu kỳ ép tăng ca. Tăng lương và Team Building mỗi thứ dùng được 1 lần mỗi chu kỳ.
- **Máy cấp chung cho mọi xưởng**, xưởng không khấu hao, để giữ ít chỉ số.
- **Máy thế hệ mới** (sự kiện) là một khoản riêng ngoài 5 cấp máy, để sự kiện vẫn có ý nghĩa khi máy đã đạt cấp tối đa.
- **Sự kiện thất nghiệp**: nếu xưởng hết chỗ hoặc thiếu tiền nguyên liệu, người thất nghiệp thay thế công nhân lương cũ.
- **Lịch sự kiện** được xếp sẵn đầu ván: thất nghiệp chắc chắn xuất hiện trong chu kỳ 2-5, máy thế hệ mới trong chu kỳ 6-9, các chu kỳ còn lại có 50% khả năng có sự kiện. Chu kỳ 1 không có sự kiện.
- **Không cho nhận lời một sự kiện** nếu sau đó thiếu tiền ứng trước, để không ai phá sản chỉ vì bấm "Đồng ý".
- **Phân bổ m ở két sắt**: popup kết quả chỉ hiện c, v, m và lời giải thích; người chơi mang m về két sắt (phím 4) để chọn. Chu kỳ không có m (đình công) thì bỏ qua bước này.
- **Chỉ phòng chính đi lại được.** Xưởng 2 và 3 hiện thành phòng liền kề có công nhân làm việc, nhưng nhân vật không cần đi sang để tiết kiệm thời gian.
- **Mua lại xưởng đối thủ** là sự kiện popup đầu chu kỳ; cổng xưởng chỉ dùng để chủ động mở xưởng mới.
- **Lớp HTML dùng React** để tái dùng các popup đã kiểm thử; Phaser chỉ vẽ thế giới và nhận phím di chuyển.
- Công nhân không chặn đường nhân vật; chỉ tường, máy, băng chuyền, bàn nhân sự, cần gạt và két sắt có va chạm.
- Không có âm thanh, không lưu ván, không có nút sa thải vì ngoài danh sách tính năng.

## Hạn chế

- Bot mô phỏng dùng luật đơn giản, chưa thử chiến thuật pha trộn như ép tăng ca xen kẽ Team Building.
- Kiểm thử trên trình duyệt được làm bằng Edge ở 1280x720, điều khiển bằng script. Chưa thử trên máy chiếu thật hay trình duyệt khác.
- Ở độ phân giải khác 1280x720, toàn bộ khung co giãn theo tỷ lệ: chữ HTML vẫn nét, còn hình vẽ trong canvas có thể hơi mờ khi phóng to.
- Bản build nặng khoảng 1,7 MB vì có Phaser.
- Số liệu là mô hình minh họa, không phản ánh giá cả thực tế.

## Cấu trúc

```
src/config.ts            số liệu cân bằng và toàn bộ câu chữ
src/engine/engine.ts     luật chơi: hàm thuần, step(state, action) -> state mới
src/engine/analysis.ts   bộ luật "AI phân tích" cuối ván
src/world/               thế giới Phaser: bố cục, hình vẽ sinh bằng code, scene nhà máy
src/components/          HUD, menu khu vực, popup (HTML phủ lên canvas)
src/screens/             ba màn: chọn vốn, chơi, kết thúc
scripts/simulate.ts      mô phỏng cân bằng, chạy bằng Node trực tiếp trên engine
```

`src/engine/` không import Phaser, React hay DOM.
