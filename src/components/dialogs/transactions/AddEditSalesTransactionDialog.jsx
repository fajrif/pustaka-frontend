import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { salesTransactionSchema } from '@/utils/validations/SalesTransaction';
import { Edit, Plus, Trash2, Lock, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { formatRupiah, formatDate } from '@/utils/formatters';
import Select from '@/components/ui/select';
import BookSelectionDialog from './BookSelectionDialog';
import AddInstallmentDialog from './AddInstallmentDialog';

const AddEditSalesTransactionDialog = ({ isOpen, onClose, editingTransaction, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showExpedition, setShowExpedition] = useState(false);
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);

  const initialData = {
    sales_associate_id: '',
    expedition_id: '',
    payment_type: 'T',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    expedition_price: '0',
    status: 0,
  };

  const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(salesTransactionSchema),
    defaultValues: editingTransaction || initialData
  });

  const paymentType = watch('payment_type');
  const currentStatus = watch('status');

  // Determine if items/expedition can be edited
  const isViewMode = editingTransaction && !isEditMode;
  const canEditItems = !editingTransaction || (editingTransaction && currentStatus === 0);

  // Sync form with editing data
  useEffect(() => {
    if (editingTransaction) {
      const formattedData = {
        ...editingTransaction,
        transaction_date: editingTransaction.transaction_date ? format(parseISO(editingTransaction.transaction_date), 'yyyy-MM-dd') : '',
        due_date: editingTransaction.due_date ? format(parseISO(editingTransaction.due_date), 'yyyy-MM-dd') : '',
        expedition_price: editingTransaction.expedition_price?.toString() || '0',
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

      // Set expedition visibility
      if (editingTransaction.expedition_id) {
        setShowExpedition(true);
      }

      setIsEditMode(false);
    } else {
      setIsEditMode(true);
      setSelectedBooks([]);
      setShowExpedition(false);
    }
  }, [editingTransaction, reset]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setSelectedBooks([]);
      setShowExpedition(false);
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

  // Fetch expeditions
  const { data: expeditionsData = { expeditions: [] } } = useQuery({
    queryKey: ['expeditions', 'all'],
    queryFn: async () => {
      const response = await api.get('/expeditions?all=true');
      return response.data;
    },
    enabled: isOpen && showExpedition,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch transaction details with installments
  const { data: transactionDetail, refetch: refetchTransaction } = useQuery({
    queryKey: ['salesTransaction', editingTransaction?.id],
    queryFn: async () => {
      const response = await api.get(`/sales-transactions/${editingTransaction.id}`);
      return response.data.sales_transaction;
    },
    enabled: isOpen && !!editingTransaction,
  });

  // Use fresh transaction detail if available, otherwise use editingTransaction
  const displayTransaction = transactionDetail || editingTransaction;

  // Create mutation
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
    onSuccess: async (_, variables) => {
      toast({
        title: "Success",
        description: "Transaksi berhasil diperbarui.",
        variant: "success",
      });

      // Fetch fresh data directly from API (bypassing cache)
      try {
        const response = await api.get(`/sales-transactions/${variables.id}`);
        const freshData = response.data.sales_transaction;

        if (freshData) {
          // Update form with fresh data
          const formattedData = {
            ...freshData,
            transaction_date: freshData.transaction_date
              ? format(parseISO(freshData.transaction_date), 'yyyy-MM-dd')
              : '',
            due_date: freshData.due_date
              ? format(parseISO(freshData.due_date), 'yyyy-MM-dd')
              : '',
            expedition_price: freshData.expedition_price?.toString() || '0',
          };
          reset(formattedData);

          // Update selected books from fresh items
          if (freshData.items && freshData.items.length > 0) {
            const books = freshData.items.map(item => ({
              book_id: item.book_id,
              book: item.book,
              quantity: item.quantity
            }));
            setSelectedBooks(books);
          }

          // Update expedition visibility
          setShowExpedition(!!freshData.expedition_id);
        }
      } catch (error) {
        console.error('Failed to fetch fresh data:', error);
      }

      // Invalidate queries to refresh cached data
      // queryClient.invalidateQueries(['salesTransaction', variables.id]);
      queryClient.invalidateQueries(['salesTransactions']);
      setIsEditMode(false);
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
    setShowExpedition(false);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    setSelectedBooks([]);
    setShowExpedition(false);
    setIsEditMode(false);
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

    const expeditionPrice = parseFloat(watch('expedition_price')) || 0;
    const totalAmount = booksSubtotal + expeditionPrice;

    return { booksSubtotal, expeditionPrice, totalAmount };
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
      expedition_id: showExpedition && data.expedition_id ? data.expedition_id : null,
      due_date: data.payment_type === 'K' ? data.due_date : null,
      expedition_price: showExpedition ? parseInt(data.expedition_price) : 0,
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

  const { booksSubtotal, expeditionPrice, totalAmount } = calculateSummary();

  // Calculate remaining balance for credit transactions
  const calculateRemainingBalance = () => {
    if (!transactionDetail || !transactionDetail.installments) return transactionDetail?.total_amount || 0;

    const totalPaid = transactionDetail.installments.reduce((sum, inst) => sum + inst.amount, 0);
    return transactionDetail.total_amount - totalPaid;
  };

  const remainingBalance = transactionDetail ? calculateRemainingBalance() : 0;
  const canAddInstallment = editingTransaction && currentStatus === 2 && paymentType === 'K';

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      0: { label: 'Booking', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      1: { label: 'Paid Off', className: 'bg-green-50 text-green-700 border-green-200' },
      2: { label: 'Installment', className: 'bg-blue-50 text-blue-700 border-blue-200' }
    };
    const { label, className } = config[status] || config[0];
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClosing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? (isViewMode ? 'Detail Transaksi' : 'Edit Transaksi') : 'Tambah Transaksi Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <div className="space-y-6 py-4">
              {/* Transaction Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Informasi Transaksi</h3>

                {isViewMode && displayTransaction?.no_invoice && (
                  <div className="space-y-2">
                    <Label>No Invoice</Label>
                    <div className="p-2 uppercase text-blue-700 border rounded">
                      {displayTransaction.no_invoice}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sales Associate *</Label>
                    {isViewMode ? (
                      <div className="p-2 border rounded">
                        <span className="text-sm">{displayTransaction?.sales_associate?.name || '-'}</span>
                      </div>
                    ) : (
                      <>
                        <Controller
                          name="sales_associate_id"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              options={salesAssociatesData.sales_associates.map(sa => ({
                                value: sa.id,
                                label: `[${ sa.code }] ${ sa.name }`
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
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Type *</Label>
                    {isViewMode ? (
                      <div className="p-2 border rounded">
                        <Badge variant="outline" className={displayTransaction?.payment_type === 'T' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                          {displayTransaction?.payment_type === 'T' ? 'Cash' : 'Credit'}
                        </Badge>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transaction Date *</Label>
                    {isViewMode ? (
                      <div className="p-2 border rounded">
                        <span className="text-sm">{formatDate(displayTransaction?.transaction_date)}</span>
                      </div>
                    ) : (
                      <>
                        <Input
                          type="date"
                          {...register('transaction_date')}
                        />
                        {errors.transaction_date && (
                          <p className="text-red-500 text-sm">{errors.transaction_date.message}</p>
                        )}
                      </>
                    )}
                  </div>

                  {paymentType === 'K' && (
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      {isViewMode ? (
                        <div className="p-2 border rounded">
                          <span className="text-sm">{displayTransaction?.due_date ? formatDate(displayTransaction.due_date) : '-'}</span>
                        </div>
                      ) : (
                        <>
                          <Input
                            type="date"
                            {...register('due_date')}
                          />
                          {errors.due_date && (
                            <p className="text-red-500 text-sm">{errors.due_date.message}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Status field - only in view/edit mode */}
                  {editingTransaction && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      {isViewMode ? (
                        <div className="p-2 border rounded">
                          <StatusBadge status={displayTransaction.status} />
                        </div>
                      ) : (
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
                              onChange={onChange}
                              placeholder="Pilih Status"
                            />
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Books Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="font-semibold text-slate-900">Items</h3>
                  {!isViewMode && canEditItems && (
                    <Button
                      type="button"
                      onClick={() => setShowBookDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Pilih Buku
                    </Button>
                  )}
                  {!canEditItems && !isViewMode && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Items terkunci (status != Booking)</span>
                    </div>
                  )}
                </div>

                {selectedBooks.length === 0 ? (
                  <div className="text-center py-8 border rounded bg-slate-50">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Belum ada buku dipilih</p>
                    {!isViewMode && canEditItems && (
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
                          {!isViewMode && canEditItems && <TableHead className="w-[50px]"></TableHead>}
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
                              {isViewMode || !canEditItems ? (
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
                            {!isViewMode && canEditItems && (
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

              {/* Expedition Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Ekspedisi (Optional)</h3>
                  {!isViewMode && canEditItems && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showExpedition}
                        onChange={(e) => {
                          setShowExpedition(e.target.checked);
                          if (!e.target.checked) {
                            setValue('expedition_id', '');
                            setValue('expedition_price', '0');
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">Tambah Ekspedisi</span>
                    </label>
                  )}
                  {!canEditItems && !isViewMode && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Terkunci</span>
                    </div>
                  )}
                </div>

                {(showExpedition || editingTransaction?.expedition_id) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ekspedisi</Label>
                      {isViewMode ? (
                        <div className="p-2 border rounded">
                          <span className="text-sm">{displayTransaction?.expedition?.name || '-'}</span>
                        </div>
                      ) : canEditItems ? (
                        <Controller
                          name="expedition_id"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              options={expeditionsData.expeditions.map(exp => ({
                                value: exp.id,
                                label: exp.name
                              }))}
                              value={value}
                              onChange={onChange}
                              placeholder="Pilih Ekspedisi"
                              searchable={true}
                              clearable={true}
                            />
                          )}
                        />
                      ) : (
                        <div className="p-2 border rounded bg-slate-100">
                          <span className="text-sm text-slate-600">{displayTransaction?.expedition?.name || '-'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Harga Ekspedisi</Label>
                      {isViewMode ? (
                        <div className="p-2 border rounded">
                          <span className="text-sm">{formatRupiah(displayTransaction?.expedition_price || 0)}</span>
                        </div>
                      ) : canEditItems ? (
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          {...register('expedition_price')}
                        />
                      ) : (
                        <div className="p-2 border rounded bg-slate-100">
                          <span className="text-sm text-slate-600">{formatRupiah(displayTransaction?.expedition_price || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-slate-900">Ringkasan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal Buku:</span>
                    <span className="font-medium">{formatRupiah(booksSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ekspedisi:</span>
                    <span className="font-medium">{formatRupiah(expeditionPrice)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="font-bold text-slate-900 text-lg">TOTAL:</span>
                    <span className="font-bold text-blue-600 text-lg">{formatRupiah(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Installment History - Credit only, View/Edit mode only */}
              {editingTransaction && paymentType === 'K' && transactionDetail && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-slate-900">Riwayat Cicilan</h3>
                    {canAddInstallment && (
                      <Button
                        type="button"
                        onClick={() => setShowInstallmentDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pembayaran
                      </Button>
                    )}
                  </div>

                  {transactionDetail.installments && transactionDetail.installments.length > 0 ? (
                    <>
                      <div className="overflow-x-auto border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead className="text-right">Jumlah</TableHead>
                              <TableHead>Catatan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactionDetail.installments.map((installment) => (
                              <TableRow key={installment.id}>
                                <TableCell>{formatDate(installment.installment_date)}</TableCell>
                                <TableCell className="text-right font-medium">{formatRupiah(installment.amount)}</TableCell>
                                <TableCell className="text-sm text-slate-600">{installment.note || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700">Total Dibayar:</span>
                          <span className="font-semibold text-blue-700">
                            {formatRupiah(transactionDetail.installments.reduce((sum, inst) => sum + inst.amount, 0))} / {formatRupiah(transactionDetail.total_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700">Sisa:</span>
                          <span className="font-bold text-red-600">{formatRupiah(remainingBalance)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 border rounded bg-slate-50">
                      <p className="text-slate-500 text-sm">Belum ada pembayaran cicilan</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              {isViewMode ? (
                <>
                  <Button type="button" variant="outline" onClick={onClosing}>
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditMode(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClosing}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BookSelectionDialog
        isOpen={showBookDialog}
        onClose={() => setShowBookDialog(false)}
        currentSelectedBooks={selectedBooks}
        onConfirm={handleBookConfirm}
      />

      {transactionDetail && (
        <AddInstallmentDialog
          isOpen={showInstallmentDialog}
          onClose={() => setShowInstallmentDialog(false)}
          transactionId={editingTransaction?.id}
          remainingBalance={remainingBalance}
          onFinish={() => {
            setShowInstallmentDialog(false);
            refetchTransaction();
            queryClient.invalidateQueries(['salesTransactions']);
          }}
        />
      )}
    </>
  );
};

export default AddEditSalesTransactionDialog;
