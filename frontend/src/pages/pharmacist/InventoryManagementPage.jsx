import { useState, useEffect } from 'react';
import { MEDICINE_CATEGORIES } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

export default function InventoryManagementPage() {
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', genericName: '', manufacturer: '', category: '', price: '', stock: '', expiryDate: '', requiresPrescription: false, description: '' });

  useEffect(() => {
    api.getMedicines()
      .then((res) => setList(res.data?.medicines ?? []))
      .catch(() => addToast('Failed to load inventory', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = [...list]
    .filter((m) => !filter || m.category === filter)
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'stock' ? a.stock - b.stock : 0));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', genericName: '', manufacturer: '', category: MEDICINE_CATEGORIES[0], price: '', stock: '', expiryDate: '', requiresPrescription: false, description: '' });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      genericName: m.genericName || '',
      manufacturer: m.manufacturer || '',
      category: m.category,
      price: String(m.price),
      stock: String(m.stock),
      expiryDate: m.expiryDate || '',
      requiresPrescription: m.requiresPrescription || false,
      description: m.description || '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      const body = {
        name: form.name,
        genericName: form.genericName,
        manufacturer: form.manufacturer,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        expiryDate: form.expiryDate || null,
        requiresPrescription: form.requiresPrescription,
        description: form.description,
      };
      if (editing) {
        const res = await api.updateMedicine(editing.id, body, accessToken);
        setList((prev) => prev.map((m) => (m.id === editing.id ? res.data.medicine : m)));
        addToast('Medicine updated successfully');
      } else {
        const res = await api.createMedicine(body, accessToken);
        setList((prev) => [...prev, res.data.medicine]);
        addToast('Medicine added to inventory');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to save medicine', 'error');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-fraunces text-xl font-semibold text-charcoal">Inventory</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {MEDICINE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
          >
            <option value="name">Sort by name</option>
            <option value="stock">Sort by stock</option>
          </select>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Add New Medicine
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal/5 text-left">
                <th className="px-4 py-3 font-medium text-charcoal">Medicine</th>
                <th className="px-4 py-3 font-medium text-charcoal">Category</th>
                <th className="px-4 py-3 font-medium text-charcoal">Stock</th>
                <th className="px-4 py-3 font-medium text-charcoal">Expiry</th>
                <th className="px-4 py-3 font-medium text-charcoal">Price</th>
                <th className="px-4 py-3 font-medium text-charcoal"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={`border-t border-charcoal/5 ${m.stock < 20 ? 'bg-soft-red/5' : ''}`}>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-charcoal/70">{m.category}</td>
                  <td className="px-4 py-3">
                    {m.stock < 20 ? <Badge variant="amber">{m.stock} low</Badge> : m.stock}
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{m.expiryDate || '—'}</td>
                  <td className="px-4 py-3">Rs. {m.price}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="text-primary font-medium hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-8 text-center text-charcoal/50">No inventory items yet. Click "Add New Medicine" to get started.</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add New Medicine'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Generic Name</label>
            <input
              type="text"
              value={form.genericName}
              onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Manufacturer</label>
            <input
              type="text"
              value={form.manufacturer}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            >
              {MEDICINE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Price (Rs.)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2 focus:border-primary outline-none"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) => setForm((f) => ({ ...f, requiresPrescription: e.target.checked }))}
              className="rounded text-primary"
            />
            <span className="text-sm text-charcoal">Prescription required</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-charcoal/20 px-4 py-2 font-medium text-charcoal">
              Cancel
            </button>
            <button type="button" onClick={save} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
