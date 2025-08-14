import { writable } from 'svelte/store';

export type Language = 'my' | 'en';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize with stored preference or default to Myanmar
function createLanguageStore() {
  const defaultLang: Language = 'my';
  const storedLang = isBrowser ? localStorage.getItem('language') as Language : null;
  const initialLang = storedLang || defaultLang;

  const { subscribe, set, update } = writable<Language>(initialLang);

  return {
    subscribe,
    set: (lang: Language) => {
      if (isBrowser) {
        localStorage.setItem('language', lang);
      }
      set(lang);
    },
    toggle: () => {
      update(lang => {
        const newLang = lang === 'my' ? 'en' : 'my';
        if (isBrowser) {
          localStorage.setItem('language', newLang);
        }
        return newLang;
      });
    }
  };
}

export const currentLanguage = createLanguageStore();

// Translation function that works with reactive statements
export function t(key: string, lang?: Language): string {
  if (lang) {
    return translations[lang][key] || key;
  }
  
  // For use with reactive statements, we need to check the current value
  // This will be used in reactive contexts where the store value is already available
  return key; // Fallback, will be replaced by reactive statement
}

// Translation function for use in components with store subscription
export function translate(key: string, currentLang: Language): string {
  return translations[currentLang][key] || key;
}

// Translation keys
export const translations = {
  my: {
    // Navigation
    'nav.dashboard': 'ခြုံငုံကြည့်ရှုမှု',
    'nav.inventory': 'ကုန်ပစ္စည်း',
    'nav.pos': 'အရောင်းစနစ်',
    'nav.reports': 'အစီရင်ခံစာ',
    
    // Header
    'header.notifications': 'သတိပေးချက်များ',
    'header.language': 'ဘာသာစကား',
    'header.settings': 'ဆက်တင်များ',
    
    // Common
    'common.search': 'ရှာဖွေရန်',
    'common.add': 'ထည့်ရန်',
    'common.edit': 'ပြင်ဆင်ရန်',
    'common.delete': 'ဖျက်ရန်',
    'common.save': 'သိမ်းဆည်းရန်',
    'common.cancel': 'ပယ်ဖျက်ရန်',
    'common.loading': 'ခေတ္တစောင့်ပါ...',
    'common.error': 'အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်',
    'common.success': 'အောင်မြင်ပါသည်',
    'common.confirm': 'အတည်ပြုပါ',
    'common.yes': 'ဟုတ်ကဲ့',
    'common.no': 'မဟုတ်ပါ',
    'common.close': 'ပိတ်ရန်',
    'common.back': 'ပြန်ရန်',
    'common.next': 'ရှေ့သို့',
    'common.previous': 'နောက်သို့',
    'common.refresh': 'ပြန်လည်ဆန်းသစ်ရန်',
    'common.live': 'လက်ရှိ',
    'common.updated': 'ပြန်လည်ဆန်းသစ်ပြီး',
    'common.retry': 'ထပ်မံကြိုးစားရန်',
    
    // Dashboard
    'dashboard.title': 'ခြုံငုံကြည့်ရှုမှု',
    'dashboard.greeting': 'မင်္ဂလာပါ!',
    'dashboard.subtitle': 'ယနေ့ရဲ့ လုပ်ငန်းအခြေအနေကို ကြည့်ရှုနိုင်ပါသည်',
    'dashboard.overview': 'ခြုံငုံကြည့်ရှုမှု',
    'dashboard.analytics': 'ခွဲခြမ်းစိတ်ဖြာမှု',
    'dashboard.todaySales': 'ယနေ့အရောင်းငွေ',
    'dashboard.todayTransactions': 'ယနေ့ရောင်းချမှုအရေအတွက်',
    'dashboard.totalItems': 'လက်ကျန်ပစ္စည်းအမျိုးအစား',
    'dashboard.totalProducts': 'စုစုပေါင်း ပစ္စည်းများ',
    'dashboard.lowStock': 'လက်ကျန်နည်းနေသော ပစ္စည်းများ',
    'dashboard.increasing': 'မနေ့ကထက် တိုးတက်နေသည်',
    'dashboard.totalSales': 'စုစုပေါင်း အရောင်းများ',
    'dashboard.needsAction': 'ရှင်းရန်လိုအပ်သည်',
    'dashboard.goodStatus': 'အခြေအနေကောင်းသည်',
    'dashboard.topSelling': 'အရောင်းအကောင်းဆုံး ပစ္စည်းများ',
    'dashboard.toDate': 'ယနေ့အထိ',
    'dashboard.revenue': 'ဝင်ငွေ',
    'dashboard.recentSales': 'လတ်တလော အရောင်းများ',
    'dashboard.topProducts': 'ရောင်းအားကောင်းသော ပစ္စည်းများ',
    
    // Inventory
    'inventory.title': 'ကုန်ပစ္စည်း စီမံခန့်ခွဲမှု',
    'inventory.description': 'ပစ္စည်းများကို ရှာဖွေ၊ စီမံ၊ အစီရင်ခံနိုင်ပါသည်',
    'inventory.addItem': 'ကုန်ပစ္စည်းထည့်ရန်',
    'inventory.searchPlaceholder': 'ပစ္စည်းအမည် သို့မဟုတ် ကုဒ် ရှာရန်...',
    'inventory.itemName': 'ပစ္စည်းအမည်',
    'inventory.itemCode': 'ပစ္စည်းကုဒ်',
    'inventory.category': 'အမျိုးအစား',
    'inventory.price': 'ဈေးနှုန်း',
    'inventory.stock': 'လက်ကျန်',
    'inventory.lowStock': 'လက်ကျန်နည်းသည်',
    'inventory.outOfStock': 'ကုန်သွားပြီ',
    'inventory.available': 'ရရှိနေသည်',
    'inventory.sellingPrice': 'ရောင်းဈေး',
    'inventory.costPrice': 'ဝယ်ဈေး',
    'inventory.lastUpdated': 'နောက်ဆုံးပြင်ဆင်ချိန်',
    
    // Filters & Sorting
    'filter.all': 'အားလုံး',
    'filter.category': 'အမျိုးအစား',
    'filter.status': 'အခြေအနေ',
    'filter.sortBy': 'အစီအစဉ်',
    'filter.sortByName': 'အမည်အလိုက်',
    'filter.sortByPrice': 'ဈေးနှုန်းအလိုက်',
    'filter.sortByStock': 'လက်ကျန်အလိုက်',
    'filter.sortByUpdated': 'နောက်ဆုံးပြင်ဆင်ချိန်',
    'filter.ascending': 'အနည်းမှအများ',
    'filter.descending': 'အများမှအနည်း',
    
    // POS
    'pos.title': 'အရောင်းစနစ်',
    'pos.description': 'ပစ္စည်းများကို ရွေးချယ်၍ အရောင်းလုပ်ငန်း ဆောင်ရွက်နိုင်ပါသည်',
    'pos.items': 'ပစ္စည်းများ',
    'pos.total': 'စုစုပေါင်း',
    'pos.grandTotal': 'စုစုပေါင်း',
    'pos.errors': 'အမှား',
    'pos.errorsFound': 'ခု ဖြစ်ပေါ်ခဲ့သည်',
    'pos.cash': 'လက်ငင်းငွေ',
    'pos.card': 'ကတ်',
    'pos.mobile': 'မိုဘိုင်းငွေ',
    'pos.amountPaid': 'ပေးချေငွေပမာဏ',
    'pos.amountPaidPlaceholder': 'ပေးချေငွေပမာဏ',
    'pos.change': 'ကျန်ငွေ',
    'pos.processing': 'လုပ်ဆောင်နေသည်...',
    'pos.processSale': 'အရောင်းပြီးစီးရန်',
    'pos.selectItems': 'ပစ္စည်းရွေးရန်',
    'pos.cart': 'ဝယ်ယူမည့်စာရင်း',
    'pos.subtotal': 'စုစုပေါင်း (အခွန်မပါ)',
    'pos.tax': 'အခွန်',
    'pos.discount': 'လျှော့စျေး',
    'pos.payment': 'ငွေပေးချေမှု',
    'pos.completeSale': 'အရောင်းပြီးဆုံးရန်',
    'pos.printReceipt': 'ဘောက်ချာပုံနှိပ်ရန်',
    
    // Reports
    'reports.title': 'အစီရင်ခံစာများ',
    'reports.salesReport': 'အရောင်းအစီရင်ခံစာ',
    'reports.inventoryReport': 'ကုန်ပစ္စည်းအစီရင်ခံစာ',
    'reports.dailySales': 'နေ့စဉ်အရောင်း',
    'reports.monthlySales': 'လစဉ်အရောင်း',
    'reports.yearlySales': 'နှစ်စဉ်အရောင်း',
    'reports.topProducts': 'ရောင်းအားကောင်းသော ပစ္စည်းများ',
    'reports.lowStockItems': 'လက်ကျန်နည်းသော ပစ္စည်းများ',
    
    // Language
    'language.myanmar': 'မြန်မာ',
    'language.english': 'English',
    'language.switch': 'ဘာသာစကားပြောင်းရန်',
    
    // Notifications
    'notification.itemAdded': 'ပစ္စည်းအောင်မြင်စွာ ထည့်သွင်းပြီးပါသည်',
    'notification.itemUpdated': 'ပစ္စည်းအောင်မြင်စွာ ပြင်ဆင်ပြီးပါသည်',
    'notification.itemDeleted': 'ပစ္စည်းအောင်မြင်စွာ ဖျက်ပြီးပါသည်',
    'notification.saleCompleted': 'အရောင်းအောင်မြင်စွာ ပြီးစီးပါသည်',
    'notification.error': 'အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်',
    
    // Currency
    'currency.mmk': 'ကျပ်',
    'currency.format': '{{amount}} ကျပ်'
  },
  
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.pos': 'Point of Sale',
    'nav.reports': 'Reports',
    
    // Header
    'header.notifications': 'Notifications',
    'header.language': 'Language',
    'header.settings': 'Settings',
    
    // Common
    'common.search': 'Search',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.refresh': 'Refresh',
    'common.live': 'Live',
    'common.updated': 'Updated',
    'common.retry': 'Try Again',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.greeting': 'Welcome!',
    'dashboard.subtitle': 'Monitor your business performance today',
    'dashboard.overview': 'Overview',
    'dashboard.analytics': 'Analytics',
    'dashboard.todaySales': "Today's Sales",
    'dashboard.todayTransactions': "Today's Transactions",
    'dashboard.totalItems': 'Total Items in Stock',
    'dashboard.totalProducts': 'Total Products',
    'dashboard.lowStock': 'Low Stock Items',
    'dashboard.increasing': 'Increasing from yesterday',
    'dashboard.totalSales': 'Total Sales',
    'dashboard.needsAction': 'Needs attention',
    'dashboard.goodStatus': 'Good status',
    'dashboard.topSelling': 'Top Selling Items',
    'dashboard.toDate': 'To Date',
    'dashboard.revenue': 'Revenue',
    'dashboard.recentSales': 'Recent Sales',
    'dashboard.topProducts': 'Top Products',
    
    // Inventory
    'inventory.title': 'Inventory Management',
    'inventory.description': 'Search, manage, and track your inventory items',
    'inventory.addItem': 'Add Item',
    'inventory.searchPlaceholder': 'Search by item name or code...',
    'inventory.itemName': 'Item Name',
    'inventory.itemCode': 'Item Code',
    'inventory.category': 'Category',
    'inventory.price': 'Price',
    'inventory.stock': 'Stock',
    'inventory.lowStock': 'Low Stock',
    'inventory.outOfStock': 'Out of Stock',
    'inventory.available': 'Available',
    'inventory.sellingPrice': 'Selling Price',
    'inventory.costPrice': 'Cost Price',
    'inventory.lastUpdated': 'Last Updated',
    
    // Filters & Sorting
    'filter.all': 'All',
    'filter.category': 'Category',
    'filter.status': 'Status',
    'filter.sortBy': 'Sort By',
    'filter.sortByName': 'Name',
    'filter.sortByPrice': 'Price',
    'filter.sortByStock': 'Stock',
    'filter.sortByUpdated': 'Last Updated',
    'filter.ascending': 'Ascending',
    'filter.descending': 'Descending',
    
    // POS
    'pos.title': 'Point of Sale',
    'pos.description': 'Select items and process sales transactions',
    'pos.items': 'Items',
    'pos.total': 'Total',
    'pos.grandTotal': 'Grand Total',
    'pos.errors': 'Error',
    'pos.errorsFound': 'errors occurred',
    'pos.cash': 'Cash',
    'pos.card': 'Card',
    'pos.mobile': 'Mobile Payment',
    'pos.amountPaid': 'Amount Paid',
    'pos.amountPaidPlaceholder': 'Enter amount paid',
    'pos.change': 'Change',
    'pos.processing': 'Processing...',
    'pos.processSale': 'Complete Sale',
    'pos.selectItems': 'Select Items',
    'pos.cart': 'Shopping Cart',
    'pos.subtotal': 'Subtotal',
    'pos.tax': 'Tax',
    'pos.discount': 'Discount',
    'pos.payment': 'Payment',
    'pos.completeSale': 'Complete Sale',
    'pos.printReceipt': 'Print Receipt',
    
    // Reports
    'reports.title': 'Reports',
    'reports.salesReport': 'Sales Report',
    'reports.inventoryReport': 'Inventory Report',
    'reports.dailySales': 'Daily Sales',
    'reports.monthlySales': 'Monthly Sales',
    'reports.yearlySales': 'Yearly Sales',
    'reports.topProducts': 'Top Products',
    'reports.lowStockItems': 'Low Stock Items',
    
    // Language
    'language.myanmar': 'မြန်မာ',
    'language.english': 'English',
    'language.switch': 'Switch Language',
    
    // Notifications
    'notification.itemAdded': 'Item added successfully',
    'notification.itemUpdated': 'Item updated successfully',
    'notification.itemDeleted': 'Item deleted successfully',
    'notification.saleCompleted': 'Sale completed successfully',
    'notification.error': 'An error occurred',
    
    // Currency
    'currency.mmk': 'MMK',
    'currency.format': '{{amount}} MMK'
  }
};
