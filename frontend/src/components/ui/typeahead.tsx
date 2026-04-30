'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
}

export function CityTypeahead({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "Search city...", 
  disabled = false,
  className = ""
}: TypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch cities with debounce
  const fetchCities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { transactionApi } = await import('@/lib/transactions');
      const cities = await transactionApi.searchCities(query, 20);
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
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchCities]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
    
    if (newValue.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setSearchTerm(city.name);
    onChange(city.name, city);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
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
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input focus
  const handleFocus = () => {
    if (searchTerm.trim()) {
      setIsOpen(true);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm ${className}`}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No cities found
            </div>
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
                    <div className="font-medium">
                      {highlightMatch(city.name, searchTerm)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {city.code} - {city.state}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
