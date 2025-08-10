# Test Programmer Fullstack - Inventory Management API

## Deskripsi

Sistem manajemen inventory dengan REST API menggunakan Node.js (tanpa framework) dan MySQL. Sistem ini dapat mengelola produk, kategori, transaksi, supplier, dan pelanggan.

## Prerequisites

- Node.js (v14 atau lebih tinggi)
- MySQL Server
- npm atau yarn

## Instalasi

1. Clone repository dan masuk ke direktori backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Setup database:

- Pastikan MySQL server berjalan
- Import file `database.sql` ke MySQL server Anda
- Update konfigurasi database di `server.js` sesuai dengan setup MySQL Anda

4. Jalankan aplikasi:

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### 1. Products

#### GET /products

Mendapatkan daftar semua produk dengan pagination.

**Query Parameters:**

- `page` (optional): Halaman (default: 1)
- `category` (optional): Filter berdasarkan kategori

**Contoh Request:**

```bash
# Mendapatkan semua produk
curl -X GET "http://localhost:3000/products"

# Dengan pagination
curl -X GET "http://localhost:3000/products?page=1"

# Filter berdasarkan kategori
curl -X GET "http://localhost:3000/products?category=Electronics"
```

**Contoh Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Smartphone",
      "description": "Latest model with advanced features",
      "price": 699.99,
      "stock": 50,
      "category_id": 1
    }
  ],
  "total": 6,
  "page": 1,
  "totalPages": 2
}
```

#### POST /products

Menambahkan produk baru.

**Contoh Request:**

```bash
curl -X POST "http://localhost:3000/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Mouse",
    "description": "High precision gaming mouse",
    "price": 89.99,
    "stock": 25,
    "categoryId": 1
  }'
```

**Contoh Response:**

```json
{
  "data": {
    "name": "Gaming Mouse",
    "description": "High precision gaming mouse",
    "price": 89.99,
    "stock": 25,
    "categoryId": 1
  },
  "message": "Product added successfully"
}
```

#### PUT /products/:id

Update data produk atau stock produk.

**Update Product Data:**

```bash
curl -X PUT "http://localhost:3000/products/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Smartphone",
    "price": 649.99,
    "description": "Updated description"
  }'
```

**Update Stock:**

```bash
curl -X PUT "http://localhost:3000/products/1" \
  -H "Content-Type: application/json" \
  -d '{
    "product": {
      "id": 1,
      "stock": 10
    },
    "transactionType": "purchase"
  }'
```

#### GET /products/:id/history

Mendapatkan riwayat transaksi produk tertentu.

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/products/1/history"
```

**Contoh Response:**

```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 5,
      "type": "sale",
      "user_id": 2,
      "transaction_date": "2025-08-10T10:00:00.000Z",
      "product_name": "Smartphone",
      "user_name": "Bob"
    }
  ],
  "productId": 1,
  "total": 1
}
```

### 2. Transactions

#### POST /transactions

Mencatat transaksi baru (pembelian atau penjualan).

**Contoh Request - Penjualan:**

```bash
curl -X POST "http://localhost:3000/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "productId": 1,
      "quantity": 5,
      "type": "sale",
      "userId": 2
    }
  }'
```

**Contoh Request - Pembelian:**

```bash
curl -X POST "http://localhost:3000/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "productId": 1,
      "quantity": 20,
      "type": "purchase",
      "userId": 1
    }
  }'
```

**Contoh Response:**

```json
{
  "data": {
    "productId": 1,
    "quantity": 5,
    "type": "sale",
    "userId": 2
  },
  "message": "Transaction created successfully"
}
```

### 3. Reports

#### GET /reports/inventory

Mendapatkan nilai total inventory.

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/reports/inventory"
```

**Contoh Response:**

```json
{
  "data": {
    "totalValue": 45749.25,
    "currency": "USD"
  },
  "message": "Inventory value calculated successfully"
}
```

#### GET /reports/low-stock

Mendapatkan daftar produk dengan stok rendah.

**Query Parameters:**

- `threshold` (optional): Batas minimum stok (default: 10)

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/reports/low-stock?threshold=20"
```

**Contoh Response:**

```json
{
  "data": [
    {
      "id": 6,
      "name": "Action Figure",
      "description": "Collectible action figure from popular series",
      "price": 24.99,
      "stock": 5,
      "category_id": 5,
      "category_name": "Toys"
    }
  ],
  "threshold": 20,
  "total": 1
}
```

## Error Handling

API akan mengembalikan error dalam format JSON:

```json
{
  "error": "Error message description"
}
```

Status codes yang digunakan:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Database Schema

### Tables:

- `roles`: Menyimpan peran pengguna (Supplier, Customer)
- `users`: Menyimpan data pengguna dengan relasi ke roles
- `categories`: Menyimpan kategori produk
- `products`: Menyimpan data produk dengan relasi ke categories
- `transactions`: Menyimpan riwayat transaksi dengan relasi ke products dan users
