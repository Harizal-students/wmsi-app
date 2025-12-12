# WMSI - Website Marketing Scan Intelligence

Aplikasi analisis website menggunakan AI Vision, WebQual 4.0, dan metodologi ilmiah.

## 📋 LANGKAH-LANGKAH IMPLEMENTASI LENGKAP

---

## LANGKAH 0: Dapatkan Claude API Key

1. Buka https://console.anthropic.com
2. Login atau Sign up
3. Klik **API Keys** di menu
4. Klik **Create Key**
5. Beri nama: "WMSI-Production"
6. **COPY dan SIMPAN** API key (hanya ditampilkan sekali!)

> Info: Claude Sonnet ~$3/1M input tokens, ~$15/1M output tokens

---

## LANGKAH 1: Setup Supabase Database

1. Buka https://supabase.com/dashboard
2. Buka project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste isi file `supabase-schema.sql`
6. Klik **Run**
7. Verifikasi di **Table Editor** - pastikan `analysis_sessions` ada

---

## LANGKAH 2: Setup Project di VS Code

```bash
# 1. Buat folder project
mkdir wmsi-app
cd wmsi-app

# 2. Copy semua file dari folder wmsi-nextjs ke sini

# 3. Buat .env.local (copy dari env.local.example)
cp env.local.example .env.local

# 4. Edit .env.local - masukkan Claude API Key Anda:
# CLAUDE_API_KEY=sk-ant-api03-your-key-here

# 5. Install dependencies
npm install

# 6. Run development
npm run dev

# 7. Buka http://localhost:3000
```

---

## LANGKAH 3: Setup GitHub Repository

```bash
# 1. Buat repo baru di GitHub (https://github.com/new)
# Nama: wmsi-app, Private

# 2. Di folder project:
git init
git add .
git commit -m "Initial commit - WMSI v6"
git branch -M main
git remote add origin https://github.com/USERNAME/wmsi-app.git
git push -u origin main
```

---

## LANGKAH 4: Deploy ke Vercel

1. Buka https://vercel.com - Login dengan GitHub
2. Klik **Add New** → **Project**
3. Pilih repository `wmsi-app` → **Import**
4. **PENTING** - Tambah Environment Variables:
   - `CLAUDE_API_KEY` = your-claude-api-key
   - `NEXT_PUBLIC_SUPABASE_URL` = https://wiyvnncjntaoqpimmxlm.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sb_publishable_1ZO5wqyHFyMleXWtUScfUQ_xv8KDP5f
   - `SUPABASE_SERVICE_ROLE_KEY` = sb_secret_leAkFylZmWPoE2bTzo6JZw_gMaZA4KL
5. Klik **Deploy**
6. Tunggu ~2-3 menit
7. Website live di: `https://wmsi-app.vercel.app`

---

## 📁 Struktur Project

```
wmsi-app/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts  # API untuk Claude
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── WMSI.tsx              # Komponen utama
│   └── lib/
│       └── supabase.ts           # Supabase client
├── .env.local                    # JANGAN commit!
├── supabase-schema.sql           # SQL untuk database
└── package.json
```

---

## 🔧 Troubleshooting

| Error | Solusi |
|-------|--------|
| "Claude API key not configured" | Set CLAUDE_API_KEY di .env.local dan Vercel |
| "Supabase insert failed" | Jalankan supabase-schema.sql |
| Build Error | Cek semua env vars di Vercel |
| Blank Screen | Buka Console (F12) untuk lihat error |

---

## 🔒 Security

- JANGAN commit .env.local ke GitHub
- JANGAN expose SUPABASE_SERVICE_ROLE_KEY ke client
- Gunakan env vars di Vercel untuk production

---

## 📊 Monitor Data di Supabase

```sql
-- Statistik
SELECT * FROM analysis_statistics;

-- 10 analisis terakhir
SELECT url, domain, webqual_score, created_at 
FROM analysis_sessions 
ORDER BY created_at DESC LIMIT 10;
```
