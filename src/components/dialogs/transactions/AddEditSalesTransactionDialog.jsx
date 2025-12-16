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

const AddEditSalesTransactionDialog = ({ isOpen, onClose, editingTransaction, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Dialog states for sub-resources
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [editingShipping, setEditingShipping] = useState(null);

  const initialData = {
    sales_associate_id: '',
    payment_type: 'T',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 0,
  };

  const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(salesTransactionSchema),
    defaultValues: editingTransaction || initialData
  });

  const paymentType = watch('payment_type');
  const currentStatus = watch('status');

  // Determine if items can be edited
  const canEditItems = !editingTransaction || (editingTransaction && currentStatus === 0);

  // Lock modifications if status is Paid Off (1)
  // Prefer fresh transaction detail status if available, otherwise use editingTransaction status


  // Sync form with editing data
  useEffect(() => {
    if (editingTransaction) {
      const formattedData = {
        ...editingTransaction,
        transaction_date: editingTransaction.transaction_date ? format(parseISO(editingTransaction.transaction_date), 'yyyy-MM-dd') : '',
        due_date: editingTransaction.due_date ? format(parseISO(editingTransaction.due_date), 'yyyy-MM-dd') : '',
      };

      reset(formattedData);

      // Set selected books from items
      if (editingTransaction.items && editingTransaction.items.length > 0) {
        const books = editingTransaction.items.map(item => ({
          book_id: item.book_id,
          book: item.book,
          quantity: item.quantity
        }));
        setSelectedBooks(books);
      }
    } else {
      setSelectedBooks([]);
      reset(initialData);
    }
  }, [editingTransaction, reset]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBooks([]);
      setEditingShipping(null);
    }
  }, [isOpen]);

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

  // Fetch fresh transaction details including payments and shippings
  // This query is still useful for getting the latest sub-resource data
  const { data: transactionDetail } = useQuery({
    queryKey: ['salesTransaction', editingTransaction?.id],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${editingTransaction.id}`);
      return response.data.sales_transaction;
    },
    enabled: isOpen && !!editingTransaction,
  });

  // Fetch shippings separately
  const { data: shippingsData } = useQuery({
    queryKey: ['shippings', editingTransaction?.id],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${editingTransaction.id}/shippings`);
      return response.data;
    },
    enabled: isOpen && !!editingTransaction,
  });

  // Fetch payments separately
  const { data: paymentsData } = useQuery({
    queryKey: ['payments', editingTransaction?.id],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${editingTransaction.id}/payments`);
      return response.data;
    },
    enabled: isOpen && !!editingTransaction,
  });

  // Use fresh details if available
  const currentShippings = shippingsData?.shippings || editingTransaction?.shippings || [];
  const currentPayments = paymentsData?.payments || editingTransaction?.payments || [];

  // Lock modifications if status is Paid Off (1)
  // Prefer fresh transaction detail status if available, otherwise use editingTransaction status
  const isTransactionLocked = editingTransaction && (
    (transactionDetail?.status === 1) || (editingTransaction.status === 1)
  );
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
      queryClient.invalidateQueries(['salesTransaction', editingTransaction.id]);
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
      await api.delete(`/sales-transactions/${editingTransaction.id}/shippings/${shippingId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pengiriman berhasil dihapus", variant: "success" });
      queryClient.invalidateQueries(['salesTransaction', editingTransaction.id]);
      queryClient.invalidateQueries(['shippings', editingTransaction.id]);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.response?.data?.error || "Gagal menghapus pengiriman", variant: "destructive" });
    }
  });

  // Delete Payment Mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId) => {
      await api.delete(`/sales-transactions/${editingTransaction.id}/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pembayaran berhasil dihapus", variant: "success" });
      queryClient.invalidateQueries(['salesTransaction', editingTransaction.id]);
      queryClient.invalidateQueries(['payments', editingTransaction.id]);
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
    setSelectedBooks(books);
    setShowBookDialog(false);
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

  const calculateSummary = () => {
    const booksSubtotal = selectedBooks.reduce((sum, item) => {
      return sum + (item.book.price * item.quantity);
    }, 0);

    // Sum up shippings
    const shippingsTotal = currentShippings.reduce((sum, s) => sum + s.total_amount, 0);

    const totalAmount = booksSubtotal + shippingsTotal;

    return { booksSubtotal, shippingsTotal, totalAmount };
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
        quantity: book.quantity
      }))
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const { booksSubtotal, shippingsTotal, totalAmount } = calculateSummary();

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    if (!editingTransaction) return 0; // For new transactions, remaining balance is 0 initially
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
    return totalAmount - totalPaid;
  };

  const remainingBalance = calculateRemainingBalance();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClosing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
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
                    <Label className="text-slate-700">Payment Type <span className="text-red-500">*</span></Label>
                    <div className="flex gap-4 items-center pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="T"
                          {...register('payment_type')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="K"
                          {...register('payment_type')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Credit</span>
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
                  {editingTransaction && (
                    <div className="space-y-2">
                      <Label className="text-slate-700">Status</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            options={[
                              { value: 0, label: 'Booking' },
                              { value: 1, label: 'Paid Off' },
                              { value: 2, label: 'Installment' }
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
                      <span>Items terkunci (status != Booking)</span>
                    </div>
                  )}
                </div>

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
                          <TableHead>Nama Buku</TableHead>
                          <TableHead>Penerbit</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          {canEditItems && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBooks.map((item) => (
                          <TableRow key={item.book_id}>
                            <TableCell>
                              <span className="font-medium text-sm">{item.book.name}</span>
                            </TableCell>
                            <TableCell>{item.book.publisher?.name || '-'}</TableCell>
                            <TableCell>{item.book.jenis_buku?.name || '-'}</TableCell>
                            <TableCell className="text-right">{formatRupiah(item.book.price)}</TableCell>
                            <TableCell className="text-center">
                              {!canEditItems ? (
                                <span>{item.quantity}</span>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuantityChange(item.book_id, item.quantity - 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.book_id, parseInt(e.target.value) || 1)}
                                    className="w-16 h-7 text-center p-1"
                                    min="1"
                                    max={item.book.stock}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuantityChange(item.book_id, item.quantity + 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatRupiah(item.book.price * item.quantity)}
                            </TableCell>
                            {canEditItems && (
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveBook(item.book_id)}
                                  className="text-red-500 hover:text-red-700 h-7 w-7"
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
              </div>

              {/* Shippings Section - Only visible when editing existing transaction to allow management */}
              {editingTransaction && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-semibold text-slate-900">Pengiriman (Shippings)</h3>
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
              {editingTransaction && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-semibold text-slate-900">Pembayaran (Payments)</h3>
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
                            <TableHead>No. Payment</TableHead>
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
                    <div className="text-lg">
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
                <h3 className="font-semibold text-slate-900">{editingTransaction ? 'Ringkasan Transaksi' : 'Ringkasan Awal'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal Buku:</span>
                    <span className="font-medium">{formatRupiah(booksSubtotal)}</span>
                  </div>
                  {editingTransaction && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Ongkir:</span>
                      <span className="font-medium">{formatRupiah(shippingsTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="font-bold text-slate-900 text-lg">TOTAL:</span>
                    <span className="font-bold text-blue-600 text-lg">{formatRupiah(totalAmount)}</span>
                  </div>
                  {!editingTransaction && (
                    <p className="text-xs text-slate-500 mt-2">*Biaya pengiriman dapat ditambahkan setelah transaksi dibuat.</p>
                  )}
                </div>
              </div>

            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClosing}>
                Batal
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
      {editingTransaction && (
        <AddPaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          transactionId={editingTransaction.id}
          remainingAmount={remainingBalance}
          onSuccess={() => {
            queryClient.invalidateQueries(['salesTransaction', editingTransaction.id]);
            queryClient.invalidateQueries(['payments', editingTransaction.id]);
          }}
        />
      )}

      {/* Add/Edit Shipping Dialog */}
      {editingTransaction && (
        <AddEditShippingDialog
          isOpen={showShippingDialog}
          onClose={() => setShowShippingDialog(false)}
          transactionId={editingTransaction.id}
          editingShipping={editingShipping}
          onSuccess={() => {
            queryClient.invalidateQueries(['salesTransaction', editingTransaction.id]);
            queryClient.invalidateQueries(['shippings', editingTransaction.id]);
          }}
        />
      )}
    </>
  );
};

export default AddEditSalesTransactionDialog;
