'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Input } from './input';
import { Label } from './label';

export interface Client {
  id: string;
  name: string;
  mobileNumber?: string;
  city?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientTypeaheadProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, client?: Client | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClientTypeahead({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "Search client...", 
  disabled = false,
  className = ""
}: ClientTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync searchTerm with value prop when it changes (for edit functionality)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Fetch clients with debounce
  const fetchClients = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { transactionApi } = await import('@/lib/transactions');
      const clients = await transactionApi.getClients();
      const normalizedQuery = query.trim().toLowerCase();

      const filteredClients = normalizedQuery
        ? clients.filter(client =>
            client.name.toLowerCase().startsWith(normalizedQuery)
          )
        : clients;

      setResults(filteredClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
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
      fetchClients(searchTerm);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchClients]);

  // Keep keyboard-selected item visible inside the scrollable dropdown
  useEffect(() => {
    if (selectedIndex < 0) return;

    const dropdown = dropdownRef.current;
    const selectedItem = itemRefs.current[selectedIndex];
    if (!dropdown || !selectedItem) return;

    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = selectedItem.getBoundingClientRect();

    if (itemRect.bottom > dropdownRect.bottom) {
      dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom;
    } else if (itemRect.top < dropdownRect.top) {
      dropdown.scrollTop -= dropdownRect.top - itemRect.top;
    }
  }, [selectedIndex, results]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
    
    // Always show dropdown when typing, even if empty
    setIsOpen(true);
  };

  // Handle client selection
  const handleClientSelect = (client: Client | undefined) => {
    if (client) {
      setSearchTerm(client.name);
      onChange(client.name, client);
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length === 0) break;
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length === 0) break;
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleClientSelect(results[selectedIndex]);
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
    fetchClients(searchTerm);
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
    <>
      <div className="relative" ref={containerRef}>
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        <div className="relative">
          <Input
            id={id}
            ref={inputRef}
            type="text"
            name={`client-typeahead-${id}`}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore
            className={`w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-sm ${className}`}
          />
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown rendered via Portal to avoid stacking context issues */}
      {isOpen && createPortal(
        <div 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" 
          style={{ 
            top: dropdownPosition.top, 
            left: dropdownPosition.left, 
            width: dropdownPosition.width,
            zIndex: 99999 
          }}
          ref={dropdownRef}
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No clients found
            </div>
          ) : (
            <ul className="py-1">
              {results.map((client, index) => (
                <li
                  key={client.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="font-medium text-gray-900">
                    {highlightMatch(client.name, searchTerm)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
