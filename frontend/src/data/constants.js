// ============ CONSTANTS — MediReach ============

export const ROLES = {
  CUSTOMER: "customer",
  PHARMACIST: "pharmacist",
  ADMIN: "admin",
};

export const ORDER_STATUSES = [
  "pending",
  "prescription_review",
  "verified",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const MEDICINE_CATEGORIES = [
  "Pain Relief",
  "Vitamins",
  "Antibiotics",
  "Diabetes",
  "Cardiac",
  "Digestive",
  "Skin",
  "Cold & Cough",
  "Other",
];

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", logo: "💵" },
  { id: "imepay", name: "IME Pay", logo: "📱" },
];
