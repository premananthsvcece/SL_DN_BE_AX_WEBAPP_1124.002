import express from 'express';
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();

// Get all inventory items with orders and suppliers
router.get('/', async (req, res) => {
  try {
    const inventoryItems = await knex('inventory')
      .select(
        'inventory.inventory_id',
        'inventory.part_name',
        'inventory.part_number',
        'inventory.description',
        'inventory.category',
        'inventory.quantity',
        'inventory.price',
        knex.raw('GROUP_CONCAT(DISTINCT orders.id) as order_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT orders.date) as order_dates'),
        knex.raw('GROUP_CONCAT(DISTINCT orders.supplier_id) as order_supplier_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT orders.quantity) as order_quantities'),
        knex.raw('GROUP_CONCAT(DISTINCT inventory_suppliers.supplier_id) as supplier_ids')
      )
      .leftJoin('orders', 'inventory.inventory_id', 'orders.inventory_id')
      .leftJoin('inventory_suppliers', 'inventory.inventory_id', 'inventory_suppliers.inventory_id')
      .groupBy('inventory.inventory_id');

    const formattedItems = inventoryItems.map(item => {
      const orderIds = item.order_ids ? item.order_ids.split(',') : [];
      const orderDates = item.order_dates ? item.order_dates.split(',') : [];
      const orderSupplierIds = item.order_supplier_ids ? item.order_supplier_ids.split(',') : [];
      const orderQuantities = item.order_quantities ? item.order_quantities.split(',') : [];
      const suppliers = item.supplier_ids ? item.supplier_ids.split(',') : [];

      const orders = orderIds.map((id, index) => ({
        _id: id,
        date: new Date(orderDates[index]).toISOString(),
        supplier_id: orderSupplierIds[index],
        quantity: parseInt(orderQuantities[index], 10)
      }));

      return {
        _id: item.inventory_id, // Assuming inventory_id is used as _id
        inventory_id: item.inventory_id,
        part_name: item.part_name,
        part_number: item.part_number,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        orders,
        suppliers,
        price: parseFloat(item.price)
      };
    });

    res.status(200).json(formattedItems);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory items', details: error.message });
  }
});

export default router;