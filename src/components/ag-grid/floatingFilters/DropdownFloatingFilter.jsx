import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, X, Loader2 } from 'lucide-react';
import { api } from '@/api/axios';

/**
 * DropdownFloatingFilter - A custom AG Grid floating filter that renders a dropdown
 * to select from master data options for filtering.
 * 
 * Usage with API endpoint:
 * {
 *   floatingFilterComponent: DropdownFloatingFilter,
 *   floatingFilterComponentParams: {
 *     apiEndpoint: '/jenis-buku',  // API endpoint to fetch options
 *     dataKey: 'jenis_buku',       // Key in API response containing the array
 *     labelFormatter: (item) => `[${item.code}] ${item.name}`, // Format label
 *     valueKey: 'code',            // Field to use as value
 *     placeholder: 'Semua',
 *   },
 * }
 * 
 * Usage with static options:
 * {
 *   floatingFilterComponent: DropdownFloatingFilter,
 *   floatingFilterComponentParams: {
 *     staticOptions: [
 *       { value: 'T', label: 'Tunai' },
 *       { value: 'K', label: 'Kredit' }
 *     ],
 *     placeholder: 'Semua',
 *   },
 * }
 */
const DropdownFloatingFilter = forwardRef((props, ref) => {
    const {
        apiEndpoint,
        dataKey,
        labelFormatter = (item) => item.name,
        valueKey = 'code',
        placeholder = 'Semua',
        staticOptions // New parameter for static options
    } = props;
    const [selectedValue, setSelectedValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    // Initialize static options if provided
    useEffect(() => {
        if (staticOptions && staticOptions.length > 0) {
            setOptions(staticOptions);
            setHasLoaded(true);
        }
    }, [staticOptions]);

    // Fetch options from API when dropdown is first opened
    const loadOptions = async () => {
        if (hasLoaded || isLoading || !apiEndpoint) return;

        setIsLoading(true);
        try {
            const response = await api.get(`${apiEndpoint}?all=true`);
            const data = response.data;
            const items = data[dataKey] || [];

            const formattedOptions = items.map(item => ({
                value: item[valueKey],
                label: labelFormatter(item),
            }));

            setOptions(formattedOptions);
            setHasLoaded(true);
        } catch (error) {
            console.error(`Failed to load options from ${apiEndpoint}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load options when dropdown opens
    useEffect(() => {
        if (isOpen && !hasLoaded) {
            loadOptions();
        }
    }, [isOpen, hasLoaded]);

    // Calculate dropdown position when opening
    // Using viewport coordinates since we use position: fixed
    const updateDropdownPosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // getBoundingClientRect returns viewport-relative coordinates
            // No need to add scroll offset when using position: fixed
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 180),
            });
        }
    };

    // Update position when dropdown opens
    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
        }
    }, [isOpen]);

    // Expose methods required by AG Grid floating filter interface
    useImperativeHandle(ref, () => ({
        // Called when AG Grid wants to get the current filter model
        onParentModelChanged(parentModel) {
            // When parent filter model changes, update our displayed value
            if (!parentModel) {
                setSelectedValue('');
            } else if (parentModel.filter) {
                setSelectedValue(parentModel.filter);
            }
        },
        // Optional: called when AG Grid needs to know if filter is active
        getModelAsString() {
            if (!selectedValue) return '';
            const option = options.find(o => o.value === selectedValue);
            return option ? option.label : selectedValue;
        },
    }));

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both the container and the dropdown portal
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);

            if (isOutsideContainer && isOutsideDropdown) {
                setIsOpen(false);
            }
        };

        // Handle scroll - close dropdown only when scrolling OUTSIDE the dropdown
        const handleScroll = (event) => {
            // Don't close if scrolling inside the dropdown menu itself
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
                return;
            }
            // Close dropdown when scrolling elsewhere on the page
            if (isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const handleSelect = (value) => {
        setSelectedValue(value);
        setIsOpen(false);

        // Update parent filter model
        if (value === '') {
            // Clear filter
            props.parentFilterInstance((instance) => {
                instance.onFloatingFilterChanged(null, null);
            });
        } else {
            // Apply filter with 'equals' type for exact match
            props.parentFilterInstance((instance) => {
                instance.onFloatingFilterChanged('equals', value);
            });
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        handleSelect('');
    };

    // Get selected option label for display
    const selectedOption = options.find(o => o.value === selectedValue);
    const displayLabel = selectedOption ? selectedOption.label : '';

    // Dropdown menu rendered via portal
    const dropdownMenu = isOpen ? ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            className="fixed z-[9999] max-h-48 overflow-auto bg-white border border-gray-200 rounded shadow-lg"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                minWidth: dropdownPosition.width,
            }}
        >
            {/* "All" option to clear filter */}
            <div
                onClick={() => handleSelect('')}
                className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-blue-50 ${selectedValue === '' ? 'bg-blue-100 font-medium' : ''}`}
            >
                {placeholder}
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="px-2 py-2 text-xs text-gray-400 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                </div>
            )}

            {/* Options */}
            {!isLoading && options.map((option) => (
                <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-blue-50 ${selectedValue === option.value ? 'bg-blue-100 font-medium' : ''}`}
                >
                    {option.label}
                </div>
            ))}

            {!isLoading && options.length === 0 && hasLoaded && (
                <div className="px-2 py-1.5 text-xs text-gray-400 italic">
                    No options available
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div ref={containerRef} className="ag-floating-filter-full-body relative w-full h-full">
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-full px-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                style={{ minHeight: '24px', maxHeight: '26px' }}
            >
                <span className={`truncate ${!displayLabel ? 'text-gray-400' : 'text-gray-800'}`}>
                    {displayLabel || placeholder}
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                    {selectedValue && (
                        <X
                            className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronDown
                        className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown rendered via portal */}
            {dropdownMenu}
        </div>
    );
});

DropdownFloatingFilter.displayName = 'DropdownFloatingFilter';

export default DropdownFloatingFilter;
