const http = require('http');
const url = require('url');

const host = 'localhost';
const port = 3000;
const InventoryManager = require('./InventoryManager');
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Rizky123',
  database: 'inventory_management',
};

const inventoryManager = new InventoryManager(dbConfig);

/**
 * @param {http.ServerResponse} res
 * @param {number} statusCode
 * @param  {Object} data
 * @returns {void}
 */
const sendJsonResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
};

/**
 * Handle errors and send appropriate response
 * @param {http.ServerResponse} res
 * @param {Error} error
 * @param {string} context
 */
const handleError = (res, error, context = 'Unknown') => {
  console.error(`Error in ${context}:`, error.message);

  sendJsonResponse(res, 500, {
    error: error.message || 'Internal server error',
  });
};

/**
 * @param {http.IncomingMessage} req
 * @param {Function} callback
 * @returns {void}
 */
const handleBodyRequest = (req, callback) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch (error) {
      callback(null);
    }
  });
};

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    sendJsonResponse(res, 200, {});
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const { page, limit, category, threshold } = parsedUrl.query;

  console.log(`${method} ${path}`);

  try {
    if (path === '/products' && method === 'GET') {
      if (category) {
        const data = await inventoryManager.getProductsByCategory(category);
        sendJsonResponse(res, 200, data);
      } else {
        const data = await inventoryManager.getProducts(page, limit);
        sendJsonResponse(res, 200, data);
      }
    } else if (path === '/products' && method === 'POST') {
      handleBodyRequest(req, async (body) => {
        if (!body) {
          sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        try {
          const newProduct = await inventoryManager.addProduct(body);
          sendJsonResponse(res, 201, newProduct);
        } catch (error) {
          handleError(res, error, 'POST /products');
        }
      });
    } else if (path.match(/^\/products\/(\d+)$/) && method === 'PUT') {
      const productId = parseInt(path.match(/^\/products\/(\d+)$/)[1]);

      handleBodyRequest(req, async (body) => {
        if (!body) {
          sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        // Check if it's a stock update or product update
        if (body.product && body.transactionType) {
          try {
            const updatedProduct = await inventoryManager.updateStock(
              body.product,
              body.transactionType
            );
            sendJsonResponse(res, 200, updatedProduct);
          } catch (error) {
            handleError(res, error, 'PUT /products/:id (stock update)');
          }
        } else {
          try {
            const updatedProduct = await inventoryManager.updateProduct(
              productId,
              body
            );
            sendJsonResponse(res, 200, updatedProduct);
          } catch (error) {
            handleError(res, error, 'PUT /products/:id (product update)');
          }
        }
      });
    } else if (path.match(/^\/products\/(\d+)\/history$/) && method === 'GET') {
      const productId = parseInt(path.match(/^\/products\/(\d+)\/history$/)[1]);

      try {
        const history = await inventoryManager.getProductHistory(productId);
        sendJsonResponse(res, 200, history);
      } catch (error) {
        handleError(res, error, 'GET /products/:id/history');
      }
    } else if (path === '/transactions' && method === 'POST') {
      handleBodyRequest(req, async (body) => {
        if (!body || !body.transaction) {
          sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        try {
          const newTransaction = await inventoryManager.createTransaction(
            body.transaction
          );

          sendJsonResponse(res, 201, newTransaction);
        } catch (error) {
          handleError(res, error, 'POST /transactions');
        }
      });
    } else if (path === '/reports/inventory' && method === 'GET') {
      try {
        const inventoryValue = await inventoryManager.getInventoryValue();
        sendJsonResponse(res, 200, inventoryValue);
      } catch (error) {
        handleError(res, error, 'GET /reports/inventory');
      }
    } else if (path === '/reports/low-stock' && method === 'GET') {
      try {
        const lowStockProducts = await inventoryManager.getLowStockProducts(
          threshold ? parseInt(threshold) : 10
        );
        sendJsonResponse(res, 200, lowStockProducts);
      } catch (error) {
        handleError(res, error, 'GET /reports/low-stock');
      }
    } else {
      sendJsonResponse(res, 404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    handleError(res, error, 'Server error');
  }
});

server.listen(port, host, () => {
  console.log(`🚀 Server is running on http://${host}:${port}`);
});
