import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writable } from 'svelte/store';

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
  formatCurrency: vi.fn((value: number) => `$${value.toFixed(2)}`)
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

  it('should be defined', () => {
    const { generateSaleReceipt } = require('$lib/utils/pdfGenerator');
    expect(generateSaleReceipt).toBeDefined();
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(10);
    expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'normal');
    expect(mockDoc.text).toHaveBeenCalledWith('123 Test Street, Test City, TC 12345', 105, 26, { align: 'center' });
  });

  it('should create PDF with store phone', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('(555) 123-4567', 105, 31, { align: 'center' });
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.setFontSize).toHaveBeenCalledWith(14);
    expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Invoice #: INV-ABC123-XYZ', 15, 59);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Date: Jan 15, 2024, 10:30 AM', 15, 65);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Customer: John Doe', 15, 71);
  });

  it('should include payment method label', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Payment: Cash', 15, 77);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Payment: Cash', 15, expect.any(Number));
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(creditSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Payment: Credit', 15, expect.any(Number));
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mobileSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Payment: Mobile Payment', 15, expect.any(Number));
  });

  it('should call autoTable with correct table data', async () => {
    const { generateSaleReceipt } = await import('$lib/utils/pdfGenerator');
    const mockDoc = {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn();
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(autoTableMock).toHaveBeenCalled();
    const callArgs = autoTableMock.mock.calls[0][0];
    expect(callArgs.head).toEqual([['Item', 'Qty', 'Unit Price', 'Total']]);
    expect(callArgs.body).toHaveLength(3);
    expect(callArgs.body[0]).toEqual(['Test Product A', '2', '$10.99', '$21.98']);
    expect(callArgs.body[1]).toEqual(['Test Product B', '1', '$25.50', '$25.50']);
    expect(callArgs.body[2]).toEqual(['Test Product C', '1', '$7.47', '$7.47']);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Total: $54.95', 195, expect.any(Number), { align: 'right' });
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Thank you for your business!', 105, expect.any(Number), { align: 'center' });
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, [], mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Total: $0.00', 195, expect.any(Number), { align: 'right' });
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, singleItem, mockSettings);
    const callArgs = autoTableMock.mock.calls[0][0];
    expect(callArgs.body).toHaveLength(1);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(mockSale, manyItems, mockSettings);
    const callArgs = autoTableMock.mock.calls[0][0];
    expect(callArgs.body).toHaveLength(20);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(saleNoCustomer, mockItems, mockSettings);
    expect(mockDoc.text).not.toHaveBeenCalledWith(expect.stringContaining('Customer:'), 15, 71);
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(largeSale, largeItem, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Total: $12345.67', 195, expect.any(Number), { align: 'right' });
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
        pageSize: {
          getWidth: vi.fn(() => 210)
        }
      }
    };
    const autoTableMock = vi.fn().mockImplementation(() => ({
      lastAutoTable: { finalY: 120 }
    }));
    vi.mocked(require('jspdf-autotable').default).mockImplementation(autoTableMock);
    vi.mocked(require('jspdf').jsPDF).mockReturnValue(mockDoc);
    generateSaleReceipt(zeroSale, mockItems, mockSettings);
    expect(mockDoc.text).toHaveBeenCalledWith('Total: $0.00', 195, expect.any(Number), { align: 'right' });
  });
});
