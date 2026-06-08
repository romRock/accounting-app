'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Input } from './input';
import { Label } from './label';
import { City } from '@/lib/transactions';

interface TypeaheadProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, city?: City) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  resetKey?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  usePortal?: boolean;
  dropdownZIndex?: number;
}

export function CityTypeahead({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "Search city...", 
  disabled = false,
  className = "",
  resetKey,
  inputRef,
  usePortal = false,
  dropdownZIndex = 9999,
}: TypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const localInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use external ref if provided, otherwise use internal ref
  const finalInputRef = inputRef || localInputRef;

  // Expose the input ref to parent component when inputRef is provided
  useEffect(() => {
    if (inputRef && localInputRef.current) {
      (inputRef as React.MutableRefObject<HTMLInputElement>).current = localInputRef.current;
    }
  }, [inputRef]);

  // Sync searchTerm with value prop when it changes (for edit functionality)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Reset internal state when resetKey prop changes
  useEffect(() => {
    if (resetKey) {
      setSearchTerm(''); // Force clear to empty string
      setResults([]);
      setSelectedIndex(-1);
      setIsOpen(false);
    }
  }, [resetKey]);

  // Fetch cities with debounce
  const fetchCities = useCallback(async (query: string) => {
    console.log("fetchCities called with query:", query);
    setLoading(true);
    try {
      const { transactionApi } = await import('@/lib/transactions');
      console.log("Calling transactionApi.searchCities");
      // If query is empty, fetch all cities (no limit), otherwise search with limit
      const cities = await transactionApi.searchCities(query, query.trim() ? 20 : undefined);
      console.log("API returned cities:", cities.length);
      setResults(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCities(searchTerm);
    }, 150); // Reduced from 300ms to 150ms for faster response

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchCities]);

  useEffect(() => {
    if (usePortal && isOpen && localInputRef.current) {
      const rect = localInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [usePortal, isOpen, searchTerm]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
    
    // Always show dropdown when typing, even if empty
    setIsOpen(true);
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setSearchTerm(city.name);
    onChange(city.id, city);
    setIsOpen(false);
    setSelectedIndex(-1);
    finalInputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleCitySelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        finalInputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setSelectedIndex(-1);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    if (!searchTerm.trim()) {
      fetchCities('');
    } else {
      fetchCities(searchTerm);
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-blue-100 text-blue-800 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const dropdownContent = (
    <div
      className={`${usePortal ? 'fixed' : 'absolute z-50 w-full mt-1'} bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
      style={
        usePortal
          ? {
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: dropdownZIndex,
            }
          : { zIndex: dropdownZIndex }
      }
      ref={dropdownRef}
    >
      {loading ? (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">Searching...</div>
      ) : results.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">No cities found</div>
      ) : (
        <ul className="py-1">
          {results.map((city, index) => (
            <li
              key={city.id}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleCitySelect(city)}
            >
              <div className="flex flex-col">
                <div className="font-medium text-gray-900">
                  {highlightMatch(city.name, searchTerm)}
                </div>
                <div className="text-xs text-gray-600">{city.state}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <Input
          id={id}
          ref={finalInputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-sm ${className}`}
        />

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {isOpen &&
        (usePortal && typeof document !== 'undefined'
          ? createPortal(dropdownContent, document.body)
          : dropdownContent)}
    </div>
  );
}
