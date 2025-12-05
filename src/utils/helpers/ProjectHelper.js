/**
 * Determines the Tailwind CSS classes for a given status.
 * @param {'active' | 'Non Aktif' | 'pending'} status
 * @returns {string}
 */
export const getStatusColor = (status) => {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    'Non Aktif': 'bg-slate-100 text-slate-800',
  };
  return colors[status] || colors['Non Aktif'];
};

export const getColorClasses = (color) => {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    green: "from-green-500 to-green-600 shadow-green-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
    orange: "from-orange-500 to-orange-600 shadow-orange-200",
    red: "from-red-500 to-red-600 shadow-red-200",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200"
  };
  return colors[color] || colors.blue;
};
