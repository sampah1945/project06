const { contextBridge, ipcRenderer } = require('electron');

// Ekspos API ke renderer process
contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  
  // Data Pelanggan
  getPelanggan: () => ipcRenderer.invoke('get-pelanggan'),
  addPelanggan: (data) => ipcRenderer.invoke('add-pelanggan', data),
  updatePelanggan: (data) => ipcRenderer.invoke('update-pelanggan', data),
  
  // Data Driver
  getDriver: () => ipcRenderer.invoke('get-driver'),
  addDriver: (data) => ipcRenderer.invoke('add-driver', data),
  updateDriver: (data) => ipcRenderer.invoke('update-driver', data),
  
  // Data Armada
  getArmada: () => ipcRenderer.invoke('get-armada'),
  addArmada: (data) => ipcRenderer.invoke('add-armada', data),
  updateArmada: (data) => ipcRenderer.invoke('update-armada', data),
  
  // Booking Order
  getBookingOrders: (filter) => ipcRenderer.invoke('get-booking-orders', filter),
  getBookingDetail: (id) => ipcRenderer.invoke('get-booking-detail', id),
  generateBookingNumber: () => ipcRenderer.invoke('generate-booking-number'),
  addBooking: (data) => ipcRenderer.invoke('add-booking', data),
  updateBooking: (data) => ipcRenderer.invoke('update-booking', data),
  
  // Penugasan
  getAvailableDrivers: () => ipcRenderer.invoke('get-available-drivers'),
  getAvailableArmada: () => ipcRenderer.invoke('get-available-armada'),
  addPenugasan: (data) => ipcRenderer.invoke('add-penugasan', data),
  
  // Tracking
  getTracking: (penugasanId) => ipcRenderer.invoke('get-tracking', penugasanId),
  addTracking: (data) => ipcRenderer.invoke('add-tracking', data),
  
  // Invoice
  getInvoices: (filter) => ipcRenderer.invoke('get-invoices', filter),
  getInvoiceDetail: (id) => ipcRenderer.invoke('get-invoice-detail', id),
  generateInvoiceNumber: () => ipcRenderer.invoke('generate-invoice-number'),
  getUninvoicedBookings: (pelangganId) => ipcRenderer.invoke('get-uninvoiced-bookings', pelangganId),
  addInvoice: (data) => ipcRenderer.invoke('add-invoice', data),
  updateInvoiceStatus: (data) => ipcRenderer.invoke('update-invoice-status', data),
  
  // Biaya Operasional
  getBiayaOperasional: (filter) => ipcRenderer.invoke('get-biaya-operasional', filter),
  addBiayaOperasional: (data) => ipcRenderer.invoke('add-biaya-operasional', data),
  updateBiayaStatus: (data) => ipcRenderer.invoke('update-biaya-status', data),
  
  // Laporan dan Dashboard
  getDashboardSummary: () => ipcRenderer.invoke('get-dashboard-summary'),
  getLaporanPendapatan: (params) => ipcRenderer.invoke('get-laporan-pendapatan', params),
  getLaporanBiaya: (params) => ipcRenderer.invoke('get-laporan-biaya', params),
  getLaporanProfit: (params) => ipcRenderer.invoke('get-laporan-profit', params),
  getPerformaDriver: () => ipcRenderer.invoke('get-performa-driver'),
  
  // File operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  openSaveDialog: (options) => ipcRenderer.invoke('open-save-dialog', options)