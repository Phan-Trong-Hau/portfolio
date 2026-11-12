---
title: Tiêu đề bài viết
date: 2026-11-20
description: Một câu tóm tắt, hiện ở danh sách bài viết và khi chia sẻ link.
tags: [kinh-nghiem, nextjs]
draft: true
# cover: cover.webp   # ảnh bìa 16:9 (vd 1200×675) đặt trong thư mục bài
# home: true   # bỏ dấu # để đưa bài lên trang chủ (trang chủ chỉ hiện 3 bài)
---

<!--
Cách viết bài mới:
1. Copy cả thư mục _template thành content/blog/<ten-bai-viet>/ (chữ thường, không dấu, nối bằng gạch ngang).
   Tên thư mục chính là đường dẫn: /vi/blog/<ten-bai-viet>/
2. Viết tiếng Việt trong vi.md. Muốn có bản tiếng Anh thì thêm en.md cùng thư mục (không bắt buộc).
3. Ảnh: bỏ file ảnh vào cùng thư mục rồi chèn ![Mô tả ảnh](anh.webp "Chú thích hiện dưới ảnh").
4. Xem thử khi còn draft: node tools/build-blog.mjs --drafts
   Xong thì xoá dòng "draft: true" rồi chạy: node tools/build-blog.mjs
   (Lưu ý: chạy lại không có --drafts trước khi commit để bài nháp không lọt lên web.)
-->

Đoạn mở đầu: bối cảnh, vấn đề bạn gặp.

## Một tiêu đề mục

Viết bình thường. **In đậm**, *in nghiêng*, `code ngắn`, [link](https://example.com).

- Gạch đầu dòng
- Gạch đầu dòng

```ts
// Khối code
const answer = 42;
```

> Trích dẫn hoặc điều đáng nhớ.

## Bài học rút ra

Kết bài.
