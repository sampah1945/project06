const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Inisialisasi database
let db;

function createDatabase() {
  // Lokasi database
  const dbPath = path.join(app.getPath('userData'), 'trucking_db.sqlite');
  
  // Cek apakah database sudah ada
  const dbExists = fs.existsSync(dbPath);
  
  // Buka koneksi ke database
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Gagal membuka database:', err.message);
    } else {
      console.log('Berhasil terhubung ke database SQLite');
      
      // Jika database baru, inisialisasi dengan skema
      if (!dbExists) {
        console.log('Membuat database baru...');
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Eksekusi skema SQL
        db.exec(schemaSQL, (err) => {
          if (err) {
            console.error('Gagal menginisialisasi database:', err.message);
          } else {
            console.log('Database berhasil diinisialisasi');
          }
        });
      }
    }
  });
}

ipcMain.handle('update-armada', async (event, data) => {
  const { id, kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
          kapasitas, tanggal_registrasi, status, terakhir_service, jadwal_service, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE armada SET 
              kode_armada = ?, nomor_polisi = ?, jenis_kendaraan = ?, merk = ?, 
              model = ?, tahun_pembuatan = ?, kapasitas = ?, tanggal_registrasi = ?, 
              status = ?, terakhir_service = ?, jadwal_service = ?, catatan = ?
            WHERE id = ?`, 
      [kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
       kapasitas, tanggal_registrasi, status, terakhir_service, jadwal_service, catatan, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Booking Order
ipcMain.handle('get-booking-orders', async (event, filter) => {
  let sql = 'SELECT * FROM vw_ringkasan_booking';
  const params = [];
  
  if (filter) {
    const whereClauses = [];
    
    if (filter.status) {
      whereClauses.push('status = ?');
      params.push(filter.status);
    }
    
    if (filter.startDate && filter.endDate) {
      whereClauses.push('tanggal_booking BETWEEN ? AND ?');
      params.push(filter.startDate, filter.endDate);
    }
    
    if (filter.pelangganId) {
      whereClauses.push('pelanggan_id = ?');
      params.push(filter.pelangganId);
    }
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
  }
  
  sql += ' ORDER BY tanggal_booking DESC';
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-booking-detail', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM vw_ringkasan_booking WHERE id = ?', [id], (err, booking) => {
      if (err) reject(err);
      else resolve(booking);
    });
  });
});

ipcMain.handle('generate-booking-number', async () => {
  const today = new Date();
  const year = today.getFullYear().toString().substr(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `BO${year}${month}`;
  
  return new Promise((resolve, reject) => {
    db.get('SELECT MAX(nomor_booking) as max_number FROM booking_order WHERE nomor_booking LIKE ?', 
      [`${prefix}%`], 
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          let nextNumber = 1;
          if (result.max_number) {
            const currentNumber = parseInt(result.max_number.substr(-4));
            nextNumber = currentNumber + 1;
          }
          resolve(`${prefix}${nextNumber.toString().padStart(4, '0')}`);
        }
      }
    );
  });
});

ipcMain.handle('add-booking', async (event, data) => {
  const { nomor_booking, pelanggan_id, jenis_layanan_id, asal, tujuan, jenis_kontainer, 
          nomor_kontainer, nomor_seal, tanggal_pickup, waktu_pickup, tanggal_delivery, 
          waktu_delivery, catatan, dibuat_oleh } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO booking_order (
              nomor_booking, pelanggan_id, jenis_layanan_id, asal, tujuan, jenis_kontainer, 
              nomor_kontainer, nomor_seal, tanggal_pickup, waktu_pickup, tanggal_delivery, 
              waktu_delivery, catatan, dibuat_oleh
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [nomor_booking, pelanggan_id, jenis_layanan_id, asal, tujuan, jenis_kontainer, 
       nomor_kontainer, nomor_seal, tanggal_pickup, waktu_pickup, tanggal_delivery, 
       waktu_delivery, catatan, dibuat_oleh],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('update-booking', async (event, data) => {
  const { id, pelanggan_id, jenis_layanan_id, asal, tujuan, jenis_kontainer, 
          nomor_kontainer, nomor_seal, tanggal_pickup, waktu_pickup, tanggal_delivery, 
          waktu_delivery, status, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE booking_order SET 
              pelanggan_id = ?, jenis_layanan_id = ?, asal = ?, tujuan = ?, 
              jenis_kontainer = ?, nomor_kontainer = ?, nomor_seal = ?, 
              tanggal_pickup = ?, waktu_pickup = ?, tanggal_delivery = ?, 
              waktu_delivery = ?, status = ?, catatan = ?
            WHERE id = ?`, 
      [pelanggan_id, jenis_layanan_id, asal, tujuan, jenis_kontainer, 
       nomor_kontainer, nomor_seal, tanggal_pickup, waktu_pickup, tanggal_delivery, 
       waktu_delivery, status, catatan, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Penugasan
ipcMain.handle('get-available-drivers', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM driver WHERE status = 'aktif' AND id NOT IN 
            (SELECT driver_id FROM penugasan 
             JOIN booking_order ON penugasan.booking_order_id = booking_order.id 
             WHERE booking_order.status IN ('ditugaskan', 'dalam perjalanan'))`, 
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle('getPenugasanData', async (event, filter) => {
  let sql = `
    SELECT pn.id, pn.booking_order_id, pn.driver_id, pn.armada_id, 
           pn.tanggal_penugasan, pn.status, pn.catatan,
           bo.nomor_booking, bo.asal, bo.tujuan, bo.jenis_kontainer,
           p.nama_perusahaan as nama_pelanggan,
           d.nama_lengkap as nama_driver, a.nomor_polisi
    FROM penugasan pn
    JOIN booking_order bo ON pn.booking_order_id = bo.id
    JOIN driver d ON pn.driver_id = d.id
    JOIN armada a ON pn.armada_id = a.id
    JOIN pelanggan p ON bo.pelanggan_id = p.id
  `;
  
  const params = [];
  const whereClauses = [];
  
  if (filter) {
    if (filter.status) {
      whereClauses.push('pn.status = ?');
      params.push(filter.status);
    }
    
    if (filter.driverId) {
      whereClauses.push('pn.driver_id = ?');
      params.push(filter.driverId);
    }
    
    if (filter.startDate && filter.endDate) {
      whereClauses.push('DATE(pn.tanggal_penugasan) BETWEEN ? AND ?');
      params.push(filter.startDate, filter.endDate);
    }
  }
  
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  sql += ' ORDER BY pn.tanggal_penugasan DESC';
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-available-armada', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM armada WHERE status = 'aktif' AND id NOT IN 
            (SELECT armada_id FROM penugasan 
             JOIN booking_order ON penugasan.booking_order_id = booking_order.id 
             WHERE booking_order.status IN ('ditugaskan', 'dalam perjalanan'))`, 
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle('add-penugasan', async (event, data) => {
  const { booking_order_id, driver_id, armada_id, catatan, dibuat_oleh } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO penugasan (
              booking_order_id, driver_id, armada_id, catatan, dibuat_oleh
            ) VALUES (?, ?, ?, ?, ?)`, 
      [booking_order_id, driver_id, armada_id, catatan, dibuat_oleh],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('getPenugasanDetail', async (event, id) => {
  const sql = `
    SELECT pn.id, pn.booking_order_id, pn.driver_id, pn.armada_id, 
           pn.tanggal_penugasan, pn.status, pn.catatan,
           bo.nomor_booking, bo.asal, bo.tujuan, bo.jenis_kontainer, bo.tanggal_pickup,
           p.nama_perusahaan as nama_pelanggan,
           d.nama_lengkap as nama_driver, a.nomor_polisi
    FROM penugasan pn
    JOIN booking_order bo ON pn.booking_order_id = bo.id
    JOIN driver d ON pn.driver_id = d.id
    JOIN armada a ON pn.armada_id = a.id
    JOIN pelanggan p ON bo.pelanggan_id = p.id
    WHERE pn.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

ipcMain.handle('getActivePenugasan', async () => {
  const sql = `
    SELECT pn.id, bo.nomor_booking, d.nama_lengkap as nama_driver, a.nomor_polisi
    FROM penugasan pn
    JOIN booking_order bo ON pn.booking_order_id = bo.id
    JOIN driver d ON pn.driver_id = d.id
    JOIN armada a ON pn.armada_id = a.id
    WHERE pn.status IN ('ditugaskan', 'dalam perjalanan')
    ORDER BY pn.tanggal_penugasan DESC
  `;
  
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('getAvailableBookings', async () => {
  const sql = `
    SELECT bo.id, bo.nomor_booking, bo.asal, bo.tujuan, p.nama_perusahaan as nama_pelanggan
    FROM booking_order bo
    JOIN pelanggan p ON bo.pelanggan_id = p.id
    WHERE bo.status = 'terdaftar'
    AND bo.id NOT IN (SELECT booking_order_id FROM penugasan)
    ORDER BY bo.tanggal_booking DESC
  `;
  
  return new

// Tracking
ipcMain.handle('get-tracking', async (event, penugasanId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tracking WHERE penugasan_id = ? ORDER BY tanggal_waktu', 
      [penugasanId], 
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle('getTrackingData', async (event, filter) => {
  let sql = `
    SELECT t.id, t.penugasan_id, t.status, t.lokasi, t.tanggal_waktu, t.keterangan, t.foto,
           bo.nomor_booking, p.nama_perusahaan as nama_pelanggan,
           d.nama_lengkap as nama_driver, a.nomor_polisi
    FROM tracking t
    JOIN penugasan pn ON t.penugasan_id = pn.id
    JOIN booking_order bo ON pn.booking_order_id = bo.id
    JOIN driver d ON pn.driver_id = d.id
    JOIN armada a ON pn.armada_id = a.id
    JOIN pelanggan p ON bo.pelanggan_id = p.id
  `;
  
  const params = [];
  const whereClauses = [];
  
  if (filter) {
    if (filter.status) {
      whereClauses.push('t.status = ?');
      params.push(filter.status);
    }
    
    if (filter.driverId) {
      whereClauses.push('pn.driver_id = ?');
      params.push(filter.driverId);
    }
    
    if (filter.startDate && filter.endDate) {
      whereClauses.push('DATE(t.tanggal_waktu) BETWEEN ? AND ?');
      params.push(filter.startDate, filter.endDate);
    }
  }
  
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  sql += ' ORDER BY t.tanggal_waktu DESC';
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('getTrackingDetail', async (event, id) => {
  const sql = `
    SELECT t.id, t.penugasan_id, t.status, t.lokasi, t.tanggal_waktu, t.keterangan, t.foto,
           bo.nomor_booking, bo.asal, bo.tujuan, bo.jenis_kontainer,
           p.nama_perusahaan as nama_pelanggan,
           d.nama_lengkap as nama_driver, a.nomor_polisi
    FROM tracking t
    JOIN penugasan pn ON t.penugasan_id = pn.id
    JOIN booking_order bo ON pn.booking_order_id = bo.id
    JOIN driver d ON pn.driver_id = d.id
    JOIN armada a ON pn.armada_id = a.id
    JOIN pelanggan p ON bo.pelanggan_id = p.id
    WHERE t.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

ipcMain.handle('add-tracking', async (event, data) => {
  const { penugasan_id, status, lokasi, keterangan, foto, diperbarui_oleh } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO tracking (
              penugasan_id, status, lokasi, keterangan, foto, diperbarui_oleh
            ) VALUES (?, ?, ?, ?, ?, ?)`, 
      [penugasan_id, status, lokasi, keterangan, foto, diperbarui_oleh],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('saveTracking', async (event, data) => {
  const { penugasan_id, status, lokasi, keterangan, foto } = data;
  const userId = event.sender.userId || 1; // Default to 1 if not set
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO tracking (
              penugasan_id, status, lokasi, keterangan, foto, diperbarui_oleh
            ) VALUES (?, ?, ?, ?, ?, ?)`,
      [penugasan_id, status, lokasi, keterangan, foto, userId],
      function(err) {
        if (err) reject(err);
        else {
          // Update penugasan status
          db.run('UPDATE penugasan SET status = ? WHERE id = ?', 
            [status, penugasan_id],
            function(err) {
              if (err) reject(err);
              else {
                // If status is 'selesai', update booking status too
                if (status === 'selesai') {
                  db.run(`UPDATE booking_order SET status = 'selesai' 
                          WHERE id IN (SELECT booking_order_id FROM penugasan WHERE id = ?)`,
                    [penugasan_id],
                    function(err) {
                      if (err) reject(err);
                      else resolve({ id: this.lastID });
                    }
                  );
                } else {
                  // Update booking status to match tracking status
                  db.run(`UPDATE booking_order SET status = ? 
                          WHERE id IN (SELECT booking_order_id FROM penugasan WHERE id = ?)`,
                    [status, penugasan_id],
                    function(err) {
                      if (err) reject(err);
                      else resolve({ id: this.lastID });
                    }
                  );
                }
              }
            }
          );
        }
      }
    );
  });
});

// Invoice
ipcMain.handle('get-invoices', async (event, filter) => {
  let sql = 'SELECT * FROM invoice i JOIN pelanggan p ON i.pelanggan_id = p.id';
  const params = [];
  
  if (filter) {
    const whereClauses = [];
    
    if (filter.status) {
      whereClauses.push('i.status_pembayaran = ?');
      params.push(filter.status);
    }
    
    if (filter.startDate && filter.endDate) {
      whereClauses.push('i.tanggal_invoice BETWEEN ? AND ?');
      params.push(filter.startDate, filter.endDate);
    }
    
    if (filter.pelangganId) {
      whereClauses.push('i.pelanggan_id = ?');
      params.push(filter.pelangganId);
    }
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
  }
  
  sql += ' ORDER BY i.tanggal_invoice DESC';
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-invoice-detail', async (event, id) => {
  return new Promise((resolve, reject) => {
    // Get invoice header
    db.get('SELECT * FROM invoice WHERE id = ?', [id], (err, invoice) => {
      if (err) {
        reject(err);
      } else if (!invoice) {
        reject(new Error('Invoice tidak ditemukan'));
      } else {
        // Get invoice details
        db.all(`SELECT di.*, bo.nomor_booking, bo.asal, bo.tujuan, bo.jenis_kontainer, 
                bo.tanggal_pickup, bo.tanggal_delivery 
                FROM detail_invoice di 
                JOIN booking_order bo ON di.booking_order_id = bo.id 
                WHERE di.invoice_id = ?`, 
          [id], 
          (err, details) => {
            if (err) {
              reject(err);
            } else {
              // Get customer info
              db.get('SELECT * FROM pelanggan WHERE id = ?', [invoice.pelanggan_id], (err, pelanggan) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    invoice,
                    details,
                    pelanggan
                  });
                }
              });
            }
          }
        );
      }
    });
  });
});

ipcMain.handle('generate-invoice-number', async () => {
  const today = new Date();
  const year = today.getFullYear().toString().substr(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `INV${year}${month}`;
  
  return new Promise((resolve, reject) => {
    db.get('SELECT MAX(nomor_invoice) as max_number FROM invoice WHERE nomor_invoice LIKE ?', 
      [`${prefix}%`], 
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          let nextNumber = 1;
          if (result.max_number) {
            const currentNumber = parseInt(result.max_number.substr(-4));
            nextNumber = currentNumber + 1;
          }
          resolve(`${prefix}${nextNumber.toString().padStart(4, '0')}`);
        }
      }
    );
  });
});

ipcMain.handle('get-uninvoiced-bookings', async (event, pelangganId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT bo.* FROM booking_order bo
            LEFT JOIN detail_invoice di ON bo.id = di.booking_order_id
            WHERE bo.pelanggan_id = ? AND bo.status = 'selesai' AND di.id IS NULL`, 
      [pelangganId], 
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle('add-invoice', async (event, data) => {
  const { nomor_invoice, tanggal_invoice, pelanggan_id, total_tagihan, 
          ppn, grand_total, tanggal_jatuh_tempo, catatan, dibuat_oleh, details } = data;
  
  return new Promise((resolve, reject) => {
    // Begin transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Insert invoice header
      db.run(`INSERT INTO invoice (
                nomor_invoice, tanggal_invoice, pelanggan_id, total_tagihan, ppn, 
                grand_total, tanggal_jatuh_tempo, catatan, dibuat_oleh
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [nomor_invoice, tanggal_invoice, pelanggan_id, total_tagihan, ppn, 
         grand_total, tanggal_jatuh_tempo, catatan, dibuat_oleh],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const invoiceId = this.lastID;
          let completed = 0;
          let hasError = false;
          
          // Insert invoice details
          details.forEach((detail) => {
            db.run(`INSERT INTO detail_invoice (
                      invoice_id, booking_order_id, deskripsi, jumlah
                    ) VALUES (?, ?, ?, ?)`, 
              [invoiceId, detail.booking_order_id, detail.deskripsi, detail.jumlah],
              (err) => {
                if (err && !hasError) {
                  hasError = true;
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                
                completed++;
                if (completed === details.length && !hasError) {
                  db.run('COMMIT', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                    } else {
                      resolve({ id: invoiceId });
                    }
                  });
                }
              }
            );
          });
        }
      );
    });
  });
});

ipcMain.handle('update-invoice-status', async (event, data) => {
  const { id, status_pembayaran, tanggal_pembayaran, metode_pembayaran } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE invoice SET 
              status_pembayaran = ?, tanggal_pembayaran = ?, metode_pembayaran = ?
            WHERE id = ?`, 
      [status_pembayaran, tanggal_pembayaran, metode_pembayaran, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Biaya Operasional
ipcMain.handle('get-biaya-operasional', async (event, filter) => {
  let sql = 'SELECT * FROM biaya_operasional';
  const params = [];
  
  if (filter) {
    const whereClauses = [];
    
    if (filter.penugasanId) {
      whereClauses.push('penugasan_id = ?');
      params.push(filter.penugasanId);
    }
    
    if (filter.status) {
      whereClauses.push('status = ?');
      params.push(filter.status);
    }
    
    if (filter.startDate && filter.endDate) {
      whereClauses.push('tanggal BETWEEN ? AND ?');
      params.push(filter.startDate, filter.endDate);
    }
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
  }
  
  sql += ' ORDER BY tanggal DESC';
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-biaya-operasional', async (event, data) => {
  const { penugasan_id, jenis_biaya, jumlah, tanggal, keterangan, bukti_transaksi, dibuat_oleh } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO biaya_operasional (
              penugasan_id, jenis_biaya, jumlah, tanggal, keterangan, bukti_transaksi, dibuat_oleh
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [penugasan_id, jenis_biaya, jumlah, tanggal, keterangan, bukti_transaksi, dibuat_oleh],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('update-biaya-status', async (event, data) => {
  const { id, status, disetujui_oleh } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE biaya_operasional SET 
              status = ?, disetujui_oleh = ?, disetujui_pada = CURRENT_TIMESTAMP
            WHERE id = ?`, 
      [status, disetujui_oleh, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Laporan dan Dashboard
ipcMain.handle('get-dashboard-summary', async () => {
  return new Promise((resolve, reject) => {
    const result = {};
    
    // Total Booking Bulan Ini
    db.get(`SELECT COUNT(*) as total FROM booking_order 
            WHERE strftime('%Y-%m', tanggal_booking) = strftime('%Y-%m', 'now')`, 
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        result.totalBookingBulanIni = row.total;
        
        // Total Pendapatan Bulan Ini
        db.get(`SELECT SUM(grand_total) as total FROM invoice 
                WHERE strftime('%Y-%m', tanggal_invoice) = strftime('%Y-%m', 'now')`, 
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            result.totalPendapatanBulanIni = row.total || 0;
            
            // Total Biaya Operasional Bulan Ini
            db.get(`SELECT SUM(jumlah) as total FROM biaya_operasional 
                    WHERE strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now')
                    AND status = 'disetujui'`, 
              (err, row) => {
                if (err) {
                  reject(err);
                  return;
                }
                result.totalBiayaBulanIni = row.total || 0;
                result.profitBulanIni = result.totalPendapatanBulanIni - result.totalBiayaBulanIni;
                
                // Status Booking
                db.all(`SELECT status, COUNT(*) as jumlah FROM booking_order
                        GROUP BY status`,
                  (err, rows) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    result.statusBooking = rows;
                    
                    // Invoice Belum Dibayar
                    db.get(`SELECT COUNT(*) as total, SUM(grand_total) as jumlah
                            FROM invoice WHERE status_pembayaran = 'belum dibayar'`,
                      (err, row) => {
                        if (err) {
                          reject(err);
                          return;
                        }
                        result.invoiceBelumDibayar = row;
                        
                        // Jumlah Driver & Armada Aktif
                        db.get(`SELECT 
                                (SELECT COUNT(*) FROM driver WHERE status = 'aktif') as totalDriver,
                                (SELECT COUNT(*) FROM armada WHERE status = 'aktif') as totalArmada`,
                          (err, row) => {
                            if (err) {
                              reject(err);
                              return;
                            }
                            result.totalDriver = row.totalDriver;
                            result.totalArmada = row.totalArmada;
                            
                            resolve(result);
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

ipcMain.handle('get-laporan-pendapatan', async (event, params) => {
  const { startDate, endDate, groupBy } = params;
  let sql = '';
  
  if (groupBy === 'daily') {
    sql = `SELECT strftime('%Y-%m-%d', tanggal_invoice) as tanggal, SUM(grand_total) as total
           FROM invoice
           WHERE tanggal_invoice BETWEEN ? AND ?
           GROUP BY strftime('%Y-%m-%d', tanggal_invoice)
           ORDER BY tanggal`;
  } else if (groupBy === 'monthly') {
    sql = `SELECT strftime('%Y-%m', tanggal_invoice) as bulan, SUM(grand_total) as total
           FROM invoice
           WHERE tanggal_invoice BETWEEN ? AND ?
           GROUP BY strftime('%Y-%m', tanggal_invoice)
           ORDER BY bulan`;
  } else { // yearly
    sql = `SELECT strftime('%Y', tanggal_invoice) as tahun, SUM(grand_total) as total
           FROM invoice
           WHERE tanggal_invoice BETWEEN ? AND ?
           GROUP BY strftime('%Y', tanggal_invoice)
           ORDER BY tahun`;
  }
  
  return new Promise((resolve, reject) => {
    db.all(sql, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-laporan-biaya', async (event, params) => {
  const { startDate, endDate, groupBy } = params;
  let sql = '';
  
  if (groupBy === 'kategori') {
    sql = `SELECT jb.kategori, SUM(bo.jumlah) as total
           FROM biaya_operasional bo
           JOIN jenis_biaya jb ON bo.jenis_biaya = jb.nama
           WHERE bo.tanggal BETWEEN ? AND ? AND bo.status = 'disetujui'
           GROUP BY jb.kategori
           ORDER BY total DESC`;
  } else if (groupBy === 'jenisbiaya') {
    sql = `SELECT bo.jenis_biaya, SUM(bo.jumlah) as total
           FROM biaya_operasional bo
           WHERE bo.tanggal BETWEEN ? AND ? AND bo.status = 'disetujui'
           GROUP BY bo.jenis_biaya
           ORDER BY total DESC`;
  } else if (groupBy === 'daily') {
    sql = `SELECT strftime('%Y-%m-%d', tanggal) as tanggal, SUM(jumlah) as total
           FROM biaya_operasional
           WHERE tanggal BETWEEN ? AND ? AND status = 'disetujui'
           GROUP BY strftime('%Y-%m-%d', tanggal)
           ORDER BY tanggal`;
  } else if (groupBy === 'monthly') {
    sql = `SELECT strftime('%Y-%m', tanggal) as bulan, SUM(jumlah) as total
           FROM biaya_operasional
           WHERE tanggal BETWEEN ? AND ? AND status = 'disetujui'
           GROUP BY strftime('%Y-%m', tanggal)
           ORDER BY bulan`;
  } else { // yearly
    sql = `SELECT strftime('%Y', tanggal) as tahun, SUM(jumlah) as total
           FROM biaya_operasional
           WHERE tanggal BETWEEN ? AND ? AND status = 'disetujui'
           GROUP BY strftime('%Y', tanggal)
           ORDER BY tahun`;
  }
  
  return new Promise((resolve, reject) => {
    db.all(sql, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-laporan-profit', async (event, params) => {
  const { startDate, endDate } = params;
  
  const sql = `SELECT bo.id as booking_id, bo.nomor_booking, p.nama_perusahaan,
              jl.nama_layanan, bo.asal, bo.tujuan, bo.jenis_kontainer,
              di.jumlah as pendapatan, 
              COALESCE((SELECT SUM(jumlah) FROM biaya_operasional WHERE penugasan_id IN 
                        (SELECT id FROM penugasan WHERE booking_order_id = bo.id) AND status = 'disetujui'), 0) as biaya,
              (di.jumlah - COALESCE((SELECT SUM(jumlah) FROM biaya_operasional WHERE penugasan_id IN 
                                   (SELECT id FROM penugasan WHERE booking_order_id = bo.id) AND status = 'disetujui'), 0)) as profit,
              CASE 
                WHEN di.jumlah = 0 THEN 0
                ELSE ROUND(((di.jumlah - COALESCE((SELECT SUM(jumlah) FROM biaya_operasional WHERE penugasan_id IN 
                                                 (SELECT id FROM penugasan WHERE booking_order_id = bo.id) AND status = 'disetujui'), 0)) / di.jumlah) * 100, 2)
              END as margin_profit_persen
              FROM booking_order bo
              JOIN pelanggan p ON bo.pelanggan_id = p.id
              JOIN jenis_layanan jl ON bo.jenis_layanan_id = jl.id
              JOIN detail_invoice di ON bo.id = di.booking_order_id
              JOIN invoice i ON di.invoice_id = i.id
              WHERE i.tanggal_invoice BETWEEN ? AND ?
              ORDER BY profit DESC`;
  
  return new Promise((resolve, reject) => {
    db.all(sql, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('get-performa-driver', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM vw_performa_driver ORDER BY persentase_penyelesaian DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// File operations
ipcMain.handle('save-file', async (event, data) => {
  const { filePath, content } = data;
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err) => {
      if (err) reject(err);
      else resolve({ success: true });
    });
  });
});

ipcMain.handle('open-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('open-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});
function createDatabase() {
  // Lokasi database
  const dbPath = path.join(app.getPath('userData'), 'trucking_db.sqlite');
  
  // Cek apakah database sudah ada
  const dbExists = fs.existsSync(dbPath);
  
  // Buka koneksi ke database
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Gagal membuka database:', err.message);
    } else {
      console.log('Berhasil terhubung ke database SQLite');
      
      // Jika database baru, inisialisasi dengan skema
      if (!dbExists) {
        console.log('Membuat database baru...');
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Eksekusi skema SQL
        db.exec(schemaSQL, (err) => {
          if (err) {
            console.error('Gagal menginisialisasi database:', err.message);
          } else {
            console.log('Database berhasil diinisialisasi');
          }
        });
      }
    }
  });
}

// Buat window utama aplikasi
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png')
  });

  // Load halaman login
  mainWindow.loadFile(path.join(__dirname, 'pages', 'login.html'));
  
  // Buka DevTools saat development (uncomment jika diperlukan)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Tutup koneksi database saat aplikasi akan berhenti
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Gagal menutup database:', err.message);
      } else {
        console.log('Koneksi database ditutup');
      }
    });
  }
});

// ========== API untuk komunikasi dengan renderer process ==========

// Authentication
ipcMain.handle('login', async (event, credentials) => {
  const { username, password } = credentials;
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ? AND status = "aktif"', [username], (err, user) => {
      if (err) {
        reject({ success: false, message: 'Terjadi kesalahan pada database' });
      } else if (!user) {
        reject({ success: false, message: 'Username tidak ditemukan' });
      } else {
        // Verifikasi password dengan bcrypt
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            reject({ success: false, message: 'Gagal memverifikasi password' });
          } else if (!isMatch) {
            reject({ success: false, message: 'Password salah' });
          } else {
            // Update terakhir login
            db.run('UPDATE users SET terakhir_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            // Catat aktivitas login
            db.run('INSERT INTO log_aktivitas (user_id, aktivitas, detail) VALUES (?, ?, ?)', 
              [user.id, 'login', 'Login berhasil']);
            
            // Kembalikan data user tanpa password
            const { password, ...userWithoutPassword } = user;
            resolve({ success: true, user: userWithoutPassword });
          }
        });
      }
    });
  });
});

// Data Pelanggan
ipcMain.handle('get-pelanggan', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM pelanggan ORDER BY nama_perusahaan', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-pelanggan', async (event, data) => {
  const { kode_pelanggan, nama_perusahaan, alamat, kota, provinsi, kode_pos, npwp, 
          nama_kontak, jabatan_kontak, email, no_telepon, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO pelanggan (
              kode_pelanggan, nama_perusahaan, alamat, kota, provinsi, kode_pos, npwp, 
              nama_kontak, jabatan_kontak, email, no_telepon, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [kode_pelanggan, nama_perusahaan, alamat, kota, provinsi, kode_pos, npwp, 
       nama_kontak, jabatan_kontak, email, no_telepon, catatan],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('update-pelanggan', async (event, data) => {
  const { id, kode_pelanggan, nama_perusahaan, alamat, kota, provinsi, kode_pos, npwp, 
          nama_kontak, jabatan_kontak, email, no_telepon, status, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE pelanggan SET 
              kode_pelanggan = ?, nama_perusahaan = ?, alamat = ?, kota = ?, 
              provinsi = ?, kode_pos = ?, npwp = ?, nama_kontak = ?, 
              jabatan_kontak = ?, email = ?, no_telepon = ?, status = ?, catatan = ?
            WHERE id = ?`, 
      [kode_pelanggan, nama_perusahaan, alamat, kota, provinsi, kode_pos, npwp, 
       nama_kontak, jabatan_kontak, email, no_telepon, status, catatan, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Data Driver
ipcMain.handle('get-driver', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM driver ORDER BY nama_lengkap', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-driver', async (event, data) => {
  const { kode_driver, nama_lengkap, alamat, no_ktp, no_sim, tipe_sim, 
          tanggal_lahir, no_telepon, tanggal_bergabung, foto, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO driver (
              kode_driver, nama_lengkap, alamat, no_ktp, no_sim, tipe_sim, 
              tanggal_lahir, no_telepon, tanggal_bergabung, foto, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [kode_driver, nama_lengkap, alamat, no_ktp, no_sim, tipe_sim, 
       tanggal_lahir, no_telepon, tanggal_bergabung, foto, catatan],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});

ipcMain.handle('update-driver', async (event, data) => {
  const { id, kode_driver, nama_lengkap, alamat, no_ktp, no_sim, tipe_sim, 
          tanggal_lahir, no_telepon, tanggal_bergabung, status, foto, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE driver SET 
              kode_driver = ?, nama_lengkap = ?, alamat = ?, no_ktp = ?, 
              no_sim = ?, tipe_sim = ?, tanggal_lahir = ?, no_telepon = ?, 
              tanggal_bergabung = ?, status = ?, foto = ?, catatan = ?
            WHERE id = ?`, 
      [kode_driver, nama_lengkap, alamat, no_ktp, no_sim, tipe_sim, 
       tanggal_lahir, no_telepon, tanggal_bergabung, status, foto, catatan, id],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
});

// Data Armada
ipcMain.handle('get-armada', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM armada ORDER BY kode_armada', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-armada', async (event, data) => {
  const { kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
          kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO armada (
              kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
              kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
       kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}); // Close the ipcMain.handle() promise
ipcMain.handle('add-armada', async (event, data) => {
  const { kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
          kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO armada (
              kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
              kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
       kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
});
ipcMain.handle('add-armada', async (event, data) => {
  const { kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
          kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan } = data;
  
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO armada (
              kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
              kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [kode_armada, nomor_polisi, jenis_kendaraan, merk, model, tahun_pembuatan, 
       kapasitas, tanggal_registrasi, terakhir_service, jadwal_service, catatan],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}); // Fixed missing closing brace
}); // Close the ipcMain.handle() promise for add-armada

