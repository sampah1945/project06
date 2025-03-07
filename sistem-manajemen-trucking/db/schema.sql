-- Tabel Pengguna
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    email TEXT,
    no_telepon TEXT,
    hak_akses TEXT NOT NULL,
    tanggal_dibuat DATETIME DEFAULT CURRENT_TIMESTAMP,
    terakhir_login DATETIME,
    status TEXT DEFAULT 'aktif'
);

-- Tabel Pelanggan
CREATE TABLE pelanggan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_pelanggan TEXT NOT NULL UNIQUE,
    nama_perusahaan TEXT NOT NULL,
    alamat TEXT NOT NULL,
    kota TEXT NOT NULL,
    provinsi TEXT NOT NULL,
    kode_pos TEXT,
    npwp TEXT,
    nama_kontak TEXT NOT NULL,
    jabatan_kontak TEXT,
    email TEXT,
    no_telepon TEXT NOT NULL,
    tanggal_registrasi DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'aktif',
    catatan TEXT
);

-- Tabel Driver
CREATE TABLE driver (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_driver TEXT NOT NULL UNIQUE,
    nama_lengkap TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_ktp TEXT NOT NULL UNIQUE,
    no_sim TEXT NOT NULL UNIQUE,
    tipe_sim TEXT NOT NULL,
    tanggal_lahir DATE NOT NULL,
    no_telepon TEXT NOT NULL,
    tanggal_bergabung DATE NOT NULL,
    status TEXT DEFAULT 'aktif',
    foto TEXT,
    catatan TEXT
);

-- Tabel Armada
CREATE TABLE armada (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_armada TEXT NOT NULL UNIQUE,
    nomor_polisi TEXT NOT NULL UNIQUE,
    jenis_kendaraan TEXT NOT NULL,
    merk TEXT NOT NULL,
    model TEXT NOT NULL,
    tahun_pembuatan INTEGER NOT NULL,
    kapasitas TEXT NOT NULL,
    tanggal_registrasi DATE NOT NULL,
    status TEXT DEFAULT 'aktif',
    terakhir_service DATE,
    jadwal_service DATE,
    catatan TEXT
);

-- Tabel Jenis Layanan
CREATE TABLE jenis_layanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_layanan TEXT NOT NULL UNIQUE,
    nama_layanan TEXT NOT NULL,
    deskripsi TEXT,
    status TEXT DEFAULT 'aktif'
);

-- Insert data awal untuk jenis layanan
INSERT INTO jenis_layanan (kode_layanan, nama_layanan, deskripsi) 
VALUES 
('PW', 'Port to Warehouse', 'Pengangkutan dari pelabuhan ke gudang'),
('WP', 'Warehouse to Port', 'Pengangkutan dari gudang ke pelabuhan');

-- Tabel Tarif
CREATE TABLE tarif (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenis_layanan_id INTEGER NOT NULL,
    asal TEXT NOT NULL,
    tujuan TEXT NOT NULL,
    jenis_kontainer TEXT NOT NULL,
    harga DECIMAL(15,2) NOT NULL,
    masa_berlaku_mulai DATE NOT NULL,
    masa_berlaku_selesai DATE,
    status TEXT DEFAULT 'aktif',
    FOREIGN KEY (jenis_layanan_id) REFERENCES jenis_layanan(id)
);

-- Tabel Booking Order
CREATE TABLE booking_order (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_booking TEXT NOT NULL UNIQUE,
    tanggal_booking DATETIME DEFAULT CURRENT_TIMESTAMP,
    pelanggan_id INTEGER NOT NULL,
    jenis_layanan_id INTEGER NOT NULL,
    asal TEXT NOT NULL,
    tujuan TEXT NOT NULL,
    jenis_kontainer TEXT NOT NULL,
    nomor_kontainer TEXT,
    nomor_seal TEXT,
    tanggal_pickup DATE NOT NULL,
    waktu_pickup TIME,
    tanggal_delivery DATE NOT NULL,
    waktu_delivery TIME,
    status TEXT DEFAULT 'terdaftar',
    catatan TEXT,
    dibuat_oleh INTEGER NOT NULL,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id),
    FOREIGN KEY (jenis_layanan_id) REFERENCES jenis_layanan(id),
    FOREIGN KEY (dibuat_oleh) REFERENCES users(id)
);

-- Tabel Penugasan
CREATE TABLE penugasan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_order_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    armada_id INTEGER NOT NULL,
    tanggal_penugasan DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ditugaskan',
    catatan TEXT,
    dibuat_oleh INTEGER NOT NULL,
    FOREIGN KEY (booking_order_id) REFERENCES booking_order(id),
    FOREIGN KEY (driver_id) REFERENCES driver(id),
    FOREIGN KEY (armada_id) REFERENCES armada(id),
    FOREIGN KEY (dibuat_oleh) REFERENCES users(id)
);

-- Tabel Tracking Pengiriman
CREATE TABLE tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    penugasan_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    lokasi TEXT,
    tanggal_waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,
    foto TEXT,
    diperbarui_oleh INTEGER NOT NULL,
    FOREIGN KEY (penugasan_id) REFERENCES penugasan(id),
    FOREIGN KEY (diperbarui_oleh) REFERENCES users(id)
);

-- Tabel Invoice
CREATE TABLE invoice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_invoice TEXT NOT NULL UNIQUE,
    tanggal_invoice DATE NOT NULL,
    pelanggan_id INTEGER NOT NULL,
    total_tagihan DECIMAL(15,2) NOT NULL,
    ppn DECIMAL(15,2) NOT NULL,
    grand_total DECIMAL(15,2) NOT NULL,
    tanggal_jatuh_tempo DATE NOT NULL,
    status_pembayaran TEXT DEFAULT 'belum dibayar',
    tanggal_pembayaran DATE,
    metode_pembayaran TEXT,
    catatan TEXT,
    dibuat_oleh INTEGER NOT NULL,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id),
    FOREIGN KEY (dibuat_oleh) REFERENCES users(id)
);

-- Tabel Detail Invoice
CREATE TABLE detail_invoice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    booking_order_id INTEGER NOT NULL,
    deskripsi TEXT NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id),
    FOREIGN KEY (booking_order_id) REFERENCES booking_order(id)
);

-- Tabel Biaya Operasional
CREATE TABLE biaya_operasional (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    penugasan_id INTEGER,
    jenis_biaya TEXT NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    tanggal DATE NOT NULL,
    keterangan TEXT,
    bukti_transaksi TEXT,
    status TEXT DEFAULT 'diajukan',
    disetujui_oleh INTEGER,
    disetujui_pada DATETIME,
    dibuat_oleh INTEGER NOT NULL,
    FOREIGN KEY (penugasan_id) REFERENCES penugasan(id),
    FOREIGN KEY (disetujui_oleh) REFERENCES users(id),
    FOREIGN KEY (dibuat_oleh) REFERENCES users(id)
);

-- Tabel Jenis Biaya
CREATE TABLE jenis_biaya (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE,
    kategori TEXT NOT NULL,
    deskripsi TEXT,
    status TEXT DEFAULT 'aktif'
);

-- Insert data awal untuk jenis biaya
INSERT INTO jenis_biaya (nama, kategori, deskripsi) 
VALUES 
('BBM', 'Transportasi', 'Biaya bahan bakar minyak'),
('Tol', 'Transportasi', 'Biaya tol'),
('Uang Makan Driver', 'Akomodasi', 'Biaya makan untuk driver'),
('Biaya Lift On/Off', 'Operasional', 'Biaya pengangkatan kontainer'),
('Perbaikan Kendaraan', 'Pemeliharaan', 'Biaya perbaikan dan perawatan kendaraan');

-- Tabel Laporan Kerusakan
CREATE TABLE laporan_kerusakan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    armada_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    jenis_kerusakan TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    tingkat_kerusakan TEXT NOT NULL,
    foto TEXT,
    status TEXT DEFAULT 'dilaporkan',
    estimasi_biaya DECIMAL(15,2),
    catatan_perbaikan TEXT,
    tanggal_selesai DATE,
    dibuat_oleh INTEGER NOT NULL,
    FOREIGN KEY (armada_id) REFERENCES armada(id),
    FOREIGN KEY (driver_id) REFERENCES driver(id),
    FOREIGN KEY (dibuat_oleh) REFERENCES users(id)
);

-- Tabel Notifikasi
CREATE TABLE notifikasi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    judul TEXT NOT NULL,
    pesan TEXT NOT NULL,
    jenis TEXT NOT NULL,
    dibaca BOOLEAN DEFAULT 0,
    tanggal_dibuat DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel Log Aktivitas
CREATE TABLE log_aktivitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    aktivitas TEXT NOT NULL,
    detail TEXT,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indeks untuk meningkatkan performa query
CREATE INDEX idx_pelanggan_kode ON pelanggan(kode_pelanggan);
CREATE INDEX idx_driver_kode ON driver(kode_driver);
CREATE INDEX idx_armada_kode ON armada(kode_armada);
CREATE INDEX idx_booking_order_nomor ON booking_order(nomor_booking);
CREATE INDEX idx_booking_order_pelanggan ON booking_order(pelanggan_id);
CREATE INDEX idx_booking_order_status ON booking_order(status);
CREATE INDEX idx_penugasan_booking ON penugasan(booking_order_id);
CREATE INDEX idx_tracking_penugasan ON tracking(penugasan_id);
CREATE INDEX idx_invoice_nomor ON invoice(nomor_invoice);
CREATE INDEX idx_invoice_pelanggan ON invoice(pelanggan_id);
CREATE INDEX idx_invoice_status ON invoice(status_pembayaran);
CREATE INDEX idx_detail_invoice_invoice ON detail_invoice(invoice_id);
CREATE INDEX idx_biaya_operasional_penugasan ON biaya_operasional(penugasan_id);
CREATE INDEX idx_biaya_operasional_tanggal ON biaya_operasional(tanggal);

-- Views untuk Laporan
-- View untuk ringkasan booking order
CREATE VIEW vw_ringkasan_booking AS
SELECT 
    bo.id,
    bo.nomor_booking,
    bo.tanggal_booking,
    p.nama_perusahaan AS nama_pelanggan,
    jl.nama_layanan,
    bo.asal,
    bo.tujuan,
    bo.jenis_kontainer,
    bo.nomor_kontainer,
    bo.tanggal_pickup,
    bo.tanggal_delivery,
    bo.status,
    COALESCE(d.nama_lengkap, '-') AS nama_driver,
    COALESCE(a.nomor_polisi, '-') AS nomor_polisi
FROM booking_order bo
LEFT JOIN pelanggan p ON bo.pelanggan_id = p.id
LEFT JOIN jenis_layanan jl ON bo.jenis_layanan_id = jl.id
LEFT JOIN penugasan pn ON bo.id = pn.booking_order_id
LEFT JOIN driver d ON pn.driver_id = d.id
LEFT JOIN armada a ON pn.armada_id = a.id;

-- View untuk laporan pendapatan
CREATE VIEW vw_laporan_pendapatan AS
SELECT 
    i.nomor_invoice,
    i.tanggal_invoice,
    p.nama_perusahaan,
    bo.nomor_booking,
    jl.nama_layanan,
    bo.asal,
    bo.tujuan,
    bo.jenis_kontainer,
    di.jumlah AS pendapatan,
    i.status_pembayaran
FROM invoice i
JOIN detail_invoice di ON i.id = di.invoice_id
JOIN booking_order bo ON di.booking_order_id = bo.id
JOIN pelanggan p ON i.pelanggan_id = p.id
JOIN jenis_layanan jl ON bo.jenis_layanan_id = jl.id;

-- View untuk laporan biaya operasional
CREATE VIEW vw_laporan_operasional AS
SELECT 
    bo.id AS booking_id,
    bo.nomor_booking,
    p.nama_perusahaan,
    jl.nama_layanan,
    bo.asal,
    bo.tujuan,
    bo.jenis_kontainer,
    d.nama_lengkap AS nama_driver,
    a.nomor_polisi,
    biaya.jenis_biaya,
    biaya.jumlah AS biaya_operasional,
    biaya.tanggal AS tanggal_biaya
FROM biaya_operasional biaya
JOIN penugasan pn ON biaya.penugasan_id = pn.id
JOIN booking_order bo ON pn.booking_order_id = bo.id
JOIN pelanggan p ON bo.pelanggan_id = p.id
JOIN jenis_layanan jl ON bo.jenis_layanan_id = jl.id
JOIN driver d ON pn.driver_id = d.id
JOIN armada a ON pn.armada_id = a.id;

-- View untuk laporan profitabilitas
CREATE VIEW vw_laporan_profit AS
SELECT 
    bo.id AS booking_id,
    bo.nomor_booking,
    p.nama_perusahaan,
    jl.nama_layanan,
    bo.asal,
    bo.tujuan,
    bo.jenis_kontainer,
    di.jumlah AS pendapatan,
    COALESCE(SUM(biaya.jumlah), 0) AS total_biaya,
    (di.jumlah - COALESCE(SUM(biaya.jumlah), 0)) AS profit,
    CASE 
        WHEN di.jumlah = 0 THEN 0
        ELSE ROUND(((di.jumlah - COALESCE(SUM(biaya.jumlah), 0)) / di.jumlah) * 100, 2)
    END AS margin_profit_persen
FROM booking_order bo
JOIN penugasan pn ON bo.id = pn.booking_order_id
JOIN pelanggan p ON bo.pelanggan_id = p.id
JOIN jenis_layanan jl ON bo.jenis_layanan_id = jl.id
JOIN detail_invoice di ON bo.id = di.booking_order_id
LEFT JOIN biaya_operasional biaya ON pn.id = biaya.penugasan_id
GROUP BY bo.id, di.jumlah;

-- View untuk performa driver
CREATE VIEW vw_performa_driver AS
SELECT 
    d.id AS driver_id,
    d.nama_lengkap AS nama_driver,
    COUNT(pn.id) AS jumlah_tugas,
    COUNT(CASE WHEN bo.status = 'selesai' THEN 1 END) AS tugas_selesai,
    ROUND(COUNT(CASE WHEN bo.status = 'selesai' THEN 1 END) * 100.0 / COUNT(pn.id), 2) AS persentase_penyelesaian,
    AVG(JULIANDAY(tr_selesai.tanggal_waktu) - JULIANDAY(bo.tanggal_pickup)) AS rata_rata_waktu_penyelesaian_hari
FROM driver d
LEFT JOIN penugasan pn ON d.id = pn.driver_id
LEFT JOIN booking_order bo ON pn.booking_order_id = bo.id
LEFT JOIN tracking tr_selesai ON pn.id = tr_selesai.penugasan_id AND tr_selesai.status = 'selesai'
GROUP BY d.id, d.nama_lengkap;

-- View untuk status armada
CREATE VIEW vw_status_armada AS
SELECT 
    a.id AS armada_id,
    a.kode_armada,
    a.nomor_polisi,
    a.jenis_kendaraan,
    a.merk,
    a.model,
    a.status,
    COUNT(pn.id) AS jumlah_penugasan,
    COUNT(DISTINCT lk.id) AS jumlah_kerusakan,
    MAX(lk.tanggal) AS tanggal_kerusakan_terakhir,
    MAX(bo.tanggal_delivery) AS penggunaan_terakhir,
    a.terakhir_service,
    a.jadwal_service
FROM armada a
LEFT JOIN penugasan pn ON a.id = pn.armada_id
LEFT JOIN booking_order bo ON pn.booking_order_id = bo.id
LEFT JOIN laporan_kerusakan lk ON a.id = lk.armada_id
GROUP BY a.id, a.kode_armada, a.nomor_polisi;

-- Trigger untuk mengupdate status booking saat ada penugasan baru
CREATE TRIGGER update_booking_status_on_assignment
AFTER INSERT ON penugasan
BEGIN
    UPDATE booking_order 
    SET status = 'ditugaskan'
    WHERE id = NEW.booking_order_id AND status = 'terdaftar';
END;

-- Trigger untuk update status booking saat status tracking diupdate
CREATE TRIGGER update_booking_status_on_tracking
AFTER INSERT ON tracking
BEGIN
    UPDATE booking_order 
    SET status = NEW.status
    WHERE id = (SELECT booking_order_id FROM penugasan WHERE id = NEW.penugasan_id);
END;

-- User Admin default
INSERT INTO users (username, password, nama_lengkap, jabatan, email, no_telepon, hak_akses)
VALUES ('admin', '$2a$10$bNTNHIKiYH0/3LuKFg1vF.vQe7sVyKiPgH6YnOhQXEpA3W9cJnO2G', 'Administrator', 'System Administrator', 'admin@trucking.id', '08123456789', 'admin');