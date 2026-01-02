const mongoose = require('mongoose');
require('dotenv').config();

// Item Schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  itemCode: { type: String, required: true, unique: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0 },
  lowStockThreshold: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, default: null },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

// Sample data
const sampleItems = [
  {
    name: "Fresh Apples",
    itemCode: "FRU-001",
    price: 2.99,
    stockQuantity: 50,
    lowStockThreshold: 10,
    expiryDate: new Date('2025-08-20'),
    description: "Organic red apples, fresh from farm"
  },
  {
    name: "Whole Milk",
    itemCode: "DAI-001",
    price: 3.49,
    stockQuantity: 25,
    lowStockThreshold: 5,
    expiryDate: new Date('2025-08-15'),
    description: "Fresh whole milk, 1 gallon"
  },
  {
    name: "Bread Loaf",
    itemCode: "BAK-001",
    price: 2.29,
    stockQuantity: 30,
    lowStockThreshold: 8,
    expiryDate: new Date('2025-08-13'),
    description: "Fresh white bread loaf"
  },
  {
    name: "Chicken Breast",
    itemCode: "MEA-001",
    price: 7.99,
    stockQuantity: 15,
    lowStockThreshold: 3,
    expiryDate: new Date('2025-08-16'),
    description: "Boneless chicken breast, per pound"
  },
  {
    name: "Rice 5kg",
    itemCode: "GRN-001",
    price: 12.99,
    stockQuantity: 40,
    lowStockThreshold: 5,
    description: "Premium quality long grain rice"
  },
  {
    name: "Orange Juice",
    itemCode: "BEV-001",
    price: 4.49,
    stockQuantity: 20,
    lowStockThreshold: 6,
    expiryDate: new Date('2025-08-25'),
    description: "Fresh squeezed orange juice"
  },
  {
    name: "Eggs Dozen",
    itemCode: "EGG-001",
    price: 3.99,
    stockQuantity: 35,
    lowStockThreshold: 12,
    expiryDate: new Date('2025-08-22'),
    description: "Large grade A eggs, dozen pack"
  },
  {
    name: "Cheddar Cheese",
    itemCode: "CHE-001",
    price: 5.99,
    stockQuantity: 18,
    lowStockThreshold: 4,
    expiryDate: new Date('2025-08-30'),
    description: "Sharp cheddar cheese block"
  }
];

// Connect to MongoDB and insert data
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');

    // Insert sample data
    const insertedItems = await Item.insertMany(sampleItems);
    console.log(`Inserted ${insertedItems.length} items successfully`);

    // Display inserted items
    console.log('\nInserted Items:');
    insertedItems.forEach(item => {
      console.log(`- ${item.name} (${item.itemCode}): $${item.price}, Stock: ${item.stockQuantity}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding
seedDatabase();
