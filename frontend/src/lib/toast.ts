import toast, { Toaster } from 'react-hot-toast';

// Toast notification styles
const toastStyles = {
  success: {
    style: {
      background: '#10b981',
      color: 'white',
      fontWeight: 'bold',
    },
    duration: 3000,
    className: 'z-[99999999]', // Highest z-index to appear above all elements
  },
  update: {
    style: {
      background: '#3b82f6',
      color: 'white',
      fontWeight: 'bold',
    },
    duration: 3000,
    className: 'z-[99999999]', // Highest z-index to appear above all elements
  },
  delete: {
    style: {
      background: '#ef4444',
      color: 'white',
      fontWeight: 'bold',
    },
    duration: 3000,
    className: 'z-[99999999]', // Highest z-index to appear above all elements
  },
  error: {
    style: {
      background: '#dc2626',
      color: 'white',
      fontWeight: 'bold',
    },
    duration: 4000,
    className: 'z-[99999999]', // Highest z-index to appear above all elements
  }
};

// Toast notification functions
export const showSuccessToast = (message: string) => {
  toast.success(message, { ...toastStyles.success, className: toastStyles.success.className, position: 'bottom-right' });
};

export const showUpdateToast = (message: string) => {
  const updateToast = toast(message, { ...toastStyles.update, className: toastStyles.update.className, position: 'bottom-right' });
  return updateToast;
};

export const showDeleteToast = (message: string) => {
  toast(message, { ...toastStyles.delete, className: toastStyles.delete.className, position: 'bottom-right' });
};

export const showErrorToast = (message: string) => {
  toast(message, { ...toastStyles.error, className: toastStyles.error.className, position: 'bottom-right' });
};

// Toaster component for rendering notifications
export { Toaster };
