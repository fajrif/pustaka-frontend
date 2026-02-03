import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { purchaseTransactionSchema } from '@/utils/validations/PurchaseTransaction';
import { Plus, Trash2, Package, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/utils/formatters';
import Select from '@/components/ui/select';
import PurchaseBookSelectionDialog from './PurchaseBookSelectionDialog';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

const AddEditPurchaseTransactionDialog = ({ isOpen, onClose, transactionId, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showBookDialog, setShowBookDialog] = useState(false);

  const initialData = {
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    note: '',
  };

  // Fetch publishers
  const { data: publishersData = { publishers: [] } } = useQuery({
    queryKey: ['publishers', 'all'],
    queryFn: async () => {
      const response = await api.get('/publishers?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch transaction details
  const { data: transactionDetail } = useQuery({
    queryKey: ['purchaseTransaction', transactionId],
    queryFn: async () => {
      const response = await api.get(`/purchase-transactions/${transactionId}`);
      return response.data?.transaction || response.data?.purchase_transaction || response.data || null;
    },
    enabled: isOpen && !!transactionId,
  });

  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(purchaseTransactionSchema),
    defaultValues: initialData
  });

  const isEditing = !!transactionId;
  const currentStatus = transactionDetail?.status;

  // Check if transaction is locked (completed or cancelled)
  const isTransactionLocked = isEditing && (currentStatus === 1 || currentStatus === 2);

  // Sync form with fetched data
  useEffect(() => {
    if (transactionId && transactionDetail) {
      const formattedData = {
        supplier_id: transactionDetail.supplier_id || '',
        purchase_date: transactionDetail.purchase_date ? format(parseISO(transactionDetail.purchase_date), 'yyyy-MM-dd') : '',
        note: transactionDetail.note || '',
      };

      reset(formattedData);

      // Set selected books from items
      if (transactionDetail.items && transactionDetail.items.length > 0) {
        const books = transactionDetail.items.map(item => ({
          book_id: item.book_id,
          book: item.book,
          quantity: item.quantity,
          price: item.price
        }));
        setSelectedBooks(books);
      }
    } else if (!transactionId) {
      // New transaction
      setSelectedBooks([]);
      reset(initialData);
    }
  }, [transactionId, transactionDetail, reset]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBooks([]);
    }
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/purchase-transactions', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaksi pembelian berhasil dibuat.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal membuat transaksi.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/purchase-transactions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaksi pembelian berhasil diperbarui.",
        variant: "success",
      });
      queryClient.invalidateQueries(['purchaseTransactions']);
      queryClient.invalidateQueries(['purchaseTransaction', transactionId]);
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui transaksi.",
        variant: "destructive",
      });
    }
  });

  const onFinishing = () => {
    reset(initialData);
    setSelectedBooks([]);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    setSelectedBooks([]);
    onClose();
  };

  const handleBookConfirm = (books) => {
    setSelectedBooks(books);
    setShowBookDialog(false);
  };

  const handleQuantityChange = (bookId, newQuantity) => {
    setSelectedBooks(prev => prev.map(item => {
      if (item.book_id === bookId) {
        const quantity = Math.max(1, newQuantity);
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const handlePriceChange = (bookId, newPrice) => {
    setSelectedBooks(prev => prev.map(item => {
      if (item.book_id === bookId) {
        const maxPrice = item.book?.price || 999999999;
        // Validate against selling price
        if (newPrice > maxPrice) {
          toast({
            title: "Peringatan",
            description: `Harga beli tidak boleh melebihi harga jual (${formatRupiah(maxPrice)})`,
            variant: "destructive",
          });
          return { ...item, price: maxPrice };
        }
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const handleRemoveBook = (bookId) => {
    setSelectedBooks(prev => prev.filter(item => item.book_id !== bookId));
  };

  const calculateSummary = () => {
    const totalQuantity = selectedBooks.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);
    const totalAmount = selectedBooks.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    return { totalAmount, totalJenis: selectedBooks.length, totalQuantity };
  };

  const onHandleSubmit = async (data) => {

    // Validate books
    if (selectedBooks.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 buku",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have price > 0
    const booksWithoutPrice = selectedBooks.filter(item => !item.price || item.price <= 0);
    if (booksWithoutPrice.length > 0) {
      const bookNames = booksWithoutPrice.map(item => item.book?.name || 'Unknown').slice(0, 3).join(', ');
      const moreCount = booksWithoutPrice.length > 3 ? ` dan ${booksWithoutPrice.length - 3} lainnya` : '';
      toast({
        title: "Error",
        description: `Harga beli belum diisi untuk: ${bookNames}${moreCount}`,
        variant: "destructive",
      });
      return;
    }

    // Prepare payload
    const payload = {
      supplier_id: data.supplier_id,
      purchase_date: data.purchase_date,
      note: data.note && data.note.trim() !== '' ? data.note : undefined, // Send undefined instead of empty string
      items: selectedBooks.map(book => ({
        book_id: book.book_id,
        quantity: Number(book.quantity),
        price: Number(book.price)
      }))
    };


    if (isEditing) {
      updateMutation.mutate({ id: transactionId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const { totalAmount, totalJenis, totalQuantity } = calculateSummary();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClosing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-700">
              {isEditing ? 'Edit Transaksi Pembelian' : 'Tambah Transaksi Pembelian Baru'}
            </DialogTitle>
          </DialogHeader>

          {isTransactionLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Transaksi Terkunci</p>
                <p className="text-sm text-amber-700">
                  Transaksi dengan status {currentStatus === 1 ? 'Selesai' : 'Dibatalkan'} tidak dapat diedit.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <div className="space-y-6 py-4">
              {/* Transaction Information */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2 text-slate-900">Informasi Transaksi</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 border-l-2 border-purple-400 pl-3">
                    <Label className="text-slate-700">Penerbit <span className="text-red-500">*</span></Label>
                    <Controller
                      name="supplier_id"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          options={publishersData.publishers.map(p => ({
                            value: p.id,
                            label: p.name
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih Penerbit"
                          searchable={true}
                          disabled={isTransactionLocked}
                        />
                      )}
                    />
                    {errors.supplier_id && (
                      <p className="text-red-500 text-sm">{errors.supplier_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 border-l-2 border-purple-400 pl-3">
                    <Label className="text-slate-700">Tanggal Pembelian <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register('purchase_date')}
                      disabled={isTransactionLocked}
                    />
                    {errors.purchase_date && (
                      <p className="text-red-500 text-sm">{errors.purchase_date.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Catatan</Label>
                  <Textarea
                    {...register('note')}
                    placeholder="Catatan tambahan (opsional)"
                    rows={2}
                    disabled={isTransactionLocked}
                  />
                </div>
              </div>

              {/* Books Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="font-semibold text-slate-900">Items Buku</h3>
                  {!isTransactionLocked && (
                    <Button
                      type="button"
                      onClick={() => setShowBookDialog(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Pilih Buku
                    </Button>
                  )}
                </div>

                {selectedBooks.length === 0 ? (
                  <div className="text-center py-8 border rounded bg-slate-50">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Belum ada buku dipilih</p>
                    {!isTransactionLocked && (
                      <p className="text-slate-400 text-xs mt-1">Klik "Pilih Buku" untuk menambah</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Jenis</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Bidang Studi</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Jenjang</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Kelas</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Kurikulum</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Merk</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold text-right">Harga Jual</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold">Harga Beli</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold text-center">Qty</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold text-right">Subtotal</TableHead>
                          {!isTransactionLocked && <TableHead className="p-2 h-auto text-xs w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBooks.map((item) => (
                          <TableRow key={item.book_id}>
                            <TableCell className="p-2 text-xs">
                              <div title={item.book.jenis_buku ? item.book.jenis_buku.name : ''}>
                                {item.book.jenis_buku ? item.book.jenis_buku.code : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-xs">
                              <div className="font-medium truncate max-w-[150px]" title={item.book.bidang_studi ? item.book.bidang_studi.name : ''}>
                                {item.book.bidang_studi ? item.book.bidang_studi.name : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-xs">
                              <div title={item.book.jenjang_studi ? item.book.jenjang_studi.name : ''}>
                                {item.book.jenjang_studi ? item.book.jenjang_studi.code : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-xs">
                              {item.book.kelas}
                            </TableCell>
                            <TableCell className="p-2 text-xs">
                              <div className="uppercase truncate max-w-[100px]" title={item.book.curriculum ? item.book.curriculum.name : ''}>
                                {item.book.curriculum ? item.book.curriculum.name : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-xs">
                              <div title={item.book.merk_buku ? item.book.merk_buku.name : ''}>
                                {item.book.merk_buku ? item.book.merk_buku.code : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-xs text-right">{formatRupiah(item.book.price)}</TableCell>
                            <TableCell className="p-2 text-xs">
                              {isTransactionLocked ? (
                                <span className="text-purple-600 font-medium">{formatRupiah(item.price)}</span>
                              ) : (
                                <CurrencyInput
                                  value={item.price}
                                  onChange={(value) => handlePriceChange(item.book_id, value)}
                                  className="w-28 text-xs h-6"
                                />
                              )}
                            </TableCell>
                            <TableCell className="p-2 text-xs text-center">
                              {isTransactionLocked ? (
                                <span>{item.quantity}</span>
                              ) : (
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.book_id, parseInt(e.target.value) || 1)}
                                  className="w-16 h-6 text-center p-1 text-xs"
                                  min="1"
                                />
                              )}
                            </TableCell>
                            <TableCell className="p-2 text-xs text-right font-medium">
                              {formatRupiah(item.price * item.quantity)}
                            </TableCell>
                            {!isTransactionLocked && (
                              <TableCell className="p-2 text-xs">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveBook(item.book_id)}
                                  className="text-red-500 hover:text-red-700 h-6 w-6"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Transaction Summary */}
              <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-semibold text-slate-900">Ringkasan Transaksi</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Jumlah jenis:</span>
                    <span className="font-medium">{totalJenis} jenis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Buku:</span>
                    <span className="font-medium">{totalQuantity} buku</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-200">
                    <span className="font-bold text-slate-900">TOTAL PEMBELIAN:</span>
                    <span className="font-bold text-purple-600">{formatRupiah(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClosing}>
                Tutup
              </Button>
              {!isTransactionLocked && (
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Book Selection Dialog */}
      <PurchaseBookSelectionDialog
        isOpen={showBookDialog}
        onClose={() => setShowBookDialog(false)}
        onConfirm={handleBookConfirm}
        currentSelectedBooks={selectedBooks}
      />
    </>
  );
};

export default AddEditPurchaseTransactionDialog;
