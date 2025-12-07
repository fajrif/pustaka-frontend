import toast from 'react-hot-toast';

export const useToast = () => {
  return {
    toast: ({ title, description, variant = 'default' }) => {
      const message = description || title;

      if (variant === 'success') {
        toast.success(message, {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      } else if (variant === 'destructive') {
        toast.error(message, {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      } else {
        toast(message, {
          duration: 3000,
          style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    },
  };
};
