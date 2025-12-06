/**
 * Determines the Tailwind CSS classes for a given status.
 * @param {'active' | 'Non Aktif' | 'pending'} status
 * @returns {string}
 */
export const getRoleColor = (role) => {
  const colors = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    operator: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    user: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return colors[role] || colors['operator'];
};
