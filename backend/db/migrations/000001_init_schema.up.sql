SET TIME ZONE 'UTC';
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Cần thiết để tạo UUID

-- ============================================================
-- PHẦN 3: TẠO BẢNG (SCHEMA)
-- ============================================================

-- 1. Bảng Quyền (Roles)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE -- Ví dụ: ADMIN, CAN_BO, DOANH_NGHIEP
);

-- 2. Bảng Doanh Nghiệp
CREATE TABLE doanh_nghiep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_doanh_nghiep_vi TEXT NOT NULL,
    ten_doanh_nghiep_en TEXT,
    ten_viet_tat TEXT,
    dia_chi TEXT NOT NULL,
    ma_so_doanh_nghiep VARCHAR(50) NOT NULL UNIQUE,
    ngay_cap_msdn_lan_dau DATE NOT NULL,
    noi_cap_msdn TEXT NOT NULL,
    so_lan_thay_doi_msdn INTEGER,
    ngay_thay_doi_msdn DATE,
    sdt VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    von_dieu_le VARCHAR(100),
    nguoi_dai_dien TEXT,
    chuc_vu TEXT,
    loai_dinh_danh VARCHAR(50),
    ngay_cap_dinh_danh DATE,
    noi_cap_dinh_danh TEXT,
    
    status BOOLEAN DEFAULT FALSE, -- False: Chờ duyệt, True: Đã kích hoạt
    file_gcndkdn TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Loại Tài Liệu (Danh mục dùng chung)
CREATE TABLE loai_tai_lieu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten TEXT NOT NULL UNIQUE,
    mo_ta TEXT
);

-- 4. Bảng Users (Tài khoản đăng nhập)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    role_id UUID NOT NULL REFERENCES roles(id),
    -- Quan trọng: Link tài khoản với doanh nghiệp (Nếu là user doanh nghiệp)
    doanh_nghiep_id UUID NULL REFERENCES doanh_nghiep(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Hồ Sơ (Thủ tục hành chính)
CREATE TABLE ho_so (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doanh_nghiep_id UUID NOT NULL REFERENCES doanh_nghiep(id), 
    ma_ho_so VARCHAR(100) NOT NULL UNIQUE,
    loai_thu_tuc TEXT NOT NULL,
    
    ngay_dang_ky TIMESTAMPTZ NOT NULL, 
    ngay_tiep_nhan TIMESTAMPTZ NULL, 
    ngay_hen_tra TIMESTAMPTZ NULL,
    
    so_giay_phep_theo_ho_so VARCHAR(100),
    trang_thai_ho_so VARCHAR(100) NOT NULL, -- Ví dụ: ChoTiepNhan, DangXuLy, DaCapPhep
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Trung gian Hồ sơ - Loại tài liệu
CREATE TABLE ho_so_tai_lieu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ho_so_id UUID NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    loai_tai_lieu_id UUID NOT NULL REFERENCES loai_tai_lieu(id) ON DELETE RESTRICT, 
    UNIQUE(ho_so_id, loai_tai_lieu_id)
);

-- 7. Bảng File đính kèm (Chi tiết tài liệu)
CREATE TABLE tai_lieu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ho_so_tai_lieu_id UUID NOT NULL REFERENCES ho_so_tai_lieu(id) ON DELETE CASCADE, 
    tieu_de TEXT,
    duong_dan TEXT NOT NULL, -- Path file trên server/minio
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Giấy Phép (Kết quả sau khi xử lý hồ sơ)
CREATE TABLE giay_phep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ho_so_id UUID NOT NULL UNIQUE REFERENCES ho_so(id), 
    
    loai_giay_phep VARCHAR(100) NOT NULL,
    so_giay_phep VARCHAR(100) NOT NULL UNIQUE,
    ngay_hieu_luc DATE NOT NULL,
    ngay_het_han DATE NOT NULL,
    
    trang_thai_giay_phep VARCHAR(100) NOT NULL,
    file_duong_dan TEXT NULL,
    
    -- Trường phục vụ Blockchain
    h1_hash TEXT NULL,
    h2_hash TEXT NULL,
    trang_thai_blockchain VARCHAR(100) NULL DEFAULT 'ChuaDongBo',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHẦN 4: TẠO INDEX (TỐI ƯU TỐC ĐỘ)
-- ============================================================
CREATE INDEX idx_dn_ma_so_doanh_nghiep ON doanh_nghiep(ma_so_doanh_nghiep);
CREATE INDEX idx_hs_ma_ho_so ON ho_so(ma_ho_so);
CREATE INDEX idx_hs_doanh_nghiep_id ON ho_so(doanh_nghiep_id); 
CREATE INDEX idx_hstl_ho_so_id ON ho_so_tai_lieu(ho_so_id);
CREATE INDEX idx_hstl_loai_tai_lieu_id ON ho_so_tai_lieu(loai_tai_lieu_id);
CREATE INDEX idx_tl_ho_so_tai_lieu_id ON tai_lieu(ho_so_tai_lieu_id);
CREATE INDEX idx_gp_so_giay_phep ON giay_phep(so_giay_phep);
CREATE INDEX idx_gp_ho_so_id ON giay_phep(ho_so_id); 

-- ============================================================
-- PHẦN 5: DỮ LIỆU KHỞI TẠO (SEED DATA)
-- ============================================================

-- 1. Tạo Roles (QUAN TRỌNG: Code Go tìm role theo tên 'DOANH_NGHIEP')
INSERT INTO roles (name) VALUES ('ADMIN'), ('CAN_BO'), ('DOANH_NGHIEP');

-- 2. Tạo Danh mục tài liệu mẫu
INSERT INTO loai_tai_lieu (ten, mo_ta) VALUES
('Đơn đề nghị cấp Giấy phép kinh doanh', 'Sử dụng khi doanh nghiệp nộp hồ sơ xin cấp phép kinh doanh lần đầu.'),
('Đơn đề nghị cấp sửa đổi, bổ sung Giấy phép kinh doanh', 'Sử dụng khi doanh nghiệp có thay đổi nội dung trên giấy phép đã được cấp.'),
('Đơn đề nghị gia hạn Giấy phép kinh doanh', 'Sử dụng khi giấy phép kinh doanh sắp hết hạn và doanh nghiệp muốn tiếp tục hoạt động.'),
('Đơn đề nghị cấp lại Giấy phép kinh doanh', 'Sử dụng khi giấy phép bị mất, hỏng, rách nát hoặc thông tin thay đổi do sắp xếp lại.'),
('Đơn đề nghị cấp Giấy phép xuất khẩu, nhập khẩu', 'Đơn đề nghị cấp phép cho các sản phẩm/dịch vụ mật mã dân sự khi xuất/nhập khẩu.'),
('Giấy chứng nhận đăng ký doanh nghiệp', 'Bản sao/scan Giấy chứng nhận đăng ký doanh nghiệp (GCN ĐKKD) mới nhất.'),
('Giấy phép kinh doanh sản phẩm, dịch vụ mật mã dân sự', 'Bản sao/scan Giấy phép kinh doanh (GPKD) hiện tại của doanh nghiệp (nếu đang xin sửa đổi, gia hạn).'),
('Danh sách đội ngũ kĩ thuật và văn bằng', 'Tài liệu chứng minh năng lực kỹ thuật, trình độ chuyên môn của nhân sự.'),
('Phương án kinh doanh', 'Tài liệu mô tả kế hoạch, chiến lược, thị trường và mục tiêu kinh doanh sản phẩm/dịch vụ.'),
('Phương án bảo mật và an toàn thông tin mạng', 'Tài liệu mô tả các giải pháp, biện pháp đảm bảo an toàn, bảo mật thông tin và dữ liệu.'),
('Phương án kỹ thuật và Phương án bảo hành bảo trì', 'Mô tả giải pháp kỹ thuật của sản phẩm/dịch vụ và chính sách hỗ trợ, bảo hành sau bán hàng.'),
('Tài liệu kĩ thuật', 'Các tài liệu đặc tả kỹ thuật, datasheet, catalogue, tiêu chuẩn của sản phẩm/dịch vụ.'),
('Báo cáo hoạt động của doanh nghiệp', 'Báo cáo tổng kết tình hình hoạt động kinh doanh, kỹ thuật theo định kỳ (thường là 1 năm).'),
('Giấy chứng nhận hợp quy', 'Giấy chứng nhận sản phẩm/dịch vụ đáp ứng các tiêu chuẩn, quy chuẩn kỹ thuật của cơ quan có thẩm quyền.');


INSERT INTO users (email, password_hash, full_name, role_id)
SELECT 
    'admin@system.com',
    '$2a$10$7qF7r3WzFSN1Hf6p7KcY.u4jJ3rJtL1oZhp2sFvR1w8A0rQ1ZZqHy', 
    'Super Admin',
    id
FROM roles
WHERE name = 'ADMIN';

