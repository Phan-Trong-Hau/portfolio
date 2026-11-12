---
title: "Dùng AI tìm lỗ hổng bảo mật trong tool MCP trên GCP: con người đặt nghi vấn, AI làm phần còn lại"
date: 2026-11-12
description: Một lỗ hổng làm lộ access token GCP đã nằm ngay trước mắt mọi người. Vì sao không ai thấy, và mình đã phối hợp với AI để tìm ra nó thế nào.
tags: [ai, bao-mat, mcp, gcp]
home: true
cover: cover.webp
---

Lỗ hổng nguy hiểm nhất mà mình từng tìm ra không nằm trong một đoạn code khó hiểu. Nó nằm trong một tính năng ai cũng biết, đã qua review, đã qua test, và được khách hàng dùng hằng ngày. Không ai thấy nó, không phải vì mọi người cẩu thả, mà vì **mỗi phần của hệ thống đều đúng khi đứng riêng**.

Bài này kể lại cách mình tìm ra nó cùng AI. Bài học lớn nhất của mình: AI đọc code nhanh hơn mình rất nhiều, nhưng **câu hỏi đúng vẫn phải do con người đặt ra**.

*Lỗ hổng đã được vá. Mình bỏ tên công ty và các chi tiết có thể nhận diện hệ thống, và chỉ mô tả ở mức nguyên lý.*

## Bối cảnh: AI agent, tool và một tính năng "Custom API"

Hệ thống có các AI agent dùng tool theo kiểu MCP: agent nhận câu hỏi, quyết định gọi tool nào, đọc kết quả rồi trả lời người dùng. Các tool chạy trên hạ tầng GCP của công ty.

Trong số đó có một tool rất được ưa chuộng: **Custom API**. Người dùng tự cấu hình một URL, và agent sẽ gọi tới đó khi cần, ví dụ để tra đơn hàng hay lấy thông tin khách từ hệ thống riêng của họ. Một tính năng linh hoạt, đúng thứ khách hàng muốn.

Vấn đề là: người dùng có thể điền **bất kỳ URL nào**, kể cả một địa chỉ chỉ truy cập được từ *bên trong* GCP. Trên GCP có một endpoint nội bộ để máy chủ lấy access token của service account mà nó đang chạy. Request từ tool đi ra từ bên trong hạ tầng, nên nó gọi được endpoint đó.

Ghép lại: người dùng cấu hình Custom API trỏ vào endpoint lấy token, rồi chỉ cần **nhờ AI trả nguyên kết quả của tool trong câu trả lời**. Agent làm đúng việc được thiết kế: gọi tool, đọc kết quả, trả lời. Và access token của một service account có quyền rất rộng trên GCP hiện ra ngay trong khung chat.

Đây là một dạng SSRF (server-side request forgery) kinh điển. Điểm mới là kẻ tấn công không cần viết code hay gửi request nào: **AI agent làm hộ toàn bộ, kể cả bước mang dữ liệu ra ngoài.**

## Vì sao không ai tìm ra?

Nhìn lại thì rõ ràng. Nhưng nó đã nằm đó một thời gian, và mình nghĩ lý do nằm ở cách mỗi người nhìn hệ thống:

- **Người làm tính năng** thấy một tool gọi HTTP, đúng yêu cầu: người dùng điền URL, tool gọi URL.
- **Người làm hạ tầng** thấy dịch vụ chạy với service account, chuyện bình thường trên GCP.
- **Người làm AI** thấy agent đọc kết quả tool và trả lời đúng ngữ cảnh, đúng như mong muốn.
- **Code review** nhìn từng pull request. Không PR nào chứa lỗ hổng, vì lỗ hổng chỉ xuất hiện khi ghép ba thứ trên lại.
- **QA** test xem tính năng có chạy không. Không ai viết test case "nếu người dùng cố tình trỏ URL vào bên trong hạ tầng thì sao".

Thêm một lý do nữa: ta quen coi tool là "code nội bộ, đáng tin". Nhưng một tool mà **người dùng điều khiển được đầu vào**, và **AI quyết định khi nào gọi**, thì không còn là code nội bộ nữa. Nó là bề mặt tấn công.

## Câu hỏi của con người: "Tool này chạy với danh tính của ai?"

Thứ khiến mình dừng lại không phải một dòng code lạ. Đó là một câu hỏi rất đơn giản khi nhìn kiến trúc: **các tool này chạy bằng service account nào, và service account đó có quyền gì?**

Từ đó, chuỗi suy nghĩ đi khá nhanh:

1. Tool chạy bên trong GCP, dưới một service account có quyền rộng.
2. Có tool cho người dùng tự chọn đích để gọi.
3. Vậy người dùng có thể khiến một request xuất phát *từ bên trong* hạ tầng, mang danh tính của service account đó.
4. Và AI sẽ đưa kết quả ra cho người dùng xem.

Đây là bước mình nghĩ AI chưa tự làm tốt khi đứng một mình. Đưa cả codebase cho AI và bảo "tìm lỗ hổng" thì sẽ nhận về một danh sách dài những thứ đúng nhưng chung chung: thiếu validate chỗ này, nên thêm rate limit chỗ kia. Thứ thật sự nguy hiểm nằm ở **ranh giới giữa các hệ thống**: giữa dữ liệu người dùng, quyền của hạ tầng và hành vi của AI. Để thấy nó, cần một người hiểu cả ba và có cảm giác "chỗ này có gì đó không ổn".

## AI làm phần còn lại

Khi đã có giả thuyết, AI trở thành một cộng sự cực kỳ hiệu quả. Thay vì "tìm lỗ hổng đi", mình giao cho nó những câu hỏi cụ thể:

- URL của Custom API đi từ đâu tới đâu trong code? Có bước kiểm tra nào trước khi gọi không? Có chặn địa chỉ nội bộ không? Có theo redirect không?
- Dịch vụ chạy tool được gắn service account nào? Service account đó có những quyền gì?
- Kết quả của tool có được lọc gì trước khi đưa vào ngữ cảnh của LLM và trả về người dùng không?
- **Còn tool nào khác có cùng kiểu**: nhận URL hoặc đích từ người dùng, rồi gọi ra ngoài từ bên trong hạ tầng?

Với từng câu hỏi, AI đọc hết những file liên quan trong vài phút, việc mà mình tự làm sẽ mất cả buổi, và trả lời kèm vị trí trong code để mình kiểm tra lại. Câu hỏi cuối cùng đặc biệt đáng giá: một lỗ hổng hiếm khi đi một mình, và AI rà soát các pattern tương tự trên toàn bộ codebase tốt hơn mình nhiều.

Sau đó mình **tự xác minh** trong môi trường an toàn, không tin vào kết luận của AI chỉ vì nó nói chắc nịch. Xác nhận xong thì báo cáo cho team kèm mức độ ảnh hưởng và đề xuất hướng vá, và AI cũng giúp mình viết báo cáo đó rõ ràng hơn.

## Hướng vá cho loại lỗ hổng này

Nếu bạn đang làm tool cho AI agent trên cloud, đây là những lớp phòng thủ nên có. Mỗi lớp chặn một phần, và nên dùng kết hợp:

- **Chặn đích nội bộ.** Không cho gọi địa chỉ nội bộ, link-local hay endpoint metadata. Kiểm tra *sau khi* phân giải DNS, và kiểm tra lại sau mỗi lần redirect (hoặc tắt redirect), vì chặn theo tên miền rất dễ bị lách.
- **Allowlist khi có thể.** Nếu khách hàng chỉ cần gọi vài hệ thống của họ, cho đăng ký tên miền trước thay vì mở cho mọi URL.
- **Quyền tối thiểu.** Dịch vụ chạy tool do người dùng cấu hình nên có service account riêng, gần như không có quyền gì trên hạ tầng. Lỡ token có bị lộ thì cũng không làm được gì nhiều.
- **Tách nơi chạy.** Code gọi ra URL do người dùng chọn không nên chạy chung chỗ với các dịch vụ có quyền.
- **Lọc kết quả tool trước khi đưa cho AI.** Phát hiện và che những chuỗi trông giống token, key hay credential. Coi output của tool là dữ liệu không tin cậy.
- **Đừng trông chờ vào prompt.** Một câu "không được tiết lộ token" trong system prompt không phải là biện pháp bảo mật. Người dùng luôn có cách xin AI làm khác.
- **Log và cảnh báo.** Theo dõi các request ra ngoài bất thường từ dịch vụ chạy tool.

## Điều mình rút ra

AI thay đổi cách mình làm bảo mật, nhưng không theo kiểu "AI tự tìm hết lỗ hổng". Cách phối hợp hiệu quả với mình là:

1. **Con người đặt nghi vấn.** Hiểu kiến trúc, nhìn vào chỗ các hệ thống chạm nhau, và hỏi những câu như "cái này chạy với danh tính của ai?", "ai điều khiển được đầu vào này?", "dữ liệu này cuối cùng đi đến đâu?".
2. **AI trả lời thật nhanh và rộng.** Lần theo luồng dữ liệu, đọc cấu hình, tìm các chỗ tương tự trên cả codebase.
3. **Con người xác minh và quyết định.** Kiểm tra lại, đánh giá mức độ nghiêm trọng, chọn cách vá.

Và một lưu ý cho những ai đang xây AI agent: khi cho AI quyền gọi tool, bạn cũng cho người dùng một cách gián tiếp để điều khiển những tool đó. Hãy thiết kế tool như thể người dùng đang gọi trực tiếp, vì thực tế là như vậy.
