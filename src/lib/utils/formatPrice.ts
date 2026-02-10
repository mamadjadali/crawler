/**
 * Format price with Persian/Western numerals and currency
 * @param price - The price number to format
 * @param usePersianNumerals - Whether to use Persian numerals (default: false)
 * @returns Formatted price string with "تومان" suffix
 */
export function formatPrice(
  price: number | null | undefined,
  usePersianNumerals: boolean = false,
): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'قیمت نامشخص'
  }

  try {
    // Format number with thousand separators
    const formatted = new Intl.NumberFormat('fa-IR').format(price)

    // Convert to Persian numerals if requested
    if (usePersianNumerals) {
      const persianDigits: { [key: string]: string } = {
        '0': '۰',
        '1': '۱',
        '2': '۲',
        '3': '۳',
        '4': '۴',
        '5': '۵',
        '6': '۶',
        '7': '۷',
        '8': '۸',
        '9': '۹',
      }

      return formatted.replace(/\d/g, (digit) => persianDigits[digit] || digit) + ' تومان'
    }

    return formatted + ' تومان'
  } catch (error) {
    // Fallback to simple formatting if Intl is not available
    console.error('formatPrice error:', error)
    return price.toLocaleString() + ' تومان'
  }
}

export function formatPricev2(
  price: number | null | undefined,
  usePersianNumerals: boolean = false,
): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'قیمت نامشخص'
  }

  try {
    // Format number with thousand separators
    const formatted = new Intl.NumberFormat('fa-IR').format(price)

    // Convert to Persian numerals if requested
    if (usePersianNumerals) {
      const persianDigits: { [key: string]: string } = {
        '0': '۰',
        '1': '۱',
        '2': '۲',
        '3': '۳',
        '4': '۴',
        '5': '۵',
        '6': '۶',
        '7': '۷',
        '8': '۸',
        '9': '۹',
      }

      return formatted.replace(/\d/g, (digit) => persianDigits[digit] || digit)
    }

    return formatted
  } catch (error) {
    // Fallback to simple formatting if Intl is not available
    console.error('formatPrice error:', error)
    return price.toLocaleString()
  }
}

/**
 * Format date to Persian/Farsi format
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'نامشخص'

  try {
    const d = typeof date === 'string' ? new Date(date) : date

    if (isNaN(d.getTime())) return 'نامشخص'

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch (error) {
    // Fallback to simple date formatting
    console.error('formatPrice error:', error)
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return 'نامشخص'
    return d.toLocaleDateString('fa-IR')
  }
}
