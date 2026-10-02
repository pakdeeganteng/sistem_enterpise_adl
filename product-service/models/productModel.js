const pool = require('../config/db');
async function getAllProducts() {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return rows;
}

//ambil data product berdasarkan id
async function getProductById(id) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
}

//simpan product ke database
async function createProduct(product) {
    const { name, description, price, stock, image } = product;
    const [result] = await pool.query(
        'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, stock, image]
    );
    return getProductById(result.insertId);
}

//update product berdasarkan id
async function updateProduct(id, product) {
    const { name, description, price, stock, image } = product;
    await pool.query(
        'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ? WHERE id = ?',
        [name, description, price, stock, image, id]
    );
    return getProductById(id);
}

//hapus product berdasarkan id
async function deleteProduct(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};