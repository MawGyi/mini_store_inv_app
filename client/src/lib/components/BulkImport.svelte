<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiService } from '../services/api';
  import NotificationToast from './NotificationToast.svelte';

  interface ImportResult {
    successful: number;
    failed: number;
    errors: string[];
    duplicates: number;
  }

  const dispatch = createEventDispatcher<{
    importComplete: ImportResult;
    close: void;
  }>();

  let isOpen = false;
  let files: FileList | null = null;
  let dragOver = false;
  let importing = false;
  let importProgress = 0;
  let importResult: ImportResult | null = null;
  let csvData: any[] = [];
  let previewData: any[] = [];
  let fieldMappings: Record<string, string> = {
    name: '',
    description: '',
    price: '',
    cost: '',
    stock_quantity: '',
    low_stock_threshold: '',
    category: '',
    barcode: '',
    supplier: ''
  };
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;

  // Available CSV fields (will be populated after file upload)
  let csvFields: string[] = [];
  
  // Required fields for mapping
  const requiredFields = [
    { key: 'name', label: 'ပစ္စည်းအမည် *', required: true },
    { key: 'price', label: 'ရောင်းစျေး *', required: true },
    { key: 'cost', label: 'ဝယ်စျေး', required: false },
    { key: 'stock_quantity', label: 'လက်ကျန်အရေအတွက်', required: false },
    { key: 'low_stock_threshold', label: 'အနည်းဆုံးလက်ကျန်', required: false },
    { key: 'category', label: 'အမျိုးအစား', required: false },
    { key: 'description', label: 'ဖော်ပြချက်', required: false },
    { key: 'barcode', label: 'ဘားကုဒ်', required: false },
    { key: 'supplier', label: 'ရောင်းချသူ', required: false }
  ];

  export function open() {
    isOpen = true;
    resetState();
  }

  export function close() {
    isOpen = false;
    dispatch('close');
    resetState();
  }

  function resetState() {
    files = null;
    dragOver = false;
    importing = false;
    importProgress = 0;
    importResult = null;
    csvData = [];
    previewData = [];
    csvFields = [];
    fieldMappings = {
      name: '',
      description: '',
      price: '',
      cost: '',
      stock_quantity: '',
      low_stock_threshold: '',
      category: '',
      barcode: '',
      supplier: ''
    };
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      files = droppedFiles;
      processFile(droppedFiles[0]);
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      files = input.files;
      processFile(input.files[0]);
    }
  }

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showNotification('error', 'ကျေးဇူးပြု၍ CSV ဖိုင်ကိုသာ ရွေးချယ်ပါ။');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        showNotification('error', 'CSV ဖိုင်တွင် ဒေတာ မရှိပါ။');
        return;
      }

      // Parse CSV headers
      csvFields = parseCSVLine(lines[0]);
      
      // Parse CSV data
      csvData = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row: any = { _rowIndex: index + 2 }; // +2 for 1-based indexing and header
        csvFields.forEach((field, i) => {
          row[field] = values[i] || '';
        });
        return row;
      });

      // Show preview of first 5 rows
      previewData = csvData.slice(0, 5);
      
      // Auto-map common field names
      autoMapFields();
      
      showNotification('success', `CSV ဖိုင်ကို အောင်မြင်စွာ ဖတ်ယူပြီးပါပြီ (${csvData.length} အတန်း)`);
    } catch (error) {
      console.error('Error processing CSV file:', error);
      showNotification('error', 'CSV ဖိုင် ဖတ်ယူခြင်းတွင် အမှားဖြစ်ပေါ်သည်။');
    }
  }

  function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  function autoMapFields() {
    const commonMappings: Record<string, string[]> = {
      name: ['name', 'product_name', 'item_name', 'title', 'အမည်'],
      price: ['price', 'selling_price', 'sale_price', 'စျေး'],
      cost: ['cost', 'cost_price', 'buy_price', 'ဝယ်စျေး'],
      stock_quantity: ['stock', 'quantity', 'stock_quantity', 'qty', 'လက်ကျန်'],
      low_stock_threshold: ['min_stock', 'low_stock', 'threshold', 'အနည်းဆုံး'],
      category: ['category', 'type', 'အမျိုးအစား'],
      description: ['description', 'desc', 'details', 'ဖော်ပြချက်'],
      barcode: ['barcode', 'ean', 'upc', 'code', 'ဘားကုဒ်'],
      supplier: ['supplier', 'vendor', 'ရောင်းချသူ']
    };

    Object.keys(commonMappings).forEach(fieldKey => {
      const possibleMatches = commonMappings[fieldKey];
      const csvField = csvFields.find(field => 
        possibleMatches.some(match => 
          field.toLowerCase().includes(match.toLowerCase())
        )
      );
      if (csvField) {
        fieldMappings[fieldKey] = csvField;
      }
    });
  }

  function validateMappings(): string[] {
    const errors: string[] = [];
    
    // Check required fields
    const requiredFieldsToCheck = requiredFields.filter(field => field.required);
    requiredFieldsToCheck.forEach(field => {
      if (!fieldMappings[field.key]) {
        errors.push(`${field.label} သည် မဖြစ်မနေ လိုအပ်သည်။`);
      }
    });

    return errors;
  }

  async function startImport() {
    const validationErrors = validateMappings();
    if (validationErrors.length > 0) {
      showNotification('error', validationErrors[0]);
      return;
    }

    importing = true;
    importProgress = 0;
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;
    let duplicates = 0;

    try {
      // Process items in batches
      const batchSize = 10;
      const totalBatches = Math.ceil(csvData.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, csvData.length);
        const batch = csvData.slice(startIndex, endIndex);

        for (const row of batch) {
          try {
            // Map CSV row to item object
            const item: any = {};
            
            Object.keys(fieldMappings).forEach(fieldKey => {
              const csvField = fieldMappings[fieldKey];
              if (csvField && row[csvField] !== undefined) {
                let value = row[csvField];
                
                // Type conversion for numeric fields
                if (['price', 'cost', 'stock_quantity', 'low_stock_threshold'].includes(fieldKey)) {
                  value = parseFloat(value) || 0;
                }
                
                item[fieldKey] = value;
              }
            });

            // Validate required fields
            if (!item.name || !item.price) {
              errors.push(`အတန်း ${row._rowIndex}: ပစ္စည်းအမည် နှင့် ရောင်းစျေး မဖြစ်မနေ လိုအပ်သည်။`);
              failed++;
              continue;
            }

            // Check for duplicates (by name)
            const existingItem = await apiService.getItems({ search: item.name, limit: 1 });
            const existingData = existingItem.data as any;
            if (existingItem.success && existingData?.items?.length > 0) {
              duplicates++;
              errors.push(`အတန်း ${row._rowIndex}: "${item.name}" ရှိနေပြီးဖြစ်သည်။`);
              continue;
            }

            // Create item
            const result = await apiService.createItem(item);
            if (result.success) {
              successful++;
            } else {
              failed++;
              errors.push(`အတန်း ${row._rowIndex}: ${result.message || 'အမှားဖြစ်ပေါ်သည်'}`);
            }
          } catch (error: any) {
            failed++;
            errors.push(`အတန်း ${row._rowIndex}: ${error.message || 'အမှားဖြစ်ပေါ်သည်'}`);
          }
        }

        // Update progress
        importProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      importResult = {
        successful,
        failed,
        errors: errors.slice(0, 20), // Show only first 20 errors
        duplicates
      };

      if (successful > 0) {
        dispatch('importComplete', importResult);
        showNotification('success', `${successful} ပစ္စည်းများကို အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။`);
      } else {
        showNotification('error', 'ပစ္စည်းများ ထည့်သွင်းခြင်းတွင် အမှားဖြစ်ပေါ်သည်။');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showNotification('error', 'ထည့်သွင်းခြင်းတွင် အမှားဖြစ်ပေါ်သည်။');
    } finally {
      importing = false;
    }
  }

  function downloadTemplate() {
    const headers = ['name', 'description', 'price', 'cost', 'stock_quantity', 'low_stock_threshold', 'category', 'barcode', 'supplier'];
    const headerLabels = ['ပစ္စည်းအမည်', 'ဖော်ပြချက်', 'ရောင်းစျေး', 'ဝယ်စျေး', 'လက်ကျန်အရေအတွက်', 'အနည်းဆုံးလက်ကျန်', 'အမျိုးအစား', 'ဘားကုဒ်', 'ရောင်းချသူ'];
    
    // Sample data
    const sampleData = [
      ['ကိုက်ကိုးလား', 'အေးအေးမြမြ သောက်စရာ', '1500', '1000', '100', '10', 'အဖျော်ယမကာ', '123456789', 'ABC Company'],
      ['မုံညှင်းသီး', 'လတ်ဆတ်သော သစ်သီး', '2000', '1200', '50', '5', 'အစားအစာ', '987654321', 'XYZ Fruits']
    ];
    
    const csv = [headerLabels.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory_template.csv';
    link.click();
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 5000);
  }

  // Handle clicking outside modal
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if notification}
  <NotificationToast 
    type={notification.type} 
    message={notification.message} 
    id={notification.id}
    on:close={() => notification = null} 
  />
{/if}

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="bulk-import-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 id="modal-title">📁 စုပေါင်းထည့်သွင်းမှု (CSV Import)</h2>
          <p>CSV ဖိုင်မှ ပစ္စည်းများကို တစ်ကြိမ်တည်း ထည့်သွင်းနိုင်ပါသည်</p>
        </div>
        <button class="close-btn" on:click={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        {#if !csvData.length}
          <!-- File Upload Section -->
          <div class="upload-section">
            <div class="upload-actions">
              <button class="template-btn" on:click={downloadTemplate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                နမူနာ Template ဒေါင်းလုဒ်
              </button>
            </div>

            <div 
              class="upload-zone {dragOver ? 'drag-over' : ''}"
              on:dragover={handleDragOver}
              on:dragleave={handleDragLeave}
              on:drop={handleDrop}
              role="region"
              aria-label="ဖိုင်အပ်လုဒ်ဧရိယာ"
            >
              <div class="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3>CSV ဖိုင်ကို ဤနေရာတွင် ထည့်ပါ</h3>
              <p>သို့မဟုတ် ဖိုင်ရွေးချယ်ရန် နှိပ်ပါ</p>
              <input 
                type="file" 
                accept=".csv" 
                on:change={handleFileSelect}
                class="file-input"
                id="csv-file-input"
              />
              <label for="csv-file-input" class="upload-btn">
                ဖိုင်ရွေးချယ်ရန်
              </label>
              <div class="upload-note">
                <strong>မှတ်ချက်:</strong> CSV ဖိုင်များသာ လက်ခံပါသည်။ UTF-8 encoding ဖြင့် သိမ်းဆည်းပါ။
              </div>
            </div>
          </div>
        {:else}
          <!-- Field Mapping Section -->
          <div class="mapping-section">
            <div class="section-header">
              <h3>📋 ဖိုင်မှ ဒေတာများကို ကွက်လပ်များသို့ တိုက်ဆိုင်ပါ</h3>
              <p>CSV ဖိုင်မှ Column များကို သင့်တော်သော Field များသို့ ချိတ်ဆက်ပါ</p>
            </div>

            <div class="mapping-grid">
              {#each requiredFields as field}
                <div class="mapping-item {field.required ? 'required' : ''}">
                  <label for="mapping-{field.key}" class="mapping-label">
                    {field.label}
                    {#if field.required}
                      <span class="required-marker">*</span>
                    {/if}
                  </label>
                  <select 
                    id="mapping-{field.key}"
                    bind:value={fieldMappings[field.key]} 
                    class="mapping-select"
                  >
                    <option value="">-- ရွေးချယ်ပါ --</option>
                    {#each csvFields as csvField}
                      <option value={csvField}>{csvField}</option>
                    {/each}
                  </select>
                </div>
              {/each}
            </div>

            <!-- Data Preview -->
            <div class="preview-section">
              <h4>📄 ဒေတာ နမူနာကြည့်ရှုမှု (ပထမ 5 အတန်း)</h4>
              <div class="preview-table">
                <table>
                  <thead>
                    <tr>
                      {#each csvFields as field}
                        <th>{field}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each previewData as row}
                      <tr>
                        {#each csvFields as field}
                          <td title={row[field]}>{row[field] || '-'}</td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Import Progress -->
          {#if importing}
            <div class="progress-section">
              <div class="progress-header">
                <h4>⏳ ထည့်သွင်းနေပါသည်...</h4>
                <span class="progress-percentage">{importProgress}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: {importProgress}%"></div>
              </div>
              <p class="progress-note">ကျေးဇူးပြု၍ စောင့်ဆိုင်းပါ...</p>
            </div>
          {/if}

          <!-- Import Results -->
          {#if importResult}
            <div class="results-section">
              <h4>📊 ထည့်သွင်းမှု ရလဒ်</h4>
              <div class="results-summary">
                <div class="result-item success">
                  <span class="result-label">အောင်မြင်:</span>
                  <span class="result-value">{importResult.successful}</span>
                </div>
                <div class="result-item error">
                  <span class="result-label">မအောင်မြင်:</span>
                  <span class="result-value">{importResult.failed}</span>
                </div>
                <div class="result-item warning">
                  <span class="result-label">ထပ်နေသော:</span>
                  <span class="result-value">{importResult.duplicates}</span>
                </div>
              </div>

              {#if importResult.errors.length > 0}
                <div class="errors-section">
                  <h5>❌ အမှားများ:</h5>
                  <div class="errors-list">
                    {#each importResult.errors as error}
                      <div class="error-item">{error}</div>
                    {/each}
                    {#if importResult.errors.length >= 20}
                      <div class="error-item note">... နှင့် အခြားအမှားများ</div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        {#if !csvData.length}
          <button class="btn btn-secondary" on:click={close}>ပိတ်ရန်</button>
        {:else}
          <div class="footer-info">
            <span class="file-info">
              📄 {csvData.length} အတန်း ရှိပါသည်
            </span>
          </div>
          <div class="footer-actions">
            <button class="btn btn-secondary" on:click={resetState}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12C3 12 5.5 7 12 7S21 12 21 12S18.5 17 12 17S3 12 3 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              အသစ်စတင်ရန်
            </button>
            <button 
              class="btn btn-primary" 
              on:click={startImport}
              disabled={importing || !fieldMappings.name || !fieldMappings.price}
            >
              {#if importing}
                <div class="spinner"></div>
                ထည့်သွင်းနေသည်...
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ထည့်သွင်းရန် ({csvData.length} အတန်း)
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .bulk-import-modal {
    background: white;
    border-radius: 1rem;
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s ease;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .header-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .header-content p {
    color: #64748b;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    color: #6b7280;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  /* Upload Section */
  .upload-section {
    text-align: center;
  }

  .upload-actions {
    margin-bottom: 2rem;
  }

  .template-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .template-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
  }

  .upload-zone {
    border: 2px dashed #d1d5db;
    border-radius: 1rem;
    padding: 3rem;
    background: #fafafa;
    transition: all 0.3s ease;
    position: relative;
  }

  .upload-zone.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .upload-icon {
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .upload-zone h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  .upload-zone p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }

  .file-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .upload-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
  }

  .upload-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }

  .upload-note {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border-left: 4px solid #3b82f6;
  }

  /* Mapping Section */
  .mapping-section {
    margin-bottom: 2rem;
  }

  .section-header {
    margin-bottom: 2rem;
  }

  .section-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .section-header p {
    color: #64748b;
    margin: 0;
  }

  .mapping-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .mapping-item {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
  }

  .mapping-item.required {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .mapping-label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .required-marker {
    color: #dc2626;
    font-weight: 700;
  }

  .mapping-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
  }

  .mapping-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Preview Section */
  .preview-section {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .preview-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .preview-table {
    overflow-x: auto;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .preview-table table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .preview-table th {
    background: #f9fafb;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .preview-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    color: #6b7280;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Progress Section */
  .progress-section {
    background: #eff6ff;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #bfdbfe;
    margin-top: 1rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .progress-header h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0;
  }

  .progress-percentage {
    font-weight: 700;
    color: #2563eb;
  }

  .progress-bar {
    height: 8px;
    background: #dbeafe;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-note {
    color: #1e40af;
    font-size: 0.875rem;
    margin: 0;
  }

  /* Results Section */
  .results-section {
    background: #f0fdf4;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #bbf7d0;
    margin-top: 1rem;
  }

  .results-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #166534;
    margin: 0 0 1rem 0;
  }

  .results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid;
  }

  .result-item.success {
    background: #dcfce7;
    border-color: #86efac;
    color: #166534;
  }

  .result-item.error {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #991b1b;
  }

  .result-item.warning {
    background: #fef3c7;
    border-color: #fbbf24;
    color: #92400e;
  }

  .result-label {
    font-weight: 500;
  }

  .result-value {
    font-weight: 700;
    font-size: 1.125rem;
  }

  .errors-section {
    background: #fef2f2;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #fca5a5;
  }

  .errors-section h5 {
    font-size: 1rem;
    font-weight: 600;
    color: #991b1b;
    margin: 0 0 0.75rem 0;
  }

  .errors-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .error-item {
    padding: 0.5rem;
    background: white;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: #7f1d1d;
    border-left: 3px solid #dc2626;
  }

  .error-item.note {
    font-style: italic;
    color: #6b7280;
    border-left-color: #9ca3af;
  }

  /* Modal Footer */
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }

  .footer-info {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .footer-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 0.875rem;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .bulk-import-modal {
      max-height: 95vh;
    }

    .modal-header,
    .modal-content {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .footer-actions {
      justify-content: stretch;
    }

    .footer-actions .btn {
      flex: 1;
      justify-content: center;
    }

    .mapping-grid {
      grid-template-columns: 1fr;
    }

    .results-summary {
      grid-template-columns: 1fr;
    }

    .upload-zone {
      padding: 2rem 1rem;
    }

    .preview-table {
      font-size: 0.75rem;
    }

    .preview-table th,
    .preview-table td {
      padding: 0.5rem;
    }
  }
</style>
