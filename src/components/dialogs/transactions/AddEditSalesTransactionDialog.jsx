import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { salesTransactionSchema } from '@/utils/validations/SalesTransaction';
import { Edit, Plus, Trash2, Package, Truck, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/utils/formatters';
import Select from '@/components/ui/select';
import BookSelectionDialog from './BookSelectionDialog';
import AddPaymentDialog from './AddPaymentDialog';
import AddEditShippingDialog from './AddEditShippingDialog';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PercentageInput } from '@/components/ui/PercentageInput';

const AddEditSalesTransactionDialog = ({ isOpen, onClose, transactionId, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Dialog states for sub-resources
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [editingShipping, setEditingShipping] = useState(null);
  const [generalPromotion, setGeneralPromotion] = useState(0);
  const [generalDiscount, setGeneralDiscount] = useState(0);

  const initialData = {
    sales_associate_id: '',
    payment_type: 'T',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 0,
  };

  // Fetch sales associates
  const { data: salesAssociatesData = { sales_associates: [] } } = useQuery({
    queryKey: ['salesAssociates', 'all'],
    queryFn: async () => {
      const response = await api.get('/sales-associates?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch transaction details
  const { data: transactionDetail } = useQuery({
    queryKey: ['salesTransaction', transactionId],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${transactionId}`);
      // Handle the API structure which returns { transaction: ... } or { sales_transaction: ... }
      return response.data?.transaction || response.data?.sales_transaction || null;
    },
    enabled: isOpen && !!transactionId,
  });

  // Fetch shippings separately
  const { data: shippingsData } = useQuery({
    queryKey: ['shippings', transactionId],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${transactionId}/shippings`);
      return response.data;
    },
    enabled: isOpen && !!transactionId,
  });

  // Fetch payments separately
  const { data: paymentsData } = useQuery({
    queryKey: ['payments', transactionId],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${transactionId}/payments`);
      return response.data;
    },
    enabled: isOpen && !!transactionId,
  });

  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(salesTransactionSchema),
    defaultValues: initialData
  });

  const paymentType = watch('payment_type');
  const currentStatus = watch('status');

  // Determine if items can be edited
  // If transactionId is present, we are editing. Check fetched status.
  // If not editing, we can always edit items.
  const isEditing = !!transactionId;
  const canEditItems = !isEditing || (isEditing && currentStatus === 0);

  // Lock modifications if status is Lunas (1)
  const isTransactionLocked = isEditing && transactionDetail?.status === 1;

  // Sync form with fetched data
  useEffect(() => {
    if (transactionId && transactionDetail) {
      const formattedData = {
        ...transactionDetail,
        transaction_date: transactionDetail.transaction_date ? format(parseISO(transactionDetail.transaction_date), 'yyyy-MM-dd') : '',
        due_date: transactionDetail.due_date ? format(parseISO(transactionDetail.due_date), 'yyyy-MM-dd') : '',
      };

      reset(formattedData);

      // Set selected books from items
      if (transactionDetail.items && transactionDetail.items.length > 0) {
        const books = transactionDetail.items.map(item => ({
          book_id: item.book_id,
          book: item.book,
          quantity: item.quantity,
          promotion: item.promotion || 0,
          discount: item.discount || 0
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
      setEditingShipping(null);
    }
  }, [isOpen]);

  // Use fresh details if available
  const currentShippings = shippingsData?.shippings || transactionDetail?.shippings || [];
  const currentPayments = paymentsData?.payments || transactionDetail?.payments || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/sales-transactions', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaksi berhasil dibuat.",
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/sales-transactions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaksi berhasil diperbarui.",
        variant: "success",
      });
      queryClient.invalidateQueries(['salesTransactions']);
      queryClient.invalidateQueries(['salesTransaction', transactionId]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui transaksi.",
        variant: "destructive",
      });
    }
  });

  // Delete Shipping Mutation
  const deleteShippingMutation = useMutation({
    mutationFn: async (shippingId) => {
      await api.delete(`/sales-transactions/${transactionId}/shippings/${shippingId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pengiriman berhasil dihapus", variant: "success" });
      queryClient.invalidateQueries(['salesTransaction', transactionId]);
      queryClient.invalidateQueries(['shippings', transactionId]);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.response?.data?.error || "Gagal menghapus pengiriman", variant: "destructive" });
    }
  });

  // Delete Payment Mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId) => {
      await api.delete(`/sales-transactions/${transactionId}/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pembayaran berhasil dihapus", variant: "success" });
      queryClient.invalidateQueries(['salesTransaction', transactionId]);
      queryClient.invalidateQueries(['payments', transactionId]);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.response?.data?.error || "Gagal menghapus pembayaran", variant: "destructive" });
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
    // Get default discount from selected sales associate
    const salesAssociateId = watch('sales_associate_id');
    const selectedSA = salesAssociatesData.sales_associates?.find(sa => sa.id === salesAssociateId);
    const defaultDiscount = selectedSA?.discount || 0;

    // Initialize books with default values
    const booksWithDefaults = books.map(book => ({
      ...book,
      promotion: book.promotion || 0,
      discount: book.book.jenis_buku?.code === 'LKS' ? defaultDiscount : 0
    }));

    setSelectedBooks(booksWithDefaults);
    setShowBookDialog(false);

    // Update general discount display
    if (defaultDiscount > 0) {
      setGeneralDiscount(defaultDiscount);
    }
  };

  const handleQuantityChange = (bookId, newQuantity) => {
    setSelectedBooks(prev => prev.map(item => {
      if (item.book_id === bookId) {
        const quantity = Math.max(1, Math.min(newQuantity, item.book.stock));
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const handleRemoveBook = (bookId) => {
    setSelectedBooks(prev => prev.filter(item => item.book_id !== bookId));
  };

  /**
   * Calculate effective price after promotion and discount
   * Formula: _price = price - promotion; _price = _price - (_price * discount / 100)
   */
  const calculateEffectivePrice = (price, promotion = 0, discount = 0) => {
    // Step 1: Deduct flat promotion amount
    let effectivePrice = price - (promotion || 0);

    // Step 2: Apply percentage discount
    effectivePrice = effectivePrice - (effectivePrice * (discount || 0) / 100);

    // Ensure non-negative
    return Math.max(0, effectivePrice);
  };

  /**
   * Calculate subtotal for an item
   */
  const calculateItemSubtotal = (item) => {
    const effectivePrice = calculateEffectivePrice(
      item.book.price,
      item.promotion || 0,
      item.discount || 0
    );
    return effectivePrice * item.quantity;
  };

  const handleGeneralPromotionChange = (value) => {
    setGeneralPromotion(value);

    // Apply to all LKS items
    setSelectedBooks(prev => prev.map(item => {
      if (item.book.jenis_buku?.code === 'LKS') {
        return {
          ...item,
          promotion: Math.min(value, item.book.price) // Cap at book price
        };
      }
      return item;
    }));
  };

  const handleGeneralDiscountChange = (value) => {
    setGeneralDiscount(value);

    // Apply to all LKS items
    setSelectedBooks(prev => prev.map(item => {
      if (item.book.jenis_buku?.code === 'LKS') {
        return { ...item, discount: value };
      }
      return item;
    }));
  };

  const handlePromotionChange = (bookId, newPromotion) => {
    setSelectedBooks(prev => prev.map(item => {
      if (item.book_id === bookId) {
        // Cap promotion at book price
        const cappedPromotion = Math.min(newPromotion, item.book.price);
        return { ...item, promotion: cappedPromotion };
      }
      return item;
    }));
  };

  const handleDiscountChange = (bookId, newDiscount) => {
    setSelectedBooks(prev => prev.map(item => {
      if (item.book_id === bookId) {
        return { ...item, discount: newDiscount };
      }
      return item;
    }));
  };

  const calculateSummary = () => {
    const totalQuantity = selectedBooks.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);

    const booksSubtotal = selectedBooks.reduce((sum, item) => {
      return sum + calculateItemSubtotal(item);
    }, 0);

    // Sum up shippings
    const shippingsTotal = currentShippings.reduce((sum, s) => sum + s.total_amount, 0);

    const totalAmount = booksSubtotal + shippingsTotal;

    return { totalQuantity, booksSubtotal, shippingsTotal, totalAmount };
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

    // Validate due date for credit
    if (data.payment_type === 'K') {
      if (!data.due_date) {
        toast({
          title: "Error",
          description: "Due date wajib diisi untuk transaksi kredit",
          variant: "destructive",
        });
        return;
      }

      if (new Date(data.due_date) <= new Date(data.transaction_date)) {
        toast({
          title: "Error",
          description: "Due date harus setelah tanggal transaksi",
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare payload
    const payload = {
      ...data,
      due_date: data.payment_type === 'K' ? data.due_date : null,
      items: selectedBooks.map(book => ({
        book_id: book.book_id,
        quantity: book.quantity,
        promotion: book.promotion || 0,
        discount: book.discount || 0
      }))
    };

    if (isEditing) {
      updateMutation.mutate({ id: transactionId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const { totalQuantity, booksSubtotal, shippingsTotal, totalAmount } = calculateSummary();

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    if (!isEditing) return 0; // For new transactions, remaining balance is 0 initially
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
    return totalAmount - totalPaid;
  };

  const remainingBalance = calculateRemainingBalance();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClosing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-700">
              {isEditing ? 'Edit Transaksi Penjualan' : 'Tambah Transaksi Penjualan Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <div className="space-y-6 py-4">
              {/* Transaction Information */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2 text-slate-900">Informasi Transaksi</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 border-l-2 border-blue-400 pl-3">
                    <Label className="text-slate-700">Sales Associate <span className="text-red-500">*</span></Label>
                    <Controller
                      name="sales_associate_id"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          options={salesAssociatesData.sales_associates.map(sa => ({
                            value: sa.id,
                            label: `[${sa.code}] ${sa.name}`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih Sales Associate"
                          searchable={true}
                        />
                      )}
                    />
                    {errors.sales_associate_id && (
                      <p className="text-red-500 text-sm">{errors.sales_associate_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 border-l-2 border-blue-400 pl-3">
                    <Label className="text-slate-700">Jenis Pembayaran <span className="text-red-500">*</span></Label>
                    <div className="flex gap-4 items-center pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="T"
                          {...register('payment_type')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Tunai</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="K"
                          {...register('payment_type')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Kredit</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 border-l-2 border-blue-400 pl-3">
                    <Label className="text-slate-700">Transaction Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register('transaction_date')}
                    />
                    {errors.transaction_date && (
                      <p className="text-red-500 text-sm">{errors.transaction_date.message}</p>
                    )}
                  </div>

                  {paymentType === 'K' && (
                    <div className="space-y-2 border-l-2 border-blue-400 pl-3">
                      <Label className="text-slate-700">Due Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        {...register('due_date')}
                      />
                      {errors.due_date && (
                        <p className="text-red-500 text-sm">{errors.due_date.message}</p>
                      )}
                    </div>
                  )}

                  {/* Status field - only in edit mode */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label className="text-slate-700">Status</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            options={[
                              { value: 0, label: 'Pesanan' },
                              { value: 1, label: 'Lunas' },
                              { value: 2, label: 'Angsuran' }
                            ]}
                            value={value}
                            onChange={onChange} // We need to convert string to number if select returns string, but Select component usually handles this
                            placeholder="Pilih Status"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Books Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="font-semibold text-slate-900">Items</h3>
                  {canEditItems ? (
                    <Button
                      type="button"
                      onClick={() => setShowBookDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Pilih Buku
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <span>Items terkunci (status sudah dibayar)</span>
                    </div>
                  )}
                </div>

                {/* General Discount/Promotion Section - Only for Cash & LKS items */}
                {paymentType === 'T' && selectedBooks.some(item => item.book.jenis_buku?.code === 'LKS') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">
                      Terapkan Diskon/Promosi untuk Semua LKS
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-700">Promosi Umum (Rp)</Label>
                        <CurrencyInput
                          value={generalPromotion}
                          onChange={(val) => handleGeneralPromotionChange(val)}
                          placeholder="Rp 0"
                          className="h-8 text-xs"
                        />
                        <p className="text-xs text-slate-500">Potongan harga langsung</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-700">Diskon Umum (%)</Label>
                        <PercentageInput
                          value={generalDiscount}
                          onChange={(val) => handleGeneralDiscountChange(val)}
                          placeholder="0%"
                          className="h-8 text-xs"
                        />
                        <p className="text-xs text-slate-500">Persentase diskon setelah promosi</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-3 flex items-start gap-2">
                      <span className="mt-0.5">💡</span>
                      <span>Nilai ini akan diterapkan ke semua item LKS. Anda masih bisa mengubah nilai per item di tabel.</span>
                    </p>
                  </div>
                )}

                {selectedBooks.length === 0 ? (
                  <div className="text-center py-8 border rounded bg-slate-50">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Belum ada buku dipilih</p>
                    {canEditItems && (
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
                          <TableHead className="p-2 h-auto text-xs font-semibold text-right">Harga</TableHead>
                          {paymentType === 'T' && selectedBooks.some(item => item.book.jenis_buku?.code === 'LKS') && (
                            <>
                              <TableHead className="p-2 h-auto text-xs font-semibold text-right">Promosi</TableHead>
                              <TableHead className="p-2 h-auto text-xs font-semibold text-right">Diskon</TableHead>
                            </>
                          )}
                          <TableHead className="p-2 h-auto text-xs font-semibold text-center">Qty</TableHead>
                          <TableHead className="p-2 h-auto text-xs font-semibold text-right">Subtotal</TableHead>
                          {canEditItems && <TableHead className="p-2 h-auto text-xs w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBooks.map((item) => {
                          const isLKS = item.book.jenis_buku?.code === 'LKS';
                          const showDiscountFields = paymentType === 'T' && selectedBooks.some(b => b.book.jenis_buku?.code === 'LKS');

                          return (
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

                              {/* Promotion and Discount columns - conditional */}
                              {showDiscountFields && (
                                <>
                                  <TableCell className="p-2 text-xs text-right">
                                    {isLKS && canEditItems ? (
                                      <CurrencyInput
                                        value={item.promotion || 0}
                                        onChange={(val) => handlePromotionChange(item.book_id, val)}
                                        className="w-24 h-6 text-xs text-right"
                                        placeholder="Rp 0"
                                      />
                                    ) : isLKS ? (
                                      <span>{formatRupiah(item.promotion || 0)}</span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="p-2 text-xs text-right">
                                    {isLKS && canEditItems ? (
                                      <PercentageInput
                                        value={item.discount || 0}
                                        onChange={(val) => handleDiscountChange(item.book_id, val)}
                                        className="w-16 h-6 text-xs text-right"
                                        placeholder="0%"
                                      />
                                    ) : isLKS ? (
                                      <span>{item.discount || 0}%</span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                </>
                              )}

                              <TableCell className="p-2 text-xs text-center">
                                {!canEditItems ? (
                                  <span>{item.quantity}</span>
                                ) : (
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.book_id, parseInt(e.target.value) || 1)}
                                    className="w-16 h-6 text-center p-1 text-xs"
                                    min="1"
                                    max={item.book.stock}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="p-2 text-xs text-right font-medium">
                                {formatRupiah(calculateItemSubtotal(item))}
                              </TableCell>
                              {canEditItems && (
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Shippings Section - Only visible when editing existing transaction to allow management */}
              {isEditing && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-semibold text-slate-900">Pengiriman</h3>
                    {!isTransactionLocked && (
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingShipping(null);
                          setShowShippingDialog(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pengiriman
                      </Button>
                    )}
                  </div>

                  {!currentShippings.length ? (
                    <div className="text-center py-6 border rounded bg-slate-50">
                      <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 text-sm">Belum ada pengiriman</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ekspedisi</TableHead>
                            <TableHead>No. Resi</TableHead>
                            <TableHead className="text-right">Biaya</TableHead>
                            {!isTransactionLocked && <TableHead className="text-center w-[80px]">Action</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentShippings.map((shipping) => (
                            <TableRow key={shipping.id}>
                              <TableCell>{shipping.expedition?.name || '-'}</TableCell>
                              <TableCell><span className="font-mono text-sm">{shipping.no_resi}</span></TableCell>
                              <TableCell className="text-right">{formatRupiah(shipping.total_amount)}</TableCell>
                              {!isTransactionLocked && (
                                <TableCell>
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingShipping(shipping);
                                        setShowShippingDialog(true);
                                      }}
                                      className="h-7 w-7 text-blue-600"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm('Hapus pengiriman ini?')) deleteShippingMutation.mutate(shipping.id);
                                      }}
                                      className="h-7 w-7 text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Section - Only visible when editing */}
              {isEditing && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-semibold text-slate-900">Pembayaran</h3>
                    {(remainingBalance > 0 && !isTransactionLocked) && (
                      <Button
                        type="button"
                        onClick={() => setShowPaymentDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pembayaran
                      </Button>
                    )}
                  </div>

                  {!currentPayments.length ? (
                    <div className="text-center py-6 border rounded bg-slate-50">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 text-sm">Belum ada riwayat pembayaran</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Pembayaran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            {!isTransactionLocked && <TableHead className="w-[50px]"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell><span className="text-xs font-mono">{payment.no_payment}</span></TableCell>
                              <TableCell>{format(parseISO(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                              <TableCell><span className="text-sm text-slate-600">{payment.note || '-'}</span></TableCell>
                              <TableCell className="text-right font-medium">{formatRupiah(payment.amount)}</TableCell>
                              {!isTransactionLocked && (
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm('Hapus pembayaran ini?')) deletePaymentMutation.mutate(payment.id);
                                    }}
                                    className="h-7 w-7 text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Balance Summary */}
                  <div className="bg-slate-50 p-4 rounded border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm space-y-1">
                      <div className="text-slate-600">Total Tagihan: <span className="font-semibold text-slate-900">{formatRupiah(totalAmount)}</span></div>
                      <div className="text-slate-600">Total Terbayar: <span className="font-semibold text-green-600">{formatRupiah(totalAmount - remainingBalance)}</span></div>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-600 mr-2">Sisa Tagihan:</span>
                      <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatRupiah(remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Always show Transaction Summary */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-slate-900">{isEditing ? 'Ringkasan Transaksi' : 'Ringkasan Awal'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-medium">{totalQuantity} item</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal Buku:</span>
                    <span className="font-medium">{formatRupiah(booksSubtotal)}</span>
                  </div>
                  {isEditing && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Ongkir:</span>
                      <span className="font-medium">{formatRupiah(shippingsTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="font-bold text-slate-900">TOTAL:</span>
                    <span className="font-bold text-blue-600">{formatRupiah(totalAmount)}</span>
                  </div>
                  {!isEditing && (
                    <p className="text-xs text-slate-500 mt-2">*Biaya pengiriman dapat ditambahkan setelah transaksi dibuat.</p>
                  )}
                </div>
              </div>

            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClosing}>
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Book Selection Dialog */}
      <BookSelectionDialog
        isOpen={showBookDialog}
        onClose={() => setShowBookDialog(false)}
        onConfirm={handleBookConfirm}
        currentSelectedBooks={selectedBooks}
      />

      {/* Add Payment Dialog */}
      {isEditing && (
        <AddPaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          transactionId={transactionId}
          remainingAmount={remainingBalance}
          onSuccess={() => {
            queryClient.invalidateQueries(['salesTransaction', transactionId]);
            queryClient.invalidateQueries(['payments', transactionId]);
          }}
        />
      )}

      {/* Add/Edit Shipping Dialog */}
      {isEditing && (
        <AddEditShippingDialog
          isOpen={showShippingDialog}
          onClose={() => setShowShippingDialog(false)}
          transactionId={transactionId}
          editingShipping={editingShipping}
          onSuccess={() => {
            queryClient.invalidateQueries(['salesTransaction', transactionId]);
            queryClient.invalidateQueries(['shippings', transactionId]);
          }}
        />
      )}
    </>
  );
};

export default AddEditSalesTransactionDialog;
