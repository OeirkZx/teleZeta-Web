// [TeleZeta] Pharmacist Order Management
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Prescription } from '@/lib/types';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import Badge from '@/components/common/Badge';
import { formatTime } from '@/lib/utils/formatters';
import { Package, Search, CheckCircle2, Store, Pill, User, AlertCircle, ArrowRight } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';

export default function PharmacistOrders() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const hlId = searchParams.get('id');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        // Fetch orders where status is processing/ready/completed and pharmacist_id is mine OR is null (available to claim)
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            *,
            patient:profiles!patient_id(*),
            doctor:doctors(*, profiles(*))
          `)
          .or(`pharmacist_id.eq.${user.id},pharmacist_id.is.null`)
          .neq('status', 'pending') // Only redeemed ones
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        
        if (hlId && data) {
          const found = data.find(o => o.id === hlId);
          if (found) setSelectedOrder(found);
        }
      } catch (err) {
        console.error('[TeleZeta] Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user, supabase, hlId]);

  const handleUpdateStatus = async (id: string, newStatus: 'ready' | 'completed') => {
    if (!user) return;
    setUpdatingId(id);
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      // If setting to ready, ensure pharmacist_id is set to me
      const order = orders.find(o => o.id === id);
      if (order && !order.pharmacist_id) {
        updateData.pharmacist_id = user.id;
      }

      const { error } = await supabase
        .from('prescriptions')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => 
        o.id === id ? { ...o, ...updateData } : o
      ));
      
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, ...updateData });
      }
      
    } catch (err) {
      console.error('[TeleZeta] Failed to update order:', err);
      alert('Gagal memperbarui status pesanan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newOrders = filteredOrders.filter(o => o.status === 'processing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  const OrderCard = ({ order }: { order: any }) => (
    <div 
      className="card p-5 bg-white transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer border border-gray-100 group"
      onClick={() => setSelectedOrder(order)}
    >
      <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
        <div>
          <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mb-2">#{order.id.split('-')[0].toUpperCase()}</p>
          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{order.patient?.full_name}</h3>
        </div>
        <Badge status={order.status} />
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Pill className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Resep</p>
            <p className="text-sm font-bold text-gray-900">{order.medications.length} jenis obat</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dokter Peresep</p>
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{order.doctor?.profiles?.full_name}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Waktu:</span> <br/>
          {new Date(order.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {formatTime(order.updated_at)}
        </div>
        <button className="text-blue-600 group-hover:bg-blue-50 p-2 rounded-full transition-colors shrink-0">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Manajemen Pesanan</h1>
          <p className="text-gray-600 mt-2">Daftar resep obat pasien untuk disiapkan apotek</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama pasien, ID pesanan..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs.Root defaultValue="new" className="animate-fadeUp d1">
        <Tabs.List className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl w-full md:w-max mb-8 overflow-x-auto hide-scrollbar sticky top-16 md:top-0 z-20">
          <Tabs.Trigger
            value="new"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Antrean Masuk {newOrders.length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">{newOrders.length}</span>}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="ready"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Siap Diambil ({readyOrders.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="completed"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Selesai ({completedOrders.length})
          </Tabs.Trigger>
        </Tabs.List>

        <div className="relative min-h-[400px]">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height={260} borderRadius={24} />)}
            </div>
          ) : (
            <>
              <Tabs.Content value="new" className="outline-none">
                {newOrders.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {newOrders.map((order, i) => (
                      <div key={order.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                        <OrderCard order={order} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Antrean</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Selesai! Semua pesanan obat masuk telah beres diracik.</p>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="ready" className="outline-none">
                {readyOrders.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {readyOrders.map((order, i) => (
                      <div key={order.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                        <OrderCard order={order} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada pesanan yang sedang menunggu pengambilan.</p>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="completed" className="outline-none">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-75">
                  {completedOrders.map((order, i) => (
                    <div key={order.id} style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                      <OrderCard order={order} />
                    </div>
                  ))}
                  {completedOrders.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">Belum ada riwayat pesanan selesai.</div>
                  )}
                </div>
              </Tabs.Content>
            </>
          )}
        </div>
      </Tabs.Root>

      {/* Detail Dialog */}
      <Dialog.Root open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl p-0 w-[95vw] max-w-3xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden outline-none animate-popIn flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <div>
                <h2 className="font-bold text-xl text-gray-900">Detail Pesanan Resep</h2>
                <p className="text-xs font-mono text-gray-500 mt-1">ID: {selectedOrder?.id}</p>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">✕</button>
              </Dialog.Close>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Data Pasien
                  </h3>
                  <p className="text-lg font-bold text-gray-900 mb-1">{selectedOrder?.patient?.full_name}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    {selectedOrder?.patient?.gender === 'L' ? 'Laki-laki' : selectedOrder?.patient?.gender === 'P' ? 'Perempuan' : ''} 
                    {selectedOrder?.patient?.date_of_birth ? ` • ${new Date().getFullYear() - new Date(selectedOrder.patient.date_of_birth).getFullYear()} tahun` : ''}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-3 p-2 bg-white rounded-lg border border-blue-50">
                    <Store className="w-4 h-4" /> Menunggu tebus di apotek
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Peresep Obat
                  </h3>
                  <p className="font-bold text-gray-900 mb-1">{selectedOrder?.doctor?.profiles?.full_name}</p>
                  <p className="text-sm text-blue-600 font-medium mb-3">{selectedOrder?.doctor?.specialty || 'Poli Umum'}</p>
                  <p className="text-xs text-gray-500 bg-white p-2 border border-gray-100 rounded-lg">
                    <span className="font-semibold block mb-1">Catatan Tambahan:</span> 
                    {selectedOrder?.notes || '-'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Pill className="w-6 h-6 text-orange-500" /> Daftar Obat yang Dibutuhkan ({selectedOrder?.medications.length})
                </h3>
                
                <div className="space-y-4">
                  {selectedOrder?.medications.map((med: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 grid md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-5">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nama / Dosis Obat</p>
                          <p className="font-bold text-lg text-gray-900 leading-tight">{med.name}</p>
                          {med.dosage && <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">{med.dosage}</span>}
                        </div>
                        <div className="md:col-span-4">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Signa / Aturan Pakai</p>
                          <p className="font-medium text-gray-800">{med.frequency}</p>
                        </div>
                        <div className="md:col-span-3">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Durasi</p>
                          <p className="font-medium text-gray-800">{med.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto flex flex-col items-center sm:items-start">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Status Saat Ini</p>
                <Badge status={selectedOrder?.status as any} />
              </div>
              
              <div className="w-full sm:w-auto flex gap-3">
                <Dialog.Close asChild>
                  <button className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors">
                    Tutup
                  </button>
                </Dialog.Close>
                
                {selectedOrder?.status === 'processing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                    disabled={updatingId === selectedOrder.id}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold flex items-center justify-center transition-transform hover:-translate-y-0.5 text-white shadow-lg btn-ripple bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
                  >
                    {updatingId === selectedOrder.id ? 'Memproses...' : <><CheckCircle2 className="w-5 h-5 mr-2" /> Tandai Siap Diambil</>}
                  </button>
                )}
                
                {selectedOrder?.status === 'ready' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    disabled={updatingId === selectedOrder.id}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold flex items-center justify-center transition-transform hover:-translate-y-0.5 text-white shadow-lg btn-ripple bg-green-500 hover:bg-green-600 disabled:opacity-70"
                  >
                    {updatingId === selectedOrder.id ? 'Memproses...' : <><CheckCircle2 className="w-5 h-5 mr-2" /> Tandai Telah Diambil (Selesai)</>}
                  </button>
                )}
              </div>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
