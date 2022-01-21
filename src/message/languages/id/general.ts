export default {
  create: {
    success: {
      code: 'INSERT_DATA_SUCCESS',
      message: 'Tambah data sukses.',
    },
    fail: {
      code: 'INSERT_DATA_FAIL',
      message: 'Tambah data gagal.',
    },
  },
  update: {
    success: {
      code: 'UPDATE_DATA_SUCCESS',
      message: 'Ubah data sukses.',
    },
    fail: {
      code: 'UPDATE_DATA_FAIL',
      message: 'Ubah data gagal.',
    },
  },
  list: {
    success: {
      code: 'LIST_DATA_SUCCESS',
      message: 'Sukses mengambil data',
    },
    fail: {
      code: 'LIST_DATA_FAIL',
      message: 'Gagal mengambil data',
    },
  },
  delete: {
    success: {
      code: 'DELETE_DATA_SUCCESS',
      message: 'Sukses menghapus data.',
    },
    fail: {
      code: 'DELETE_DATA_FAIL',
      message: 'Gagal menghapus data.',
    },
  },
  get: {
    success: {
      code: 'GET_DATA_SUCCESS',
      message: 'Mengambil data sukses.',
    },
    fail: {
      code: 'GET_DATA_FAIL',
      message: 'Gagal mengambil data.',
    },
  },
  general: {
    success: {
      code: 'SUCCESS',
      message: 'Sukses',
    },
    dataSuccess: {
      code: 'GET_DATA_SUCCESS',
      message: 'Mengambil data sukses.',
    },
    fail: {
      code: 'FAIL',
      message: 'Gagal',
    },
    dataNotFound: {
      code: 'DATA_NOT_FOUND',
      message: 'Data tidak ditemukan.',
    },
    dataInvalid: {
      code: 'DATA_INVALID',
      message: 'Data tidak valid.',
    },
    dataIsEmpty: {
      code: 'DATA_IS_EMPTY',
      message: 'Data tidak boleh kosong.',
    },
    dataNotAllowed: {
      code: 'DATA_NOT_ALLOWED',
      message: 'Tidak dapat mengakses data ini.',
    },
    invalidUserAccess: {
      code: 'UNAUTHORIZED USER',
      message: 'User tidak mendapatkan akses.',
    },
    statusNotAllowed: {
      code: 'STATUS_NOT_ALLOWED',
      message: 'Tidak dapat mengupdate data pada status ini.',
    },
    invalidStartEndDate: {
      code: 'INVALID_START_END_DATE',
      message: 'Tanggal mulai harus lebih kecil dari tanggal selesai.',
    },
    invalidGreaterDate: {
      code: 'INVALID_GREATER_DATE',
      message: 'Tanggal harus lebih besar dari sekarang.',
    },
  },
  delivery: {
    outOfRange: {
      code: 'FAIL_OUT_OF_RANGE',
      message: 'Kurir dengan target pengiriman tidak dapat ditemukan.',
    },
  },
  order: {
    createFailAddressNotComplete: {
      code: 'ADDRESS_NOT_COMPLETE',
      message: 'Alamat tidak lengkap.',
    },
    statusNotAllowed: {
      code: 'STATUS_NOT_ALLOWED',
      message: 'Tidak dapat mengupdate order pada status ini.',
    },
    cartEmpty: {
      code: 'CART_IS_EMPTY',
      message: 'Keranjang kosong.',
    },
    paymentFail: {
      code: 'PAYMENT_FAIL',
      message: 'Tidak dapat membuat pembayaran / pembayaran gagal.',
    },
    pickupInvalid: {
      code: 'PICKUP_INVALID',
      message: 'Waktu pengambilan tidak valid / store tutup.',
    },
    platformInvalid: {
      code: 'PLATFORM_INVALID',
      message: 'Platform / jenis order tidak sesuai.',
    },
    orderCancelOutOfTime: {
      code: 'CANCEL_OUT_OF_TIME',
      message: 'Tidak dapat membatalkan order diluar batas waktu pembatalan.',
    },
    getTargetFail: {
      code: 'GET_DATA_TARGET_FAILED',
      message: 'Tidak dapat mengambil data.',
    },
  },
  merchant: {
    storeClosed: {
      code: 'STORE_IS_CLOSED',
      message: 'Toko sedang tutup.',
    },
  },
  redis: {
    createQueueFail: {
      code: 'CREATE_QUEUE_FAIL',
      message: 'Tidak dapat membuat queue',
    },
    deleteQueueFail: {
      code: 'DELETE_QUEUE_FAIL',
      message: 'Tidak dapat menghapus queue',
    },
  },
  pos: {
    cashierShiftBackdate: {
      code: 'CASHIER_SHIFT_BACKDATE',
      message: 'Shift kasir backdate.',
    },
    cashierShiftOverlap: {
      code: 'CASHIER_SHIFT_OVERLAP',
      message: 'Shift kasir overlap.',
    },
    cashierInCheckIn: {
      code: 'CASHIER_IN_CHECKIN',
      message: 'Kasir sudah check in.',
    },
    cashierInCheckOut: {
      code: 'CASHIER_IN_CHECKOUT',
      message: 'Kasir sudah check out.',
    },
    shiftActive: {
      code: 'SHIFT_ACTIVE',
      message: 'Shift kasir sedang aktif.',
    },
    shiftInUse: {
      code: 'SHIFT_IN_USE',
      message: 'Kasir sedang check in.',
    },
    dateOvertime: {
      code: 'DATE_OVERTIME',
      message: 'Tanggal penugasan melewati 7 hari.',
    },
    dateDifferent: {
      code: 'DATE_DIFFERENT',
      message: 'Tanggal mulai dan tanggal selesai tidak sama.',
    },
  },
  promoProvider: {
    errorBackDate: {
      code: 'BACKDATE',
      message: 'Tanggal Promo backdate.',
    },
    errorOverlap: {
      code: 'DATE_OVERLAP',
      message: 'Tanggal Promo overlap.',
    },
    errorInPast: {
      code: 'PROMO_IN_PAST',
      message: 'Tidak bisa memasukan promo dengan periode yang sudah terlewat.',
    },
    errorDiscountMaximum: {
      code: 'DISCOUNT_MAXIMUM_REQUIRED',
      message: 'Harus menambahkan maksimum discount untuk jenis promo ini.',
    },
  },
  promoBrand: {
    errorBackDate: {
      code: 'BACKDATE',
      message: 'Tanggal Promo backdate.',
    },
    errorOverlap: {
      code: 'DATE_OVERLAP',
      message: 'Tanggal Promo overlap.',
    },
    errorInPast: {
      code: 'PROMO_IN_PAST',
      message: 'Tidak bisa memasukan promo dengan periode yang sudah terlewat.',
    },
    errorDiscountMaximum: {
      code: 'DISCOUNT_MAXIMUM_REQUIRED',
      message: 'Harus menambahkan maksimum discount untuk jenis promo ini.',
    },
  },
  voucher: {
    redeemUsed: {
      code: 'VOUCHER_USED',
      message: 'Voucher sudah di-redeem.',
    },
    quotaReached: {
      code: 'QUOTA_REACHED',
      message: 'Kuota voucher telah habis.',
    },
    notAvailable: {
      code: 'VOUCHER_NOT_AVAILABLE',
      message: 'Voucher tidak tersedia',
    },
  },
};
