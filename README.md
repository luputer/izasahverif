# IjazahVerify 🎓

IjazahVerify adalah platform verifikasi ijazah berbasis blockchain yang berjalan di jaringan **Stellar (Soroban Testnet)**. Sistem ini memungkinkan institusi untuk menerbitkan ijazah secara on-chain, memberikan keamanan dan transparansi penuh terhadap keaslian dokumen pendidikan.

## 🚀 Fitur Utama

- **Verifikasi Ijazah**: Siapa pun dapat memverifikasi keaslian ijazah menggunakan ID sertifikat.
- **Penerbitan Ijazah**: Institusi terdaftar dapat menerbitkan ijazah baru ke wallet penerima.
- **Pencabutan Ijazah**: Institusi dapat menarik kembali ijazah jika terjadi kesalahan atau pembatalan.
- **Manajemen Institusi**: Admin sistem dapat mendaftarkan alamat wallet sebagai institusi resmi.

## 📁 Struktur Proyek

```text
submition/
├── contracts/
│   ├── ijazah-verify/     # Source code Smart Contract (Rust/Soroban)
│   └── deploy.sh          # Script deployment otomatis
├── frontend-rush/         # Web dashboard (React + TS + Vite)
│   └── .env               # Konfigurasi RPC dan Contract ID
└── README.md              # Dokumentasi ini
```

## 🛠 Panduan Instalasi & Deployment

### 1. Prasyarat
- [Rust](https://www.rust-lang.org/) & [Soroban SDK](https://soroban.stellar.org/docs/getting-started/setup)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Node.js](https://nodejs.org/) & [Bun](https://bun.sh/) (atau npm)
- [Freighter Wallet](https://www.freighter.app/) Browser Extension

### 2. Deploy Smart Contract
Pastikan kamu sudah memiliki identity `alice` di Stellar CLI (`stellar keys add alice`).

```bash
cd submition/contracts
bash deploy.sh
```
*Script ini akan mem-build, mengoptimasi, men-deploy, dan memperbarui file `.env` di frontend secara otomatis.*

### 3. Menjalankan Frontend
```bash
cd submition/frontend-rush
bun install
bun run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

## 📖 Cara Penggunaan

1. **Hubungkan Wallet**: Klik tombol "Hubungkan Wallet" menggunakan Freighter.
2. **Setup Institusi**: (Hanya Admin) Gunakan `deploy.sh` atau panggil fungsi `register_institution` agar alamat kamu dikenal sebagai institusi.
3. **Terbitkan Ijazah**: Masuk ke tab "Terbitkan", masukkan detail penerima, dan tanda tangani transaksi.
4. **Cek Ijazah Saya**: Pemilik wallet dapat melihat daftar ijazah yang mereka miliki di tab "Ijazah Saya".
5. **Verifikasi Publik**: Masukkan ID sertifikat di halaman utama untuk mengecek keaslian ijazah tanpa perlu login.

---
Dikembangkan untuk **Stellar Workshop**.
