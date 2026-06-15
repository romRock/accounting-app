import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  getEntryBranchFilter,
  getMasterBranchFilter,
  isSuperAdminUser,
} from '../../utils/branchScope';

const prisma = new PrismaClient();

// Get total outward booking commission (our commission only)
export const getTotalOutwardBookingCommission = async (req: Request, res: Response) => {
  try {
    // Use Indian timezone (Asia/Kolkata) for date calculations
    const now = new Date();
    const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const today = new Date(indianDate);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const result = await prisma.transaction.aggregate({
      where: {
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        bookingCommission: true,
      },
    });

    const totalCommission = result._sum.bookingCommission || 0;

    res.json({
      success: true,
      data: {
        totalOutwardBookingCommission: totalCommission,
      },
    });
  } catch (error) {
    console.error('Error fetching outward booking commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outward booking commission',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get total inward booking commission (our commission only)
export const getTotalInwardBookingCommission = async (req: Request, res: Response) => {
  try {
    // Use Indian timezone (Asia/Kolkata) for date calculations
    const now = new Date();
    const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const today = new Date(indianDate);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const result = await prisma.transaction.aggregate({
      where: {
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        bookingCommission: true,
      },
    });

    const totalCommission = result._sum.bookingCommission || 0;

    res.json({
      success: true,
      data: {
        totalInwardBookingCommission: totalCommission,
      },
    });
  } catch (error) {
    console.error('Error fetching inward booking commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inward booking commission',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get total transaction counts by type
export const getTotalTransactionCounts = async (req: Request, res: Response) => {
  try {
    // Use Indian timezone (Asia/Kolkata) for date calculations
    const now = new Date();
    const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const today = new Date(indianDate);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Count outward transactions
    const outwardCount = await prisma.transaction.count({
      where: {
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count inward transactions
    const inwardCount = await prisma.transaction.count({
      where: {
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count hawala transactions
    const hawalaCount = await prisma.hawala.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count accounting entries
    const accountingCount = await prisma.accountEntry.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count special entries
    const specialEntryCount = await prisma.specialEntry.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalTransactions = outwardCount + inwardCount + hawalaCount + accountingCount + specialEntryCount;

    res.json({
      success: true,
      data: {
        outward: outwardCount,
        inward: inwardCount,
        hawala: hawalaCount,
        accounting: accountingCount,
        specialEntry: specialEntryCount,
        total: totalTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction counts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get customer review program (real-time client balances from all modules)
export const getCustomerReviewProgram = async (req: Request, res: Response) => {
  try {
    // Get all active clients
    const clients = await prisma.party.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    // Calculate real-time balance for each client from all modules
    const clientBalances: Array<{ name: string; balance: number }> = [];

    for (const client of clients) {
      let totalCredit = 0;
      let totalDebit = 0;
      const clientName = client.name.toLowerCase();

      try {
        // 1. Transactions Module
        const transactions = await prisma.transaction.findMany({
          where: {
            isActive: true,
            isDeleted: false,
          },
        });

        transactions.forEach((txn) => {
          const receiverName = txn.receiverName?.toLowerCase() || '';
          const senderName = txn.senderName?.toLowerCase() || '';

          if (receiverName === clientName || senderName === clientName) {
            if (txn.type === 'OUTWARD') {
              // OUTWARD: Receiver gets credit (money coming to them), we collect
              totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
            } else if (txn.type === 'INWARD') {
              // INWARD: Sender pays debit (money going from them), we pay
              totalDebit += (txn.amount || 0);
            }
          }
        });

        // 2. Accounting Module
        const accEntries = await prisma.accountEntry.findMany({
          where: {
            isActive: true,
            isDeleted: false,
          },
          include: {
            party: true,
          },
        });

        accEntries.forEach((entry: any) => {
          const partyName = entry.party?.name?.toLowerCase() || '';
          if (partyName === clientName) {
            if (entry.type === 'INCOME') {
              totalCredit += entry.amount || 0;
            } else if (entry.type === 'EXPENSE') {
              totalDebit += entry.amount || 0;
            }
          }
        });

        // 3. Hawala Module
        const hawalaEntries = await prisma.hawala.findMany({
          where: {
            isActive: true,
            isDeleted: false,
          },
        });

        hawalaEntries.forEach((entry: any) => {
          const partyA = entry.partyA?.toLowerCase() || '';
          const partyB = entry.partyB?.toLowerCase() || '';

          if (partyA === clientName) {
            // Party A gives money (debit)
            totalDebit += entry.amount || 0;
          }
          if (partyB === clientName) {
            // Party B receives money (credit)
            totalCredit += entry.amount || 0;
          }
        });

        // 4. Special Entry Module
        const splEntries = await prisma.specialEntry.findMany({
          where: {
            isActive: true,
            isDeleted: false,
          },
        });

        splEntries.forEach((entry) => {
          const partyA = entry.partyA?.toLowerCase() || '';
          const partyB = entry.partyB?.toLowerCase() || '';
          const partyC = entry.partyC?.toLowerCase() || '';

          if (partyA === clientName) {
            totalDebit += entry.amountA || 0;
          }
          if (partyB === clientName) {
            totalDebit += entry.amountB || 0;
          }
          if (partyC === clientName) {
            totalCredit += entry.amountC || 0;
          }
        });

        // Calculate net balance (credit - debit)
        const netBalance = totalCredit - totalDebit;

        if (netBalance !== 0) {
          clientBalances.push({
            name: client.name,
            balance: netBalance,
          });
        }
      } catch (error) {
        console.error(`Error calculating balance for ${client.name}:`, error);
      }
    }

    // Separate into plus (credit) and minus (debit) customers
    // Sort by ascending order (positive/income first)
    const sortedClients = clientBalances.sort((a, b) => b.balance - a.balance);
    
    const plusCustomers = sortedClients.filter(c => c.balance > 0);
    const minusCustomers = sortedClients.filter(c => c.balance < 0).map(c => ({
      name: c.name,
      balance: Math.abs(c.balance),
    })).sort((a, b) => b.balance - a.balance);

    // Take top 5 from each
    const topPlusCustomers = plusCustomers.slice(0, 5);
    const topMinusCustomers = minusCustomers.slice(0, 5);

    res.json({
      success: true,
      data: {
        plusCustomers: topPlusCustomers,
        minusCustomers: topMinusCustomers,
      },
    });
  } catch (error) {
    console.error('Error fetching customer review program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer review program',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all dashboard metrics in one call (public endpoint)
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const { date: dateParam } = req.query;
    
    // Get user branch info for filtering
    const userBranchId = (req as any).user?.branchId;
    const assignedBranchIds = (req as any).user?.assignedBranchIds as string[] | undefined;
    const userPermissions = (req as any).user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);
    
    const entryBranchFilter = await getEntryBranchFilter(
      prisma,
      userBranchId,
      isSuperAdmin,
      assignedBranchIds
    );
    const masterBranchFilter = getMasterBranchFilter(userBranchId, isSuperAdmin, assignedBranchIds);
    
    // Use Indian timezone (Asia/Kolkata) for date calculations
    const now = new Date();
    const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    // Use provided date or default to today in Indian timezone
    const today = dateParam ? new Date(dateParam as string) : new Date(indianDate);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log('=== DASHBOARD METRICS DEBUG ===');
    console.log('Date filter:', dateParam || 'today');
    console.log('Filter date (start of day UTC):', today.toISOString());
    console.log('Tomorrow (start of day UTC):', tomorrow.toISOString());
    console.log('Current UTC time:', new Date().toISOString());

    // Get total outward booking commission (today only) - filtered by branch
    const outwardResult = await prisma.transaction.aggregate({
      where: {
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
      _sum: {
        bookingCommission: true,
      },
    });

    // Get total inward booking commission (today only) - filtered by branch
    const inwardResult = await prisma.transaction.aggregate({
      where: {
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
      _sum: {
        bookingCommission: true,
      },
    });

    // Count transactions by type (today only) - filtered by branch
    const outwardCount = await prisma.transaction.count({
      where: {
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
    });

    const inwardCount = await prisma.transaction.count({
      where: {
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
    });

    const hawalaCount = await prisma.hawala.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
    });

    const accountingCount = await prisma.accountEntry.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
    });

    const specialEntryCount = await prisma.specialEntry.count({
      where: {
        isActive: true,
        isDeleted: false,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...entryBranchFilter,
      },
    });

    const totalTransactions = outwardCount + inwardCount + hawalaCount + accountingCount + specialEntryCount;

    // Get total number of clients (parties) - filtered by branch
    const totalClients = await prisma.party.count({
      where: {
        isActive: true,
        isDeleted: false,
        ...masterBranchFilter,
      },
    });

    // Get total number of cities (centers) - filtered by branch
    const totalCities = await prisma.city.count({
      where: {
        isActive: true,
        isDeleted: false,
        ...masterBranchFilter,
      },
    });

    console.log('Total clients:', totalClients);
    console.log('Total cities:', totalCities);
    console.log('Transaction counts today:', { outwardCount, inwardCount, hawalaCount, accountingCount, specialEntryCount });
    console.log('Commission today:', { outward: outwardResult._sum.bookingCommission, inward: inwardResult._sum.bookingCommission });

    res.json({
      success: true,
      data: {
        totalOutwardBookingCommission: outwardResult._sum.bookingCommission || 0,
        totalInwardBookingCommission: inwardResult._sum.bookingCommission || 0,
        transactionCounts: {
          outward: outwardCount,
          inward: inwardCount,
          hawala: hawalaCount,
          accounting: accountingCount,
          specialEntry: specialEntryCount,
          total: totalTransactions,
        },
        totalClients: totalClients,
        totalCities: totalCities,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
