import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Eye, FileText, Pencil, Trash2 } from 'lucide-react';

const SalesTransactionActionMenuCellRenderer = ({ data, onView, onInvoice, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const isPaid = data?.status === 1;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggle = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 4,
                left: rect.right - 160,
            });
        }

        setIsOpen(!isOpen);
    };

    const handleView = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        onView(data);
    };

    const handleInvoice = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        onInvoice(data);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        if (!isPaid) {
            onEdit(data);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        if (confirm('Yakin ingin menghapus transaksi ini? Stok akan dikembalikan otomatis.')) {
            onDelete(data);
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-1 rounded hover:bg-slate-200 transition-colors"
                type="button"
            >
                <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[9999] bg-white rounded-md shadow-lg border border-slate-200 py-1 min-w-[160px]"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                    >
                        <button
                            onClick={handleView}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            type="button"
                        >
                            <Eye className="w-4 h-4" />
                            Lihat Detail
                        </button>
                        <button
                            onClick={handleInvoice}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                            type="button"
                        >
                            <FileText className="w-4 h-4" />
                            Lihat Faktur
                        </button>
                        <button
                            onClick={handleEdit}
                            disabled={isPaid}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${isPaid
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                            type="button"
                            title={isPaid ? 'Transaksi Lunas tidak dapat diedit' : 'Edit Transaction'}
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            type="button"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default SalesTransactionActionMenuCellRenderer;
