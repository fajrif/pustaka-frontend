/**
 * Get full asset URL by concatenating base URL with relative path
 * @param {string} assetUrl - Relative asset URL path
 * @returns {string} Full asset URL
 */
export const getAssetUrl = (assetUrl) => {
  if (!assetUrl) return '';

  // If URL is already absolute, return as is
  if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
    return assetUrl;
  }

  const baseUrl = import.meta.env.VITE_ASSET_BASE_URL || '';

  // Remove leading slash from assetUrl if present
  const cleanAssetUrl = assetUrl.startsWith('/') ? assetUrl.substring(1) : assetUrl;

  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBaseUrl}/${cleanAssetUrl}`;
};

/**
 * Validate image file (JPEG/PNG, max 5MB)
 * @param {File} file - File to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  if (!file) return { valid: true, error: null };

  const validTypes = ['image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File harus berupa JPEG atau PNG.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File tidak boleh lebih dari 5MB.'
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate PDF file (max 10MB)
 * @param {File} file - File to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validatePdfFile = (file) => {
  if (!file) return { valid: true, error: null };

  const validTypes = ['application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File harus berupa PDF.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File tidak boleh lebih dari 10MB.'
    };
  }

  return { valid: true, error: null };
};

/**
 * Extract filename from URL
 * @param {string} url - URL to extract filename from
 * @returns {string} Filename
 */
export const getFilenameFromUrl = (url) => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1];
};
