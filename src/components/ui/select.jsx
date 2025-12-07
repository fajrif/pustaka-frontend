import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * Select Component - A searchable select component that works with react-hook-form
 *
 * @param {Object} props
 * @param {Array} props.options - Array of options [{value: string, label: string}]
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional classes
 * @param {boolean} props.error - Error state
 * @param {boolean} props.searchable - Enable search (default: true)
 * @param {boolean} props.clearable - Show clear button (default: true)
 * @param {string} props.emptyMessage - Message when no options (default: "No options available")
 */
const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  error = false,
  searchable = true,
  clearable = true,
  emptyMessage = 'No options available',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef(null)
  const searchInputRef = useRef(null)

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value)
  const selectedLabel = selectedOption?.label || ''

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [isOpen, searchable])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (isOpen) {
        setSearchTerm('')
      }
    }
  }

  const handleSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div ref={selectRef} className={cn('relative w-full', className)} {...props}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
      >
        <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
          {selectedLabel || placeholder}
        </span>

        <div className="flex items-center gap-1">
          {clearable && selectedLabel && !disabled && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search Input */}
          {searchable && (
            <div className="flex items-center border-b px-3 py-2 bg-background/50">
              <Search className="h-4 w-4 opacity-50 mr-2 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer transition-opacity ml-2 flex-shrink-0"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'transition-colors',
                    option.value === value && 'bg-accent/50 font-medium'
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <span className="ml-auto text-xs opacity-50">✓</span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? 'No results found.' : emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

Select.displayName = 'Select'

export default Select
