CREATE DATABASE IF NOT EXISTS inventory_management;

USE inventory_management;

DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO roles (name) VALUES
('Supplier'),
('Customer');

DROP TABLE IF EXISTS users; 

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roles_id INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (roles_id) REFERENCES roles(id)
);

INSERT INTO users (name, roles_id, phone_number, email, address) VALUES
('Alice', 1, '123-456-7890', 'alice@example.com', '123 Main St, Anytown, USA'),
('Bob', 2, '987-654-3210', 'bob@example.com', '456 Elm St, Othertown, USA');

DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO categories (name) VALUES
('Electronics'),
('Books'),
('Clothing'),
('Home Appliances'),
('Toys');

DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

delete from products;

INSERT INTO products (name, description, price, stock, category_id) VALUES
('Smartphone', 'Latest model with advanced features', 699.99, 50, 1),
('Laptop', 'High performance laptop for professionals', 1299.99, 30, 1),
('Novel', 'Bestselling fiction novel', 19.99, 100, 2),
('T-Shirt', 'Comfortable cotton t-shirt', 15.99, 200, 3),
('Blender', 'High-speed blender for smoothies', 49.99, 75, 4),
('Action Figure', 'Collectible action figure from popular series', 24.99, 5, 5);

DROP TABLE IF EXISTS transactions;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    type ENUM('purchase', 'sale') NOT NULL,
    user_id INT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

delete from transactions;