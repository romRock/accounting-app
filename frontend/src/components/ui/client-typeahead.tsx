'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './input';
import { Label } from './label';

interface Client {
  id: string;
  name: string;
  mobileNumber: string;
  city: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientTypeaheadProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, client?: Client) => void;
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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync searchTerm with value prop when it changes (for edit functionality)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Fetch clients with debounce
  const fetchClients = useCallback(async (query: string) => {
    console.log("fetchClients called with query:", query);
    setLoading(true);
    try {
      const { transactionApi } = await import('@/lib/transactions');
      console.log("Calling transactionApi.getClients");
      const clients = await transactionApi.getClients();
      console.log("API returned clients:", clients.length);
      
      // Filter clients based on search query
      const filteredClients = query.trim() 
        ? clients.filter(client => 
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.mobileNumber.includes(query) ||
            client.city.toLowerCase().includes(query.toLowerCase())
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
  const handleClientSelect = (client: Client) => {
    setSearchTerm(client.name);
    onChange(client.name, client);
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
    console.log("=== CLIENT TYPEAHEAD DEBUG ===");
    console.log("Input focused");
    console.log("Current search term:", searchTerm);
    console.log("Setting isOpen to true");
    
    // Always show dropdown on focus, even if empty
    setIsOpen(true);
    
    // Fetch all clients if search term is empty
    if (!searchTerm.trim()) {
      console.log("Fetching all clients (empty search)");
      fetchClients('');
    } else {
      console.log("Fetching clients with term:", searchTerm);
      fetchClients(searchTerm);
    }
  };

  // Debug dropdown state changes
  useEffect(() => {
    console.log("=== CLIENT DROPDOWN STATE DEBUG ===");
    console.log("isOpen:", isOpen);
    console.log("loading:", loading);
    console.log("results.length:", results.length);
    console.log("searchTerm:", searchTerm);
  }, [isOpen, loading, results.length, searchTerm]);

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
    <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
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
          className={`w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-sm ${className}`}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ zIndex: 999999 }}>
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
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {highlightMatch(client.name, searchTerm)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {client.mobileNumber} • {client.city}
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
