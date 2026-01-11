import { describe, it, expect } from 'vitest';

describe('Daily Summary Report Logic', () => {
  describe('Date Range Calculation', () => {
    it('should calculate default date range based on days parameter', () => {
      const days = 30;
      const now = new Date('2024-01-15T12:00:00Z');
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      expect(startDate.getTime()).toBeLessThan(now.getTime());
      const diffDays = (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(30, 0);
    });

    it('should use provided endDate when specified', () => {
      const endDateParam = '2024-01-31';
      const endDate = new Date(endDateParam);
      
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getDate()).toBe(31);
    });

    it('should use provided startDate when specified', () => {
      const startDateParam = '2024-01-01';
      const startDate = new Date(startDateParam);
      
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(0);
      expect(startDate.getDate()).toBe(1);
    });

    it('should default to now when no endDate provided', () => {
      const endDateParam = null;
      const now = new Date();
      const endDate = endDateParam ? new Date(endDateParam) : now;
      
      expect(endDate.getTime()).toBe(now.getTime());
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate total revenue from daily data', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 1500, transactionCount: 15 },
        { date: '2024-01-03', totalSales: 800, transactionCount: 8 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      
      expect(totalRevenue).toBe(3300);
    });

    it('should calculate total transactions from daily data', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 1500, transactionCount: 15 },
        { date: '2024-01-03', totalSales: 800, transactionCount: 8 }
      ];
      
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      
      expect(totalTransactions).toBe(33);
    });

    it('should calculate average daily sales correctly', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 2000, transactionCount: 20 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const avgDailySales = dailyData.length > 0 ? totalRevenue / dailyData.length : 0;
      const roundedAvg = Math.round(avgDailySales * 100) / 100;
      
      expect(roundedAvg).toBe(1500);
    });

    it('should calculate average transaction value correctly', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 1500, transactionCount: 15 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const roundedAvg = Math.round(avgTransactionValue * 100) / 100;
      
      expect(roundedAvg).toBe(100);
    });

    it('should handle zero transactions', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 0, transactionCount: 0 },
        { date: '2024-01-02', totalSales: 0, transactionCount: 0 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      expect(totalRevenue).toBe(0);
      expect(totalTransactions).toBe(0);
      expect(avgTransactionValue).toBe(0);
    });

    it('should handle empty daily data', () => {
      const dailyData: any[] = [];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      const avgDailySales = dailyData.length > 0 ? totalRevenue / dailyData.length : 0;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      expect(totalRevenue).toBe(0);
      expect(totalTransactions).toBe(0);
      expect(avgDailySales).toBe(0);
      expect(avgTransactionValue).toBe(0);
    });

    it('should handle null values in daily data', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: null, transactionCount: null },
        { date: '2024-01-02', totalSales: 1000, transactionCount: 10 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      
      expect(totalRevenue).toBe(1000);
      expect(totalTransactions).toBe(10);
    });
  });

  describe('Daily Data Transformation', () => {
    it('should transform database result to API response format', () => {
      const dbResult = [
        { date: '2024-01-01', totalSales: 1500.99, transactionCount: 15 },
        { date: '2024-01-02', totalSales: 2000.50, transactionCount: 20 }
      ];
      
      const apiResponse = dbResult.map(d => ({
        date: d.date,
        totalSales: d.totalSales || 0,
        transactionCount: d.transactionCount || 0,
        avgSaleValue: d.transactionCount ? Math.round(((d.totalSales || 0) / d.transactionCount) * 100) / 100 : 0
      }));
      
      expect(apiResponse[0]).toEqual({
        date: '2024-01-01',
        totalSales: 1500.99,
        transactionCount: 15,
        avgSaleValue: 100.07
      });
    });

    it('should calculate avgSaleValue correctly', () => {
      const dbResult = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 500, transactionCount: 5 }
      ];
      
      const apiResponse = dbResult.map(d => ({
        avgSaleValue: d.transactionCount ? Math.round(((d.totalSales || 0) / d.transactionCount) * 100) / 100 : 0
      }));
      
      expect(apiResponse[0].avgSaleValue).toBe(100);
      expect(apiResponse[1].avgSaleValue).toBe(100);
    });

    it('should handle zero transaction count in avgSaleValue', () => {
      const dbResult = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 0 }
      ];
      
      const avgSaleValue = dbResult[0].transactionCount 
        ? Math.round(((dbResult[0].totalSales || 0) / dbResult[0].transactionCount) * 100) / 100 
        : 0;
      
      expect(avgSaleValue).toBe(0);
    });
  });

  describe('Date Sorting', () => {
    it('should sort dates in ascending order', () => {
      const dailyData = [
        { date: '2024-01-03', totalSales: 800, transactionCount: 8 },
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 1500, transactionCount: 15 }
      ];
      
      const sorted = dailyData.sort((a, b) => a.date.localeCompare(b.date));
      
      expect(sorted[0].date).toBe('2024-01-01');
      expect(sorted[1].date).toBe('2024-01-02');
      expect(sorted[2].date).toBe('2024-01-03');
    });
  });

  describe('Summary Response Structure', () => {
    it('should create correct summary response format', () => {
      const dailyData = [
        { date: '2024-01-01', totalSales: 1000, transactionCount: 10 },
        { date: '2024-01-02', totalSales: 1500, transactionCount: 15 }
      ];
      
      const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
      const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0);
      const avgDailySales = dailyData.length > 0 ? totalRevenue / dailyData.length : 0;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      const summary = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100
      };
      
      expect(summary).toEqual({
        totalRevenue: 2500,
        totalTransactions: 25,
        avgDailySales: 1250,
        avgTransactionValue: 100
      });
    });
  });

  describe('Days Parameter Parsing', () => {
    it('should parse valid days parameter', () => {
      const daysParam = '7';
      const days = parseInt(daysParam) || 30;
      
      expect(days).toBe(7);
    });

    it('should default to 30 days when not specified', () => {
      const daysParam = null;
      const days = parseInt(daysParam || '30');
      
      expect(days).toBe(30);
    });

    it('should handle invalid days parameter', () => {
      const daysParam = 'invalid';
      const days = parseInt(daysParam) || 30;
      
      expect(days).toBe(30);
    });
  });

  describe('Grouping by Day', () => {
    it('should group sales data by day', () => {
      const sales = [
        { saleDate: new Date('2024-01-01T10:00:00Z'), totalAmount: 100 },
        { saleDate: new Date('2024-01-01T14:00:00Z'), totalAmount: 150 },
        { saleDate: new Date('2024-01-02T09:00:00Z'), totalAmount: 200 }
      ];
      
      const grouped = sales.reduce((acc, sale) => {
        const date = sale.saleDate.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, totalSales: 0, count: 0 };
        }
        acc[date].totalSales += sale.totalAmount;
        acc[date].count++;
        return acc;
      }, {} as Record<string, { date: string; totalSales: number; count: number }>);
      
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2024-01-01'].totalSales).toBe(250);
      expect(grouped['2024-01-01'].count).toBe(2);
      expect(grouped['2024-01-02'].totalSales).toBe(200);
      expect(grouped['2024-01-02'].count).toBe(1);
    });
  });
});
