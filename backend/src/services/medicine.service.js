/**
 * Medicine Service — business logic for the medicines catalogue.
 */

const medicineRepository = require('../repositories/medicine.repository');
const { query } = require('../database/db');
const { sendInventoryAlertEmail } = require('../utils/email');
const { NotFoundError, BadRequestError } = require('../utils/errors');

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

function toInventoryAlerts(medicines = []) {
  const lowStock = medicines
    .filter((medicine) => Number(medicine.stock) <= 20)
    .map((medicine) => ({ name: medicine.name, stock: medicine.stock }));

  const nearExpiry = medicines
    .map((medicine) => {
      const daysLeft = getDaysUntilDate(medicine.expiry_date ?? medicine.expiryDate);
      return {
        name: medicine.name,
        expiryDate: formatDateOnly(medicine.expiry_date ?? medicine.expiryDate),
        daysLeft,
      };
    })
    .filter((medicine) => medicine.expiryDate && medicine.daysLeft != null && medicine.daysLeft >= 0 && medicine.daysLeft <= 30);

  return { lowStock, nearExpiry };
}

async function notifyInventoryAlertsToStaff(payload = {}) {
  if (!payload.lowStock?.length && !payload.nearExpiry?.length) return;

  const { rows: recipients } = await query(
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

/** Transform a DB row (snake_case) → frontend-friendly object (camelCase). */
function formatMedicine(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    genericName: row.generic_name,
    category: row.category,
    manufacturer: row.manufacturer,
    requiresPrescription: row.requires_prescription,
    price: parseFloat(row.price),
    stock: row.stock,
    description: row.description,
    imageUrl: row.image_url,
    expiryDate: formatDateOnly(row.expiry_date),
    soldCount: row.sold_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const medicineService = {
  /**
   * List medicines with search / filter / sort / pagination.
   */
  async list({ search, category, sort, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [medicines, total] = await Promise.all([
      medicineRepository.findAll({ search, category, sort, limit, offset }),
      medicineRepository.count({ search, category }),
    ]);
    return {
      medicines: medicines.map(formatMedicine),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single medicine by ID.
   */
  async getById(id) {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw new NotFoundError('Medicine not found');
    return formatMedicine(medicine);
  },

  /**
   * Create a new medicine (admin / pharmacist).
   */
  async create(data) {
    if (!data.name || !data.genericName || !data.category || !data.manufacturer || data.price == null) {
      throw new BadRequestError('name, genericName, category, manufacturer, and price are required');
    }

    const created = await medicineRepository.create(data);
    notifyInventoryAlertsToStaff(toInventoryAlerts([created])).catch((err) =>
      console.error('Inventory alert email failed:', err.message)
    );

    return formatMedicine(created);
  },

  /**
   * Update an existing medicine (admin / pharmacist).
   */
  async update(id, data) {
    const existing = await medicineRepository.findById(id);
    if (!existing) throw new NotFoundError('Medicine not found');

    const updated = await medicineRepository.update(id, data);
    notifyInventoryAlertsToStaff(toInventoryAlerts([updated])).catch((err) =>
      console.error('Inventory alert email failed:', err.message)
    );

    return formatMedicine(updated);
  },

  /**
   * Delete a medicine (admin only).
   */
  async remove(id) {
    const deleted = await medicineRepository.remove(id);
    if (!deleted) throw new NotFoundError('Medicine not found');
    return deleted;
  },
};

module.exports = medicineService;
