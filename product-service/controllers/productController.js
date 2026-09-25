const productModel = require('../models/productModel');

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function validateProduct(body) {
    body = body || {};
    const { name, price, stock } = body;
    const errors = [];

    if (typeof name !== 'string' || name.trim() === '') {
        errors.push('name wajib berupa teks dan tidak boleh kosong');
    }
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        errors.push('price wajib berupa angka >= 0');
    }
    if (!Number.isInteger(stock) || stock < 0) {
        errors.push('stock wajib berupa bilangan bulat >= 0');
    }

    return errors;
}

function productPayload(body) {
    body = body || {};
    return {
        name: body.name.trim(),
        description: body.description == null ? null : String(body.description),
        price: body.price,
        stock: body.stock
    };
}

async function index(req, res) {
    try {
        const products = await productModel.getAllProducts();
        res.status(200).json({ data: products });
    } catch (error) {
        console.error('Failed to list products:', error);
        res.status(500).json({ message: 'Gagal mengambil data product' });
    }
}

async function show(req, res) {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID product tidak valid' });

    try {
        const product = await productModel.getProductById(id);
        if (!product) return res.status(404).json({ message: 'Product tidak ditemukan' });
        res.status(200).json({ data: product });
    } catch (error) {
        console.error('Failed to get product:', error);
        res.status(500).json({ message: 'Gagal mengambil product' });
    }
}

async function store(req, res) {
    const errors = validateProduct(req.body);
    if (errors.length) return res.status(400).json({ message: 'Data product tidak valid', errors });

    try {
        const product = await productModel.createProduct(productPayload(req.body));
        res.status(201).json({ message: 'Product berhasil dibuat', data: product });
    } catch (error) {
        console.error('Failed to create product:', error);
        res.status(500).json({ message: 'Gagal membuat product' });
    }
}

async function update(req, res) {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID product tidak valid' });
    const errors = validateProduct(req.body);
    if (errors.length) return res.status(400).json({ message: 'Data product tidak valid', errors });

    try {
        const existing = await productModel.getProductById(id);
        if (!existing) return res.status(404).json({ message: 'Product tidak ditemukan' });
        const product = await productModel.updateProduct(id, productPayload(req.body));
        res.status(200).json({ message: 'Product berhasil diubah', data: product });
    } catch (error) {
        console.error('Failed to update product:', error);
        res.status(500).json({ message: 'Gagal mengubah product' });
    }
}

async function destroy(req, res) {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID product tidak valid' });

    try {
        const deleted = await productModel.deleteProduct(id);
        if (!deleted) return res.status(404).json({ message: 'Product tidak ditemukan' });
        res.status(200).json({ message: 'Product berhasil dihapus' });
    } catch (error) {
        console.error('Failed to delete product:', error);
        res.status(500).json({ message: 'Gagal menghapus product' });
    }
}

module.exports = { index, show, store, update, destroy };