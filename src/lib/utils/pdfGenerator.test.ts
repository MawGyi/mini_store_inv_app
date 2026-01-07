import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        getWidth: () => 210
      }
    }
  }))
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

vi.mock('$lib/stores/settings', () => ({
  formatCurrency: vi.fn((value) => `$${value.toFixed(2)}`)
}));

const mockSale = {
  id: 1,
  saleDate: new Date('2024-01-15T10:30:00'),
  totalAmount: 54.95,
  paymentMethod: 'cash' as const,
  customerName: 'John Doe',
  invoiceNumber: 'INV-ABC123-XYZ',
  createdAt: new Date('2024-01-15T10:30:00'),
  updatedAt: new Date('2024-01-15T10:30:00')
};

const mockItems = [
  { name: 'Test Product A', quantity: 2, unitPrice: 10.99, totalPrice: 21.98 },
  { name: 'Test Product B', quantity: 1, unitPrice: 25.50, totalPrice: 25.50 },
  { name: 'Test Product C', quantity: 1, unitPrice: 7.47, totalPrice: 7.47 }
];

const mockSettings = {
  storeName: 'Test Store',
  storeAddress: '123 Test Street, Test City, TC 12345',
  storePhone: '(555) 123-4567'
};

describe('PDF Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate receipt function exists', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    expect(typeof generateSaleReceipt).toBe('function');
  });

  it('should create PDF with store header', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(22);
    expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
    expect(mockDoc.text).toHaveBeenCalledWith('Test Store', 105, 20, { align: 'center' });
  });

  it('should create PDF with store address', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(10);
    expect(mockDoc.text).toHaveBeenCalledWith('123 Test Street, Test City, TC 12345', 105, 26, { align: 'center' });
  });

  it('should create PDF with receipt title', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(14);
    expect(mockDoc.text).toHaveBeenCalledWith('SALES RECEIPT', 105, 49, { align: 'center' });
  });

  it('should include invoice number', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('INV-'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should include formatted date', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Date:'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should include customer name when present', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('John Doe'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should map cash payment method correctly', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Cash'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should map credit payment method correctly', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const creditSale = { ...mockSale, paymentMethod: 'credit' as const };
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(creditSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Credit'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should map mobile_payment payment method correctly', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mobileSale = { ...mockSale, paymentMethod: 'mobile_payment' as const };
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mobileSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Mobile'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should call autoTable', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(autoTableMock).toHaveBeenCalled();
  });

  it('should include grand total', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Total') && call[0].includes('54.95'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should include thank you message', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Thank you'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should save PDF with invoice number as filename', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.save).toHaveBeenCalledWith('INV-ABC123-XYZ.pdf');
  });

  it('should handle empty items array', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, [], mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('0.00'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should handle single item', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const singleItem = [mockItems[0]];
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, singleItem, mockSettings);
    expect(autoTableMock).toHaveBeenCalled();
  });

  it('should handle many items', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      name: `Product ${i + 1}`,
      quantity: i + 1,
      unitPrice: 10.00 + i,
      totalPrice: (i + 1) * (10.00 + i)
    }));
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(mockSale, manyItems, mockSettings);
    expect(autoTableMock).toHaveBeenCalled();
  });

  it('should handle null customer name', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const saleNoCustomer = { ...mockSale, customerName: null };
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(saleNoCustomer, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Customer'));
    expect(textCalls.length).toBe(0);
  });

  it('should format large currency values correctly', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const largeSale = { ...mockSale, totalAmount: 12345.67 };
    const largeItem = [{ name: 'Expensive Item', quantity: 1, unitPrice: 12345.67, totalPrice: 12345.67 }];
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(largeSale, largeItem, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('12345.67'));
    expect(textCalls.length).toBeGreaterThan(0);
  });

  it('should handle zero total amount', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const zeroSale = { ...mockSale, totalAmount: 0 };
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: { getWidth: () => 210 }
      }
    };
    const autoTableMock = require('jspdf-autotable');
    autoTableMock.mockReturnValueOnce({ lastAutoTable: { finalY: 120 } });
    const jsPDF = require('jspdf');
    jsPDF.mockReturnValueOnce(mockDoc);
    generateSaleReceipt(zeroSale, mockItems, mockSettings);
    const textCalls = mockDoc.text.mock.calls.filter(call => call[0].includes('Total') && call[0].includes('0.00'));
    expect(textCalls.length).toBeGreaterThan(0);
  });
});
