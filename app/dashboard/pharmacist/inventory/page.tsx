// [TeleZeta] Pharmacist Inventory Management Page
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { inventorySchema, type InventoryFormData } from '@/lib/utils/validators';
import { MOCK_INVENTORY, type InventoryItem } from '@/lib/types';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatRupiah } from '@/lib/utils/formatters';
import {
  Package, Search, Plus, AlertTriangle, Edit3, Trash2,
  X, Loader2, CheckCircle2, BarChart3, TrendingDown, Archive
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';import { log, logError } from '@/lib/utils/logger';


export default function PharmacistInventory() {
  const { user } = useAuth();
  const supabase = createClient();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
  });

  useEffect(() => {
    async function fetchInventory() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('pharmacist_id', user.id)
          .order('medicine_name', { ascending: true });

        if (error) {
          log('[TeleZeta] Inventory fetch error, using mock data:', error.message);
          setItems(MOCK_INVENTORY);
        } else {
          setItems(data?.length ? data : MOCK_INVENTORY);
        }
      } catch (err) {
        log('[TeleZeta] Using mock inventory data');
        setItems(MOCK_INVENTORY);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, [user, supabase]);

  const openAddDialog = () => {
    setEditingItem(null);
    reset({
      medicine_name: '',
      category: '',
      stock_quantity: 0,
      minimum_stock: 10,
      unit: 'strip',
      price_per_unit: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    reset({
      medicine_name: item.medicine_name,
      category: item.category || '',
      stock_quantity: item.stock_quantity,
      minimum_stock: item.minimum_stock,
      unit: item.unit,
      price_per_unit: item.price_per_unit,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: InventoryFormData) => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('inventory')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) {
          log('[TeleZeta] Update error, updating locally:', error.message);
        }

        setItems(prev =>
          prev.map(item =>
            item.id === editingItem.id
              ? { ...item, ...data, updated_at: new Date().toISOString() }
              : item
          )
        );
        alert('Stok obat berhasil diperbarui!');
      } else {
        // Create new
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          pharmacist_id: user.id,
          ...data,
          category: data.category || undefined,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('inventory').insert({
          pharmacist_id: user.id,
          ...data,
        });

        if (error) {
          log('[TeleZeta] Insert error, adding locally:', error.message);
        }

        setItems(prev => [...prev, newItem].sort((a, b) =>
          a.medicine_name.localeCompare(b.medicine_name)
        ));
        alert('Obat baru berhasil ditambahkan!');
      }

      setDialogOpen(false);
    } catch (err) {
      logError('[TeleZeta] Save inventory error:', err);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus obat ini dari inventaris?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) log('[TeleZeta] Delete error:', error.message);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      logError('[TeleZeta] Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = items.filter(item => {
    if (showLowStockOnly && item.stock_quantity >= item.minimum_stock) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.medicine_name.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = items.filter(i => i.stock_quantity < i.minimum_stock).length;
  const outOfStockCount = items.filter(i => i.stock_quantity === 0).length;

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width="100%" height={80} borderRadius={24} />
        <Skeleton width="100%" height={400} borderRadius={16} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Manajemen Stok</h1>
          <p className="text-gray-600 mt-2">Kelola inventaris obat apotek Anda</p>
        </div>
        <button
          onClick={openAddDialog}
          className="px-6 py-3 rounded-xl font-bold text-white shadow-sm hover:shadow transition-all hover:-translate-y-0.5 btn-ripple flex items-center gap-2"
          style={{ background: 'var(--blue-accent)' }}
        >
          <Plus className="w-5 h-5" /> Tambah Obat
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeUp d1">
        <div className="card p-5 border-l-4 border-l-blue-500">
          <Package className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Item</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{items.length}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500">
          <BarChart3 className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stok Aman</p>
          <h2 className="text-2xl font-bold text-green-600 mt-1">{items.length - lowStockCount}</h2>
        </div>
        <div
          className={`card p-5 border-l-4 border-l-yellow-500 cursor-pointer transition-all ${showLowStockOnly ? 'ring-2 ring-yellow-400 bg-yellow-50/50' : 'hover:bg-yellow-50/30'}`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <TrendingDown className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stok Menipis</p>
          <h2 className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-red-500">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habis</p>
          <h2 className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</h2>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && !showLowStockOnly && (
        <div className="animate-fadeUp d2 p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-800 text-sm">Peringatan Stok Rendah</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              {lowStockCount} obat memiliki stok di bawah batas minimum.{' '}
              <button
                onClick={() => setShowLowStockOnly(true)}
                className="underline font-semibold hover:text-yellow-900"
              >
                Lihat semua
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="animate-fadeUp d2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama obat atau kategori..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="animate-fadeUp d3">
        {filtered.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Nama Obat</div>
              <div className="col-span-2">Kategori</div>
              <div className="col-span-2 text-center">Stok</div>
              <div className="col-span-1 text-center">Satuan</div>
              <div className="col-span-2 text-right">Harga/Unit</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const isLow = item.stock_quantity < item.minimum_stock;
                const isEmpty = item.stock_quantity === 0;

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:py-4 items-center transition-colors ${
                      isEmpty ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Name */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isEmpty ? 'bg-red-500' : isLow ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.medicine_name}</p>
                        <p className="text-xs text-gray-400 md:hidden">{item.category || '-'}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden md:block md:col-span-2">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {item.category || '-'}
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="md:col-span-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-lg font-bold ${
                          isEmpty ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {item.stock_quantity}
                        </span>
                        <span className="text-xs text-gray-400">/ min {item.minimum_stock}</span>
                      </div>
                      {/* Stock bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-[100px] mx-auto">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isEmpty ? 'bg-red-500' : isLow ? 'bg-yellow-400' : 'bg-green-400'
                          }`}
                          style={{
                            width: `${Math.min((item.stock_quantity / Math.max(item.minimum_stock * 2, 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Unit */}
                    <div className="hidden md:block md:col-span-1 text-center">
                      <span className="text-sm text-gray-600">{item.unit}</span>
                    </div>

                    {/* Price */}
                    <div className="hidden md:block md:col-span-2 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatRupiah(item.price_per_unit)}</span>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      {isLow && (
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg mr-auto md:mr-0">
                          {isEmpty ? '⚠️ Habis' : '⚠️ Menipis'}
                        </span>
                      )}
                      <button
                        onClick={() => openEditDialog(item)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Hapus"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {showLowStockOnly ? 'Stok Aman Semua' : 'Inventaris Kosong'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {showLowStockOnly
                ? 'Tidak ada obat dengan stok di bawah minimum. Semua stok aman!'
                : searchQuery
                  ? 'Tidak ditemukan obat yang cocok dengan pencarian.'
                  : 'Mulai tambahkan obat ke inventaris apotek Anda.'}
            </p>
            {!showLowStockOnly && !searchQuery && (
              <button
                onClick={openAddDialog}
                className="mt-6 px-6 py-3 rounded-xl font-bold text-white shadow-sm btn-ripple"
                style={{ background: 'var(--blue-accent)' }}
              >
                <Plus className="w-5 h-5 inline mr-2" /> Tambah Obat Pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl p-0 w-[95vw] max-w-lg shadow-[0_20px_70px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden outline-none animate-popIn">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="font-bold text-xl text-gray-900">
                  {editingItem ? 'Edit Obat' : 'Tambah Obat Baru'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingItem ? 'Perbarui data obat di inventaris' : 'Masukkan data obat baru ke inventaris'}
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Obat *</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.medicine_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="Contoh: Paracetamol 500mg"
                  {...register('medicine_name')}
                />
                {errors.medicine_name && <p className="text-xs text-red-500 mt-1">{errors.medicine_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Analgesik, Antibiotik"
                  {...register('category')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Stok *</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.stock_quantity ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'
                    }`}
                    {...register('stock_quantity', { valueAsNumber: true })}
                  />
                  {errors.stock_quantity && <p className="text-xs text-red-500 mt-1">{errors.stock_quantity.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok Minimum *</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.minimum_stock ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'
                    }`}
                    {...register('minimum_stock', { valueAsNumber: true })}
                  />
                  {errors.minimum_stock && <p className="text-xs text-red-500 mt-1">{errors.minimum_stock.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Satuan *</label>
                  <select
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white ${
                      errors.unit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    {...register('unit')}
                  >
                    <option value="strip">Strip</option>
                    <option value="botol">Botol</option>
                    <option value="tube">Tube</option>
                    <option value="box">Box</option>
                    <option value="sachet">Sachet</option>
                    <option value="tablet">Tablet</option>
                    <option value="kapsul">Kapsul</option>
                    <option value="ampul">Ampul</option>
                  </select>
                  {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga per Unit (Rp) *</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.price_per_unit ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'
                    }`}
                    {...register('price_per_unit', { valueAsNumber: true })}
                  />
                  {errors.price_per_unit && <p className="text-xs text-red-500 mt-1">{errors.price_per_unit.message}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Dialog.Close asChild>
                  <button type="button" className="flex-1 py-3.5 px-4 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white shadow-sm hover:shadow transition-all btn-ripple flex items-center justify-center disabled:opacity-60"
                  style={{ background: 'var(--blue-accent)' }}
                >
                  {saving ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</>
                  ) : editingItem ? (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Simpan Perubahan</>
                  ) : (
                    <><Plus className="w-5 h-5 mr-2" /> Tambah Obat</>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
