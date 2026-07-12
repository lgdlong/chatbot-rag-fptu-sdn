# HƯỚNG DẪN SỬ DỤNG - HỆ THỐNG CÀO DỮ LIỆU SYLLABUS FPT FLM

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường và sử dụng 3 công cụ trích xuất dữ liệu Syllabus từ hệ thống Quản lý Syllabus của FPT (FLM - `flm.fpt.edu.vn`).

---

## 🛠️ Chuẩn Bị Môi Trường (Chỉ thực hiện một lần)

Để chạy được các script Python (Cách 2 và Cách 3), bạn cần cài đặt các thư viện cần thiết.

### Bước 1: Kiểm tra Python
Đảm bảo máy tính của bạn đã cài đặt Python 3.10 trở lên. Bạn có thể kiểm tra bằng lệnh:
```bash
python --version
```

### Bước 2: Cài đặt các thư viện Python
Mở Terminal/PowerShell tại thư mục dự án và chạy lệnh sau để cài đặt các thư viện (BeautifulSoup4, Pandas, Openpyxl, Playwright, Lxml):
```bash
pip install -r requirements.txt
```

### Bước 3: Cài đặt trình duyệt Playwright (Chỉ dành cho Cách 3)
Chạy lệnh sau để tải xuống trình duyệt Chromium tích hợp phục vụ việc cào dữ liệu tự động:
```bash
python -m playwright install chromium
```

---

## 🚀 HƯỚNG DẪN CHI TIẾT 3 PHƯƠNG PHÁP CÀO DỮ LIỆU

### 1️⃣ CÁCH 1: Trích xuất trực tiếp bằng Console Trình Duyệt (Nhanh nhất - Không cần cài đặt)

Cách này phù hợp khi bạn đang mở trang Syllabus trên trình duyệt và muốn tải dữ liệu về ngay lập tức dưới dạng file JSON mà không muốn chạy terminal hay cài đặt gì.

* **Bước 1**: Đăng nhập và mở trang Syllabus bạn muốn cào trên Chrome/Edge/Firefox. 
  *(Ví dụ: `https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=10358`)*
* **Bước 2**: Nhấn phím **F12** (hoặc click chuột phải -> chọn **Inspect / Kiểm tra**), sau đó chọn tab **Console**.
* **Bước 3**: Mở file **[console_extractor.js](../console_extractor.js)** trong dự án, copy toàn bộ nội dung mã nguồn của nó.
* **Bước 4**: Paste (dán) đoạn code vừa copy vào tab **Console** và nhấn **Enter**.
* **Kết quả**: Script sẽ phân tích DOM hiện tại của trang web và tự động tải xuống file JSON có tên `<TIMESTAMP>_<MÃ_MÔN_HỌC>_syllabus.json` (Ví dụ: `20260522_132000_PRN211_syllabus.json`).

---

### 2️⃣ CÁCH 2: Phân tích File HTML Tải Về (An toàn & Offline)

Cách này cực kỳ hữu ích khi bạn đã lưu các trang Syllabus dưới dạng offline trên máy tính và muốn trích xuất hàng loạt sang định dạng **JSON** và **Excel (.xlsx)** chuyên nghiệp.

* **Bước 1**: Mở trang Syllabus trên trình duyệt, nhấn **Ctrl + S** (hoặc Cmd + S), chọn định dạng **Webpage, HTML Only** để lưu trang web thành file `.html` (ví dụ: `Syllabus.html`).
* **Bước 2**: Di chuyển file `.html` vừa tải vào thư mục dự án.
* **Bước 3**: Chạy script phân tích bằng lệnh:
  ```bash
  python parse_local_html.py <tên_file_của_bạn.html>
  ```
  *(Ví dụ: `python parse_local_html.py sample_syllabus.html`)*
* **Kết quả**: Chương trình sẽ tạo ra các file được đặt tên có tiền tố thời gian (`YYYYMMDD_HHMMSS`) để bạn dễ dàng phân định cũ mới:
  * **`<TIMESTAMP>_<MÃ_MÔN>_details.json`**: Chứa toàn bộ dữ liệu cấu trúc dạng JSON đầy đủ 100% (bao gồm Description, Student Tasks, 12 cột Assessment, v.v.).
  * **`<TIMESTAMP>_<MÃ_MÔN>_details.xlsx`**: File Excel cao cấp được trang trí chuyên nghiệp gồm **7 Sheets** liên kết chặt chẽ (**General Info**, **Materials**, **CLOs**, **Weekly Schedule**, **Constructive Questions**, **Assessment Scheme**, **References**).
  * *Lưu ý phục hồi thông minh*: Nếu file Excel chính đang bị khóa, chương trình sẽ tự động phát hiện và lưu bảng tính đẹp mắt vào đường dẫn thay thế `<TIMESTAMP>_<MÃ_MÔN>_details_new.xlsx` mà không làm gián đoạn tiến trình.

---

### 3️⃣ CÁCH 3: Cào Tự Động Hàng Loạt Bằng Playwright

Đây là giải pháp cào tự động hoàn toàn dành cho các Syllabus ID khác nhau. Do hệ thống FLM bắt buộc phải đăng nhập bằng email FPT (Google Sign-In), giải pháp này hoạt động thông qua việc **lưu trạng thái phiên đăng nhập (session)** một lần duy nhất.

#### Bước 1: Lưu phiên đăng nhập (Chỉ làm 1 lần)
Chạy lệnh sau:
```bash
python playwright_crawler.py --login
```
* Một cửa sổ trình duyệt Chromium sẽ tự động hiện lên.
* **Bạn hãy đăng nhập tài khoản FPT (hoặc FE) của mình** bằng Google như bình thường.
* Sau khi đã đăng nhập thành công và nhìn thấy trang Dashboard chính của FLM, bạn hãy **quay lại cửa sổ Terminal/Command Prompt** và nhấn **[ENTER]**.
* Script sẽ lưu thông tin phiên đăng nhập (cookies & localStorage) vào file `session.json` và đóng trình duyệt.

#### Bước 2: Tiến hành cào dữ liệu tự động theo Syllabus ID
Giờ đây, bạn có thể cào bất kỳ Syllabus ID nào mà không cần đăng nhập lại:
```bash
# Cào 1 môn học (ví dụ ID 10358)
python playwright_crawler.py 10358

# Cào hàng loạt nhiều môn học cùng lúc (các ID cách nhau bằng khoảng trắng)
python playwright_crawler.py 10358 10250 9942
```
* **Kết quả**: Chương trình sẽ tự động mở trang web ngầm (headless), sử dụng cookies đã lưu để truy cập, lấy mã nguồn HTML của từng môn, cào dữ liệu và lưu tự động các file JSON + Excel cao cấp tương ứng với từng môn học.

---

### 4️⃣ CÁCH 4: Cào siêu tốc bằng file Cookie có sẵn (Phương pháp Tối ưu nhất)

Nếu bạn đã có sẵn file export cookie từ trình duyệt (ví dụ như file `data/flm.fpt.edu.vn_cookies.txt` bạn vừa cung cấp), phương pháp này là **tối ưu nhất, nhẹ nhất và nhanh nhất** (chỉ mất 1 giây/môn) vì nó không cần khởi chạy bất kỳ trình duyệt ảo nào.

* **Bước 1**: Đảm bảo file cookie định dạng Netscape của bạn đã được đặt tại đường dẫn: `data/flm.fpt.edu.vn_cookies.txt` trong dự án.
* **Bước 2**: Chạy lệnh cào dữ liệu:
  ```bash
  # Cào Syllabus mặc định (ID 10358)
  python crawl_with_cookies.py

  # Cào Syllabus của một hoặc nhiều ID cụ thể
  python crawl_with_cookies.py 10358 10250 9942
  ```
* **Kết quả**: Dữ liệu được tải trực tiếp bằng giao thức HTTP an toàn, giải nén và xuất ngay ra các file JSON và Excel cao cấp cực kỳ nhanh chóng.

---

### 5️⃣ CÁCH 5: Tự động phân giải Mã Môn Học FAP thành sylID trên FLM

Vì khung chương trình học trên FAP của bạn **không chứa link sylID trực tiếp** mà chỉ chứa text thuần mã môn, đồng thời cookie FLM có thể hết hạn, giải pháp tối ưu nhất là sử dụng session của Playwright để tự động hóa việc tìm kiếm và phân giải hàng loạt:

* **Bước 1 (Đăng nhập)**: Chạy lệnh sau để đăng nhập tài khoản FPT của bạn trên trình duyệt Chromium ảo:
  ```bash
  python playwright_crawler.py --login
  ```
  Sau khi đăng nhập thành công và thấy dashboard chính của FLM, quay lại terminal và nhấn **Enter**. Hệ thống sẽ tự động lưu session vào tệp `session.json`.

* **Bước 2 (Tìm kiếm tự động)**: Chạy script tìm kiếm thông minh mới để quét toàn bộ 81 môn học đã được trích xuất từ FAP:
  ```bash
  python search_flm_syllabus.py
  ```
  * Script sẽ tự động đọc danh sách 81 mã môn từ `data/fap_curriculum_text.json`, mở trang tìm kiếm của FLM ẩn danh, điền mã môn và trích xuất chính xác `sylID` của môn đó.
  * Toàn bộ ID tìm được sẽ tự động lưu vào `data/syl_ids.txt`, đồng thời trường `syl_id` và link FLM tương ứng sẽ được cập nhật trực tiếp vào file dữ liệu khung chương trình `data/fap_curriculum_text.json`.

* **Bước 3 (Cào chi tiết hàng loạt)**: Sau khi đã có file `data/syl_ids.txt` đầy đủ ID, chạy lệnh sau để tải toàn bộ syllabus chi tiết dạng JSON và Excel cao cấp về máy:
  ```bash
  python crawl_with_cookies.py
  ```

---

## 📊 Giải thích Định Dạng Dữ Liệu Đầu Ra

Dữ liệu Syllabus sau khi cào sẽ được phân tách khoa học thành các phần chất lượng cao:
1. **General Info (Thông tin chung)**: Chứa toàn bộ thông tin môn học, mã môn, số tín chỉ, thang điểm, điều kiện qua môn, mô tả khóa học chi tiết (`Description`) và nhiệm vụ chi tiết của sinh viên (`Student Tasks`).
2. **Materials (Tài liệu giáo cụ)**: Danh sách đầy đủ tài liệu bao gồm tác giả, nhà xuất bản, năm, ISBN, tài liệu bản cứng, bản mềm hay học liệu trực tuyến.
3. **CLOs (Chuẩn đầu ra môn học)**: Chi tiết các kỹ năng/chuẩn đầu ra (CLO1 - CLO5) kết hợp với LO tương ứng.
4. **Weekly Schedule (Lịch trình buổi học)**: Buổi số, tên chủ đề học, phương pháp dạy học, mã LO chuẩn, học liệu buổi đó và nhiệm vụ cụ thể của sinh viên.
5. **Constructive Questions (Câu hỏi tranh luận)**: Hệ thống các câu hỏi kiến tạo tích cực cho từng buổi học dùng trong Edunext nhằm tăng cường tranh luận.
6. **Assessment Scheme (Phân bổ điểm)**: Bảng điểm chi tiết đủ **12 cột** đầy đủ thông tin nhất (loại điểm, trọng số, chuẩn CLO, hình thức thi, thời gian, mô tả kiến thức kỹ năng `Knowledge and Skill`, hướng dẫn chấm bài `Grading Guide`, ghi chú `Note`).
7. **References (Tài liệu tham khảo)**: Giáo trình chính và các tài liệu nghiên cứu tham chiếu.
