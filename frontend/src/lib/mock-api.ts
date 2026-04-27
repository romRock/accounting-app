// Mock API service for frontend development
// This simulates backend API calls for dashboard, transactions, etc.

export const mockApi = {
  // Dashboard stats
  async getStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      totalTransactions: 1250,
      totalAmount: 1580000,
      pendingTransactions: 45,
      completedTransactions: 1205,
      todayTransactions: 23,
      todayAmount: 45000,
      monthlyTransactions: 342,
      monthlyAmount: 523000,
    };
  },

  // Recent transactions
  async getRecentTransactions() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'TXN202404230001',
        type: 'INWARD',
        amount: 25000,
        commission: 250,
        partyName: 'ABC Traders',
        cityName: 'Mumbai',
        status: 'COMPLETED',
        createdAt: '2024-04-23T10:30:00Z',
      },
      {
        id: 'TXN202404230002',
        type: 'OUTWARD',
        amount: 18000,
        commission: 180,
        partyName: 'XYZ Corporation',
        cityName: 'Delhi',
        status: 'PENDING',
        createdAt: '2024-04-23T09:15:00Z',
      },
      {
        id: 'TXN202404230003',
        type: 'INWARD',
        amount: 35000,
        commission: 350,
        partyName: 'PQR Industries',
        cityName: 'Bangalore',
        status: 'COMPLETED',
        createdAt: '2024-04-23T08:45:00Z',
      },
    ];
  },

  // All transactions
  async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  } = {}) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { page = 1, limit = 20 } = params;
    
    // Mock transactions data matching the new interface
    const allTransactions = Array.from({ length: 100 }, (_, i) => ({
      id: `TXN202404${String(i + 1).padStart(4, '0')}`,
      token: `TKN${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5),
      center: ['Main Branch', 'North Branch', 'South Branch', 'East Branch', 'West Branch'][i % 5],
      amount: Math.floor(Math.random() * 100000) + 10000,
      type: i % 2 === 0 ? 'INWARD' : 'OUTWARD',
      amountType: ['CASH', 'ACCOUNT / CREDIT'][i % 2],
      commission: Math.floor(Math.random() * 1000) + 100,
      bookingCommission: Math.floor(Math.random() * 600) + 60,
      centerCommission: Math.floor(Math.random() * 400) + 40,
      receiverName: `Receiver ${i + 1}`,
      receiverNumber: `+91 98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      senderName: `Sender ${i + 1}`,
      senderNumber: `+91 99${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      remark: i % 3 === 0 ? `Remark for transaction ${i + 1}` : '',
      status: i % 5 !== 0,
      statusTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Apply filters
    let filteredTransactions = allTransactions;
    
    if (params.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === params.type);
    }
    
    if (params.status !== undefined) {
      const statusBoolean = params.status === 'true';
      filteredTransactions = filteredTransactions.filter(t => t.status === statusBoolean);
    }
    
    if (params.search) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.receiverName.toLowerCase().includes(params.search!.toLowerCase()) ||
        t.senderName.toLowerCase().includes(params.search!.toLowerCase()) ||
        t.id.toLowerCase().includes(params.search!.toLowerCase()) ||
        t.token.toLowerCase().includes(params.search!.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit),
      },
    };
  },

  // Parties
  async getParties() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { id: '1', name: 'ABC Traders', phone: '+91 9876543210', email: 'abc@traders.com', city: 'Mumbai', isActive: true },
      { id: '2', name: 'XYZ Corporation', phone: '+91 9876543211', email: 'xyz@corp.com', city: 'Delhi', isActive: true },
      { id: '3', name: 'PQR Industries', phone: '+91 9876543212', email: 'pqr@industries.com', city: 'Bangalore', isActive: true },
      { id: '4', name: 'LMN Enterprises', phone: '+91 9876543213', email: 'lmn@enterprises.com', city: 'Chennai', isActive: false },
    ];
  },

  // Cities
  async getCities() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      { id: '1', name: 'Mumbai', code: 'MUM', isActive: true },
      { id: '2', name: 'Delhi', code: 'DEL', isActive: true },
      { id: '3', name: 'Bangalore', code: 'BLR', isActive: true },
      { id: '4', name: 'Chennai', code: 'CHE', isActive: true },
      { id: '5', name: 'Kolkata', code: 'KOL', isActive: true },
    ];
  },

  // Branches
  async getBranches() {
    await new Promise(resolve => setTimeout(resolve, 250));
    return [
      { id: '1', name: 'Main Branch', code: 'MAIN', city: 'Mumbai', address: '123 Main St', isActive: true },
      { id: '2', name: 'North Branch', code: 'NORTH', city: 'Delhi', address: '456 North Ave', isActive: true },
      { id: '3', name: 'South Branch', code: 'SOUTH', city: 'Bangalore', address: '789 South Rd', isActive: true },
    ];
  },

  // Create transaction
  async createTransaction(data: any) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      id: `TXN${Date.now()}`,
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  },

  // Update transaction
  async updateTransaction(id: string, data: any) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      id,
      token: data.tokenNo || `TKN${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      date: data.date,
      time: data.time,
      center: data.center,
      amount: data.amount,
      type: data.type || 'OUTWARD',
      amountType: data.amountType,
      commission: data.commission,
      bookingCommission: data.bookingCommission || 0,
      centerCommission: data.centerCommission || 0,
      receiverName: data.receiverName,
      receiverNumber: data.receiverNumber,
      senderName: data.senderName,
      senderNumber: data.senderNumber,
      remark: data.remark,
      status: data.status,
      statusTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  // Delete transaction
  async deleteTransaction(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: 'Transaction deleted successfully' };
  },

  // Reports
  async getBalanceSheet(params: { dateFrom: string; dateTo: string }) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      openingBalance: 1500000,
      closingBalance: 2080000,
      totalInward: 850000,
      totalOutward: 270000,
      netBalance: 580000,
      transactions: [
        { date: '2024-04-23', inward: 45000, outward: 12000, balance: 2080000 },
        { date: '2024-04-22', inward: 38000, outward: 15000, balance: 2035000 },
        { date: '2024-04-21', inward: 52000, outward: 8000, balance: 2002000 },
      ],
    };
  },

  async getCommissionReport(params: { dateFrom: string; dateTo: string }) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      { partyName: 'ABC Traders', totalAmount: 250000, totalCommission: 2500, transactionCount: 25 },
      { partyName: 'XYZ Corporation', totalAmount: 180000, totalCommission: 1800, transactionCount: 18 },
      { partyName: 'PQR Industries', totalAmount: 320000, totalCommission: 3200, transactionCount: 32 },
    ];
  },
};
