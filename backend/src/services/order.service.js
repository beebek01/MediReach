/**
 * Order Service — business logic for checkout & order lifecycle.
 */

const { getClient, pool } = require('../database/db');
const cartRepository = require('../repositories/cart.repository');
const orderRepository = require('../repositories/order.repository');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendInventoryAlertEmail,
} = require('../utils/email');

const TAX_RATE = 0.13;
const DELIVERY_FEE = 100;
const FREE_DELIVERY_THRESHOLD = 1000;

/** Format a DB order row → frontend-friendly object. */
function formatOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax),
    deliveryFee: parseFloat(row.delivery_fee),
    grandTotal: parseFloat(row.grand_total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    shippingAddress: row.shipping_address,
    shippingPhone: row.shipping_phone,
    notes: row.notes,
    prescriptionId: row.prescription_id,
    userName: row.user_name,
    userEmail: row.user_email,
    deliveryLat: row.delivery_lat ?? null,
    deliveryLng: row.delivery_lng ?? null,
    destinationLat: row.destination_lat ?? null,
    destinationLng: row.destination_lng ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatOrderItem(row) {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    medicineName: row.medicine_name,
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    totalPrice: parseFloat(row.total_price),
    imageUrl: row.image_url,
    category: row.category,
  };
}

function formatDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function getDaysUntilDate(value) {
  if (!value) return null;
  const target = new Date(`${formatDateOnly(value)}T00:00:00`);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = target.getTime() - startToday.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function buildInventoryAlertPayload(medicines = []) {
  const lowStock = medicines
    .filter((medicine) => Number(medicine.stock) <= 20)
    .map((medicine) => ({ name: medicine.name, stock: medicine.stock }));

  const nearExpiry = medicines
    .map((medicine) => {
      const expiryDate = formatDateOnly(medicine.expiry_date);
      const daysLeft = getDaysUntilDate(expiryDate);
      return { name: medicine.name, expiryDate, daysLeft };
    })
    .filter((medicine) => medicine.expiryDate && medicine.daysLeft != null && medicine.daysLeft >= 0 && medicine.daysLeft <= 30);

  return { lowStock, nearExpiry };
}

async function notifyInventoryAlertsToStaff(payload = {}) {
  if (!payload.lowStock?.length && !payload.nearExpiry?.length) return;

  const { rows: recipients } = await pool.query(
    `SELECT DISTINCT email
     FROM users
     WHERE role IN ('admin', 'pharmacist')
       AND (status = 'active' OR status IS NULL)
       AND email IS NOT NULL`
  );

  if (!recipients.length) return;

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendInventoryAlertEmail(recipient.email, payload)
    )
  );

  results
    .filter((result) => result.status === 'rejected')
    .forEach((result) => {
      console.error('Inventory alert email failed:', result.reason?.message || result.reason);
    });
}

const orderService = {
  /**
   * Checkout: convert cart → order inside a transaction.
   * - Validates cart is not empty
   * - Validates stock is available for every item
   * - If any item requires prescription, checks prescriptionId
   * - Calculates totals
   * - Creates order + order_items
   * - Deducts stock
   * - Clears cart
   * Returns the new order.
   */
  async checkout(userId, { paymentMethod, shippingAddress, shippingPhone, notes, prescriptionId }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Get or create cart
      const cart = await cartRepository.getOrCreateCart(userId);

      // 2. Fetch cart items with medicine data (lock rows for update)
      const { rows: cartItems } = await client.query(
        `SELECT ci.*, m.price, m.stock, m.name, m.requires_prescription
         FROM cart_items ci
         JOIN medicines m ON m.id = ci.medicine_id
         WHERE ci.cart_id = $1
         FOR UPDATE OF m`,
        [cart.id]
      );

      if (cartItems.length === 0) {
        throw new BadRequestError('Cart is empty. Add items before checkout.');
      }

      // 3. Check prescription requirement
      const needsRx = cartItems.some((i) => i.requires_prescription);
      if (needsRx && !prescriptionId) {
        throw new BadRequestError(
          'Your cart contains prescription-only medicines. Please provide a prescriptionId.'
        );
      }

      // If prescription provided, verify it belongs to user and is approved
      if (prescriptionId) {
        const { rows: rxRows } = await client.query(
          'SELECT * FROM prescriptions WHERE id = $1 AND user_id = $2',
          [prescriptionId, userId]
        );
        if (!rxRows[0]) {
          throw new NotFoundError('Prescription not found');
        }
        if (rxRows[0].status !== 'approved') {
          throw new BadRequestError(
            `Prescription is "${rxRows[0].status}". Only approved prescriptions can be used for checkout.`
          );
        }
        if (rxRows[0].used) {
          throw new BadRequestError(
            'This prescription has already been used for another order. Please upload a new prescription.'
          );
        }
      }

      // 4. Validate stock & build order items
      const orderItems = [];
      let subtotal = 0;

      for (const item of cartItems) {
        const price = parseFloat(item.price);
        if (item.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for "${item.name}". Available: ${item.stock}, requested: ${item.quantity}`
          );
        }
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        orderItems.push({
          medicineId: item.medicine_id,
          medicineName: item.name,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: lineTotal,
        });
      }

      // 5. Calculate totals
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const grandTotal = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

      // 6. Generate order number
      const orderNumber = await orderRepository.generateOrderNumber();

      // 7. Determine initial status
      let initialStatus = 'pending';
      if (needsRx) {
        initialStatus = 'prescription_review';
      }

      // 8. Create order
      const order = await orderRepository.createOrder(client, {
        userId,
        orderNumber,
        status: initialStatus,
        subtotal,
        tax,
        deliveryFee,
        grandTotal,
        paymentMethod,
        paymentStatus: 'pending',
        shippingAddress,
        shippingPhone,
        notes,
        prescriptionId: prescriptionId || null,
      });

      // 9. Create order items
      await orderRepository.createOrderItems(client, order.id, orderItems);

      // 10. Deduct stock
      await orderRepository.deductStock(client, orderItems);

      // 11. Clear cart
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

      // 11b. Mark prescription as used so it cannot be reused
      if (prescriptionId) {
        await client.query(
          'UPDATE prescriptions SET used = TRUE, updated_at = NOW() WHERE id = $1',
          [prescriptionId]
        );
      }

      // 12. If COD, create a pending payment record inside the transaction
      if (paymentMethod === 'cod') {
        await client.query(
          `INSERT INTO payments
             (order_id, method, amount, status, idempotency_key)
           VALUES ($1, 'cod', $2, 'pending', $3)`,
          [order.id, grandTotal, `cod_${order.id}`]
        );
      }

      await client.query('COMMIT');

      const formattedOrder = formatOrder(order);

      // Fire-and-forget confirmation email — never blocks the response
      pool.query('SELECT email, name FROM users WHERE id = $1', [userId])
        .then(({ rows }) => {
          const userRow = rows[0];
          if (userRow?.email) {
            return sendOrderConfirmationEmail(userRow.email, formattedOrder, orderItems);
          }
        })
        .catch((emailErr) => console.error('Order confirmation email failed:', emailErr.message));

      // Fire-and-forget low-stock alert to admin + pharmacists
      const orderedMedicineIds = [
        ...new Set(orderItems.map((item) => item.medicineId)),
      ];
      pool
        .query(
          `SELECT name, stock, expiry_date
           FROM medicines
           WHERE id = ANY($1::uuid[])
             AND (
               stock <= 20
               OR (expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days')
             )
           ORDER BY stock ASC, expiry_date ASC`,
          [orderedMedicineIds]
        )
        .then(({ rows }) => notifyInventoryAlertsToStaff(buildInventoryAlertPayload(rows)))
        .catch((alertErr) =>
          console.error('Inventory alert email failed:', alertErr.message)
        );

      return formattedOrder;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get a single order by ID (with authorization check).
   */
  async getOrderById(orderId, userId, role) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    // Customers can only view their own orders
    if (role === 'customer' && order.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const items = await orderRepository.getOrderItems(orderId);

    return {
      ...formatOrder(order),
      items: items.map(formatOrderItem),
    };
  },

  /**
   * Get user's orders (paginated).
   */
  async getMyOrders(userId, { page, limit, status }) {
    const { orders, total } = await orderRepository.findByUser(userId, {
      page,
      limit,
      status,
    });

    return {
      orders: orders.map(formatOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all orders (admin / pharmacist) — paginated.
   */
  async getAllOrders({ page, limit, status }) {
    const { orders, total } = await orderRepository.findAll({
      page,
      limit,
      status,
    });

    return {
      orders: orders.map(formatOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update order status (admin / pharmacist).
   * Enforces valid transitions.
   */
  async updateOrderStatus(orderId, newStatus) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const validTransitions = {
      pending: ['verified', 'prescription_review', 'cancelled'],
      prescription_review: ['verified', 'cancelled'],
      verified: ['packed', 'cancelled'],
      packed: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition from "${order.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    const updated = await orderRepository.updateStatus(orderId, newStatus);
    const formattedUpdated = formatOrder(updated);

    // Fire-and-forget status update email
    pool.query('SELECT email FROM users WHERE id = $1', [order.user_id])
      .then(({ rows }) => {
        const userRow = rows[0];
        if (userRow?.email) {
          return sendOrderStatusUpdateEmail(userRow.email, order.order_number, newStatus);
        }
      })
      .catch((emailErr) => console.error('Order status email failed:', emailErr.message));

    return formattedUpdated;
  },

  /**
   * Cancel order (customer can cancel only if pending / prescription_review).
   */
  async cancelOrder(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.user_id !== userId) throw new ForbiddenError('Access denied');

    const cancellable = ['pending', 'prescription_review'];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestError(
        `Cannot cancel order in "${order.status}" status. Only pending or prescription_review orders can be cancelled.`
      );
    }

    // Restore stock
    const items = await orderRepository.getOrderItems(orderId);
    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        await client.query(
          'UPDATE medicines SET stock = stock + $1, sold_count = GREATEST(sold_count - $1, 0) WHERE id = $2',
          [item.quantity, item.medicine_id]
        );
      }

      await client.query(
        "UPDATE orders SET status = 'cancelled' WHERE id = $1",
        [orderId]
      );

      // Restore prescription so it can be reused
      if (order.prescription_id) {
        await client.query(
          'UPDATE prescriptions SET used = FALSE, updated_at = NOW() WHERE id = $1',
          [order.prescription_id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const updated = await orderRepository.findById(orderId);
    return formatOrder(updated);
  },

  /**
   * Update delivery rider's GPS location (admin / pharmacist).
   */
  async updateDeliveryLocation(orderId, { lat, lng }) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (order.status !== 'shipped') {
      throw new BadRequestError('Can only update location for shipped orders');
    }

    await orderRepository.updateDeliveryLocation(orderId, { lat, lng });
    return { success: true };
  },

  /**
   * Set destination coordinates for an order (admin / pharmacist).
   */
  async setDestination(orderId, { lat, lng }) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    await orderRepository.setDestination(orderId, { lat, lng });
    return { success: true };
  },

  /**
   * Get real-time tracking data for an order.
   */
  async getTrackingData(orderId, userId, role) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (role === 'customer' && order.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const tracking = await orderRepository.getTrackingData(orderId);
    return {
      orderId: tracking.id,
      status: tracking.status,
      deliveryLat: tracking.delivery_lat,
      deliveryLng: tracking.delivery_lng,
      destinationLat: tracking.destination_lat,
      destinationLng: tracking.destination_lng,
      shippingAddress: tracking.shipping_address,
      updatedAt: tracking.updated_at,
    };
  },
};

module.exports = orderService;
