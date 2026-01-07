const { v4: uuidv4 } = require('uuid');

class MockStore {
    constructor() {
        this.items = [];
        this.sales = [];
        this.categories = [];
        this.initializeDemoData();
    }

    initializeDemoData() {
        // Create Categories
        const cat1 = { _id: uuidv4(), category_name_my: 'အချိုရည်', category_name_en: 'Drinks' };
        const cat2 = { _id: uuidv4(), category_name_my: 'မုန့်', category_name_en: 'Snacks' };
        const cat3 = { _id: uuidv4(), category_name_my: 'အိမ်သုံးပစ္စည်း', category_name_en: 'Household' };

        this.categories = [cat1, cat2, cat3];

        // Create Items
        this.items = [
            {
                _id: uuidv4(),
                name: 'Coca Cola 330ml',
                itemCode: 'DRK001',
                price: 700,
                stockQuantity: 50,
                lowStockThreshold: 10,
                category: cat1._id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: uuidv4(),
                name: 'Potato Chips',
                itemCode: 'SNK001',
                price: 1500,
                stockQuantity: 20,
                lowStockThreshold: 5,
                category: cat2._id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: uuidv4(),
                name: 'Dish Soap',
                itemCode: 'HSH001',
                price: 2500,
                stockQuantity: 5,
                lowStockThreshold: 5,
                category: cat3._id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: uuidv4(),
                name: 'Pepsi 330ml',
                itemCode: 'DRK002',
                price: 700,
                stockQuantity: 0, // Out of stock
                lowStockThreshold: 10,
                category: cat1._id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Create some past sales
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        this.sales = [
            {
                _id: uuidv4(),
                invoice_number: 'INV-001',
                items: [
                    {
                        item_id: this.items[0]._id,
                        quantity: 2,
                        unit_price: 700,
                        total_price: 1400
                    }
                ],
                total_amount: 1400,
                payment_method: 'cash',
                sale_date: yesterday,
                createdAt: yesterday,
                updatedAt: yesterday
            }
        ];
    }

    // Generic Helpers
    generateId() {
        return uuidv4();
    }

    // Item Methods
    getAllItems() {
        return this.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getItemById(id) {
        return this.items.find(item => item._id === id);
    }

    createItem(itemData) {
        // Validate required fields
        if (!itemData.name || itemData.name.trim() === '') {
            throw new Error('Name is required');
        }
        if (!itemData.itemCode || itemData.itemCode.trim() === '') {
            throw new Error('Item code is required');
        }

        // Validate price (allow zero)
        if (itemData.price === undefined || itemData.price === null) {
            throw new Error('Price is required');
        }
        const price = parseFloat(itemData.price);
        if (isNaN(price) || price < 0) {
            throw new Error('Price must be a non-negative number');
        }

        // Validate stock quantity (allow zero)
        if (itemData.stockQuantity !== undefined && itemData.stockQuantity !== null) {
            const stockQty = parseInt(itemData.stockQuantity);
            if (isNaN(stockQty) || stockQty < 0) {
                throw new Error('Stock quantity must be a non-negative integer');
            }
        }

        // Validate low stock threshold
        if (itemData.lowStockThreshold !== undefined && itemData.lowStockThreshold !== null) {
            const threshold = parseInt(itemData.lowStockThreshold);
            if (isNaN(threshold) || threshold < 0) {
                throw new Error('Low stock threshold must be a non-negative integer');
            }
        }

        // Check for duplicate item code (case-insensitive)
        const normalizedItemCode = itemData.itemCode.trim().toUpperCase();
        const existingItem = this.items.find(item => item.itemCode.trim().toUpperCase() === normalizedItemCode);
        if (existingItem) {
            throw new Error('Item code already exists');
        }

        const newItem = {
            _id: this.generateId(),
            name: itemData.name.trim(),
            itemCode: itemData.itemCode.trim(),
            price: price,
            stockQuantity: itemData.stockQuantity !== undefined ? parseInt(itemData.stockQuantity) : 0,
            lowStockThreshold: itemData.lowStockThreshold !== undefined ? parseInt(itemData.lowStockThreshold) : 10,
            category: itemData.category || null,
            expiryDate: itemData.expiryDate || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.items.push(newItem);
        return newItem;
    }

    updateItem(id, updateData) {
        const index = this.items.findIndex(item => item._id === id);
        if (index === -1) return null;

        // Validate name if provided
        if (updateData.name !== undefined && updateData.name.trim() === '') {
            throw new Error('Name is required');
        }

        // Validate price if provided
        if (updateData.price !== undefined) {
            const price = parseFloat(updateData.price);
            if (isNaN(price) || price < 0) {
                throw new Error('Price must be a non-negative number');
            }
            updateData.price = price;
        }

        // Validate stock quantity if provided
        if (updateData.stockQuantity !== undefined) {
            const stockQty = parseInt(updateData.stockQuantity);
            if (isNaN(stockQty) || stockQty < 0) {
                throw new Error('Stock quantity must be a non-negative integer');
            }
            updateData.stockQuantity = stockQty;
        }

        // Validate low stock threshold if provided
        if (updateData.lowStockThreshold !== undefined) {
            const threshold = parseInt(updateData.lowStockThreshold);
            if (isNaN(threshold) || threshold < 0) {
                throw new Error('Low stock threshold must be a non-negative integer');
            }
            updateData.lowStockThreshold = threshold;
        }

        // Trim and validate item code if provided
        if (updateData.itemCode !== undefined) {
            const normalizedItemCode = updateData.itemCode.trim().toUpperCase();
            const existingItem = this.items.find(item => 
                item._id !== id && item.itemCode.trim().toUpperCase() === normalizedItemCode
            );
            if (existingItem) {
                throw new Error('Item code already exists');
            }
            updateData.itemCode = updateData.itemCode.trim();
        }

        // Trim name if provided
        if (updateData.name !== undefined) {
            updateData.name = updateData.name.trim();
        }

        this.items[index] = {
            ...this.items[index],
            ...updateData,
            updatedAt: new Date()
        };
        return this.items[index];
    }

    deleteItem(id) {
        const index = this.items.findIndex(item => item._id === id);
        if (index === -1) return null;

        const deletedItem = this.items[index];
        this.items.splice(index, 1);
        return deletedItem;
    }

    // Sale Methods
    createSale(saleData) {
        const newSale = {
            _id: this.generateId(),
            invoice_number: `INV-${Date.now()}`,
            ...saleData,
            sale_date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.sales.push(newSale);
        return newSale;
    }

    getAllSales(filters = {}) {
        let filteredSales = [...this.sales];

        if (filters.startDate) {
            filteredSales = filteredSales.filter(s => new Date(s.sale_date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            filteredSales = filteredSales.filter(s => new Date(s.sale_date) <= new Date(filters.endDate));
        }

        return filteredSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    }

    getSaleById(id) {
        return this.sales.find(s => s._id === id);
    }

    // Category Methods
    getAllCategories() {
        return this.categories;
    }

    getCategoryById(id) {
        return this.categories.find(c => c._id === id);
    }
}

module.exports = new MockStore();
