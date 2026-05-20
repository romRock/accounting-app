'use client';

import React, { useEffect, useState } from 'react';

interface AccountingLoaderProps {
  message?: string;
}

export default function AccountingLoader({ message = 'Calculating...' }: AccountingLoaderProps) {
  const [displayNumber, setDisplayNumber] = useState('0');
  const [isCalculating, setIsCalculating] = useState(true);
  
  // Calculator-style animation
  useEffect(() => {
    if (!isCalculating) return;
    
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let index = 0;
    
    const interval = setInterval(() => {
      setDisplayNumber(numbers[index % 10]);
      index++;
    }, 100);
    
    return () => clearInterval(interval);
  }, [isCalculating]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Calculator Display */}
      <div className="relative">
        {/* Calculator Body */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border-4 border-gray-700">
          {/* Display Screen */}
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4 mb-4 shadow-inner border-2 border-gray-600">
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider animate-pulse">
                {displayNumber}
              </div>
              <div className="text-sm font-mono text-gray-600 mt-1">
                {message}
              </div>
            </div>
          </div>
          
          {/* Calculator Buttons Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              7
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              8
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              9
            </div>
            <div className="bg-orange-500 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-orange-400 transition-colors animate-pulse">
              ÷
            </div>
            
            {/* Row 2 */}
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              4
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              5
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              6
            </div>
            <div className="bg-orange-500 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-orange-400 transition-colors animate-pulse">
              ×
            </div>
            
            {/* Row 3 */}
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              1
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              2
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              3
            </div>
            <div className="bg-orange-500 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-orange-400 transition-colors animate-pulse">
              −
            </div>
            
            {/* Row 4 */}
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors col-span-2">
              0
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-gray-600 transition-colors">
              .
            </div>
            <div className="bg-green-500 rounded-lg p-3 text-center text-white font-bold shadow-md hover:bg-green-400 transition-colors animate-pulse">
              =
            </div>
          </div>
        </div>

      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <p className="text-gray-600 font-medium animate-pulse">
          Processing your data...
        </p>
      </div>
    </div>
  );
}
