const mysql = require('mysql2/promise');

class InventoryManager {
  constructor(config) {
    this.pool = mysql.createPool(config);
  }

  /**
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  async getProducts(page = 1, limit = 5) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM products LIMIT ?, ?',
        [(page - 1) * limit, limit]
      );

      const [[{ total }]] = await connection.query(
        'SELECT COUNT(*) AS total FROM products'
      );

      return {
        data: rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {Object} product
   * @param {string} product.name
   * @param {string} product.description
   * @param {number} product.price
   * @param {number} product.stock
   * @param {number} product.categoryId
   * @returns {Promise<Object>}
   */
  async addProduct(product) {
    const { name, description, price, stock, categoryId } = product;

    if (!name) {
      throw new Error('Name is required');
    }

    if (!price) {
      throw new Error('Price is required');
    }

    if (!stock && stock !== 0) {
      throw new Error('Stock is required');
    }

    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    if (price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        'INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
        [name, description || null, price, stock, categoryId]
      );

      await connection.commit();

      const newProduct = {
        id: result.insertId,
        ...product,
      };

      return {
        data: newProduct,
        message: 'Product added successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to add product: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {Object} product
   * @param {string} transactionType
   */
  async updateStock(product, transactionType) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const { id, stock } = product;

      if (transactionType === 'purchase') {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [stock, id]
        );
      } else if (transactionType === 'sale') {
        if (stock < 0) {
          throw new Error('Stock cannot be negative');
        }

        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [stock, id]
        );
      }

      await connection.commit();

      return {
        transactionType: transactionType,
        message: 'Stock updated successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to update stock: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {Object} transaction
   * @param {number} transaction.id
   * @param {number} transaction.productId
   * @param {number} transaction.quantity
   * @param {string} transaction.type
   * @param {number} transaction.userId
   * @returns {Promise<void>}
   */
  async createTransaction(transaction) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const { productId, quantity, type, userId } = transaction;

      if (!productId || !quantity || !type || !userId) {
        throw new Error(
          'Missing required fields: productId, quantity, type, userId'
        );
      }

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const [productRows] = await connection.query(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const product = productRows[0];
      const previousStock = product.stock;

      if (type === 'sale' && product.stock < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Requested: ${quantity}, Available: ${product.stock}`
        );
      }

      const [result] = await connection.query(
        'INSERT INTO transactions (product_id, quantity, type, user_id) VALUES (?, ?, ?, ?)',
        [productId, quantity, type, userId]
      );

      let newStock;

      if (type === 'purchase') {
        newStock = previousStock + quantity;
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [quantity, productId]
        );
      } else if (type === 'sale') {
        newStock = previousStock - quantity;
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [quantity, productId]
        );
      }

      await connection.commit();

      return {
        data: {
          id: result.insertId,
          ...transaction,
          previousStock,
          newStock,
        },
        message: 'Transaction created successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to create transaction: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {string} category
   * @returns {Promise<Object>}
   */
  async getProductsByCategory(category) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         WHERE c.name = ?`,
        [category]
      );

      return {
        data: rows,
        category,
        total: rows.length,
      };
    } catch (error) {
      throw new Error(`Failed to get products by category: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @returns {Promise<Object>}
   */
  async getInventoryValue() {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT SUM(price * stock) as total_value FROM products'
      );

      const totalValue = rows[0].total_value || 0;

      return {
        data: {
          totalValue: parseFloat(totalValue),
          currency: 'USD',
        },
        message: 'Inventory value calculated successfully',
      };
    } catch (error) {
      throw new Error(`Failed to calculate inventory value: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {number} productId
   * @returns {Promise<Object>}
   */
  async getProductHistory(productId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT t.*, p.name as product_name, u.name as user_name 
         FROM transactions t 
         JOIN products p ON t.product_id = p.id 
         JOIN users u ON t.user_id = u.id 
         WHERE t.product_id = ? 
         ORDER BY t.transaction_date DESC`,
        [productId]
      );

      return {
        data: rows,
        productId,
        total: rows.length,
      };
    } catch (error) {
      throw new Error(`Failed to get product history: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {number} threshold
   * @returns {Promise<Object>}
   */
  async getLowStockProducts(threshold = 10) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         WHERE p.stock <= ?
         ORDER BY p.stock ASC`,
        [threshold]
      );

      return {
        data: rows,
        threshold,
        total: rows.length,
      };
    } catch (error) {
      throw new Error(`Failed to get low stock products: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * @param {number} id
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  async updateProduct(id, productData) {
    const { name, description, price, categoryId } = productData;
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if product exists
      const [existingProduct] = await connection.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (existingProduct.length === 0) {
        throw new Error('Product not found');
      }

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (price !== undefined) {
        if (price < 0) {
          throw new Error('Price cannot be negative');
        }
        updateFields.push('price = ?');
        updateValues.push(price);
      }
      if (categoryId !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(categoryId);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateValues.push(id);

      await connection.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      await connection.commit();

      return {
        data: { id, ...productData },
        message: 'Product updated successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to update product: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = InventoryManager;
