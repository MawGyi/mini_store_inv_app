<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { apiService } from '../services/api';
  import NotificationToast from './NotificationToast.svelte';

  interface ScannedItem {
    barcode: string;
    name: string;
    price: number;
    stock: number;
    id: string;
  }

  const dispatch = createEventDispatcher<{
    itemScanned: ScannedItem;
    close: void;
  }>();

  let isOpen = false;
  let scannerActive = false;
  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let scanning = false;
  let lastScanTime = 0;
  let scanHistory: ScannedItem[] = [];
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;

  // Manual barcode input
  let manualBarcode = '';
  let manualInputMode = false;

  export function open() {
    isOpen = true;
    initializeScanner();
  }

  export function close() {
    isOpen = false;
    cleanup();
    dispatch('close');
  }

  async function initializeScanner() {
    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        showNotification('error', 'ကင်မရာ ရရှိမနိုင်ပါ။ Manual Input ကို အသုံးပြုပါ။');
        manualInputMode = true;
        return;
      }

      // Request camera access
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        scannerActive = true;
        startScanning();
        showNotification('success', 'ဘားကုဒ်စကင်နာ အဆင်သင့်ဖြစ်ပါပြီ');
      }
    } catch (error) {
      console.error('Scanner initialization error:', error);
      showNotification('error', 'ကင်မရာ အသုံးပြုခွင့် လိုအပ်သည်။ Manual Input ကို အသုံးပြုပါ။');
      manualInputMode = true;
    }
  }

  function startScanning() {
    if (!scannerActive || scanning) return;
    
    scanning = true;
    scanFrame();
  }

  function scanFrame() {
    if (!scannerActive || !videoElement || !canvasElement) return;

    const canvas = canvasElement.getContext('2d');
    if (!canvas) return;

    // Draw video frame to canvas
    canvas.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Get image data for barcode detection
    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    
    // Simulate barcode detection (in a real implementation, you'd use a library like QuaggaJS or ZXing)
    const mockBarcode = detectMockBarcode(imageData);
    if (mockBarcode) {
      handleBarcodeDetected(mockBarcode);
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanFrame);
    }
  }

  function detectMockBarcode(imageData: ImageData): string | null {
    // Mock barcode detection - in reality, use a proper barcode library
    // For demo purposes, we'll simulate finding barcodes occasionally
    const now = Date.now();
    if (now - lastScanTime > 3000 && Math.random() > 0.7) {
      // Mock barcodes for demo
      const mockBarcodes = [
        '1234567890123',
        '9876543210987',
        '5555555555555',
        '1111111111111'
      ];
      lastScanTime = now;
      return mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    }
    return null;
  }

  async function handleBarcodeDetected(barcode: string) {
    console.log('Barcode detected:', barcode);
    
    try {
      // Search for item by barcode
      const response = await apiService.getItems({ search: barcode, limit: 1 });
      
      if (response.success && response.data) {
        const items = (response.data as any).items || response.data;
        if (Array.isArray(items) && items.length > 0) {
          const item = items[0];
          const scannedItem: ScannedItem = {
            barcode,
            name: item.name,
            price: item.price,
            stock: item.stock_quantity || 0,
            id: item._id || item.id
          };
          
          // Add to scan history
          scanHistory = [scannedItem, ...scanHistory.slice(0, 9)]; // Keep last 10 scans
          
          dispatch('itemScanned', scannedItem);
          showNotification('success', `ပစ္စည်း "${item.name}" ကို ရှာတွေ့ပါပြီ`);
        } else {
          showNotification('error', `ဘားကုဒ် "${barcode}" နှင့် ကိုက်ညီသော ပစ္စည်း မရှိပါ`);
        }
      } else {
        showNotification('error', 'ဘားကုဒ် ရှာဖွေခြင်းတွင် အမှားဖြစ်ပေါ်သည်');
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      showNotification('error', 'ဘားကုဒ် ရှာဖွေခြင်းတွင် အမှားဖြစ်ပေါ်သည်');
    }
  }

  async function handleManualSubmit() {
    if (!manualBarcode.trim()) {
      showNotification('error', 'ဘားကုဒ် ရိုက်ထည့်ပါ');
      return;
    }
    
    await handleBarcodeDetected(manualBarcode.trim());
    manualBarcode = '';
  }

  function cleanup() {
    scanning = false;
    scannerActive = false;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 4000);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  onDestroy(() => {
    cleanup();
  });
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
  <!-- Scanner Modal -->
  <button 
    class="scanner-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="scanner-title"
  >
    <div class="scanner-modal">
      <!-- Modal Header -->
      <div class="scanner-header">
        <div class="header-content">
          <h2 id="scanner-title">📱 ဘားကုဒ်စကင်နာ</h2>
          <p>ပစ္စည်းများကို လျင်မြန်စွာ ရှာဖွေရန် ဘားကုဒ်ကို စကင်လုပ်ပါ</p>
        </div>
        <button class="close-btn" on:click={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Scanner Content -->
      <div class="scanner-content">
        {#if !manualInputMode && scannerActive}
          <!-- Camera Scanner -->
          <div class="scanner-area">
            <div class="video-container">
              <video
                bind:this={videoElement}
                class="scanner-video"
                autoplay
                muted
                playsinline
              ></video>
              <canvas
                bind:this={canvasElement}
                class="scanner-canvas"
                width="640"
                height="480"
                style="display: none;"
              ></canvas>
              
              <!-- Scanner Overlay -->
              <div class="scanner-overlay">
                <div class="scanner-frame">
                  <div class="corner top-left"></div>
                  <div class="corner top-right"></div>
                  <div class="corner bottom-left"></div>
                  <div class="corner bottom-right"></div>
                </div>
                <div class="scanner-line"></div>
              </div>
              
              <!-- Status Indicator -->
              <div class="scanner-status">
                <div class="status-indicator active">
                  <div class="pulse"></div>
                  <span>စကင်လုပ်နေသည်...</span>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- Manual Input Mode -->
          <div class="manual-input-area">
            <div class="input-container">
              <div class="input-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H8L9 5H15L16 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 7H21M7 10H17M7 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3>ဘားကုဒ် ရိုက်ထည့်ရန်</h3>
              <p>ကင်မရာ မရရှိနိုင်ပါက ဘားကုဒ်ကို လက်ဖြင့် ရိုက်ထည့်နိုင်ပါသည်</p>
              
              <div class="input-group">
                <input
                  type="text"
                  bind:value={manualBarcode}
                  placeholder="ဘားကုဒ် ရိုက်ထည့်ပါ"
                  class="barcode-input"
                  on:keydown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button class="scan-btn" on:click={handleManualSubmit}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  ရှာရန်
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Mode Toggle -->
        <div class="mode-toggle">
          {#if !manualInputMode}
            <button class="toggle-btn" on:click={() => {manualInputMode = true; cleanup()}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3C17.5523 3 18 3.44772 18 4V20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20V4C6 3.44772 6.44772 3 7 3H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 9H15M9 13H15M9 17H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              လက်ဖြင့် ရိုက်ထည့်ရန်
            </button>
          {:else}
            <button class="toggle-btn" on:click={() => {manualInputMode = false; initializeScanner()}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 19C23 19.5523 22.5523 20 22 20H2C1.44772 20 1 19.5523 1 19V5C1 4.44772 1.44772 4 2 4H22C22.5523 4 23 4.44772 23 5V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ကင်မရာ စကင်နာ
            </button>
          {/if}
        </div>

        <!-- Scan History -->
        {#if scanHistory.length > 0}
          <div class="scan-history">
            <h4>📋 လတ်တလော စကင်လုပ်ခဲ့သော ပစ္စည်းများ</h4>
            <div class="history-list">
              {#each scanHistory as item}
                <div class="history-item">
                  <div class="item-info">
                    <span class="item-name">{item.name}</span>
                    <span class="item-barcode">{item.barcode}</span>
                  </div>
                  <div class="item-details">
                    <span class="item-price">{item.price.toLocaleString()} ကျပ်</span>
                    <span class="item-stock">လက်ကျန်: {item.stock}</span>
                  </div>
                  <button 
                    class="select-btn" 
                    on:click={() => dispatch('itemScanned', item)}
                  >
                    ရွေးချယ်ရန်
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="scanner-footer">
        <div class="footer-info">
          <span class="scanner-tip">
            💡 အကြံပြုချက်: ဘားကုဒ်ကို တန်းတန်းလျဉ်းလျဉ်း ကင်မရာ ရှေ့တွင် ထားပါ
          </span>
        </div>
        <button class="btn btn-secondary" on:click={close}>
          ပိတ်ရန်
        </button>
      </div>
    </div>
  </button>
{/if}

<style>
  .scanner-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .scanner-modal {
    background: white;
    border-radius: 1rem;
    width: 100%;
    max-width: 800px;
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

  .scanner-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
  }

  .header-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .header-content p {
    margin: 0;
    opacity: 0.9;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 0.5rem;
    color: white;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .scanner-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  /* Camera Scanner */
  .scanner-area {
    margin-bottom: 2rem;
  }

  .video-container {
    position: relative;
    background: #000;
    border-radius: 1rem;
    overflow: hidden;
    aspect-ratio: 4/3;
    max-height: 400px;
  }

  .scanner-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scanner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .scanner-frame {
    position: relative;
    width: 250px;
    height: 150px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 0.5rem;
  }

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #3b82f6;
  }

  .corner.top-left {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }

  .corner.top-right {
    top: -3px;
    right: -3px;
    border-left: none;
    border-bottom: none;
  }

  .corner.bottom-left {
    bottom: -3px;
    left: -3px;
    border-right: none;
    border-top: none;
  }

  .corner.bottom-right {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
  }

  .scanner-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
    animation: scannerLine 2s linear infinite;
  }

  @keyframes scannerLine {
    0%, 100% {
      transform: translateY(-75px);
      opacity: 0;
    }
    50% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .scanner-status {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    text-align: center;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 1.5rem;
    font-size: 0.875rem;
  }

  .pulse {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.5;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  /* Manual Input */
  .manual-input-area {
    text-align: center;
    padding: 2rem;
  }

  .input-container {
    max-width: 400px;
    margin: 0 auto;
  }

  .input-icon {
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .input-container h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .input-container p {
    color: #64748b;
    margin: 0 0 2rem 0;
  }

  .input-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .barcode-input {
    flex: 1;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .barcode-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .scan-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .scan-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }

  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #f8fafc;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .toggle-btn:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
  }

  /* Scan History */
  .scan-history {
    margin-top: 2rem;
  }

  .scan-history h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-name {
    font-weight: 500;
    color: #1e293b;
  }

  .item-barcode {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: 'Courier New', monospace;
  }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: right;
  }

  .item-price {
    font-weight: 600;
    color: #059669;
  }

  .item-stock {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .select-btn {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .select-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
  }

  /* Modal Footer */
  .scanner-footer {
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

  /* Responsive Design */
  @media (max-width: 768px) {
    .scanner-backdrop {
      padding: 0.5rem;
    }

    .scanner-modal {
      max-height: 95vh;
    }

    .scanner-header,
    .scanner-content {
      padding: 1.5rem;
    }

    .scanner-footer {
      padding: 1rem 1.5rem;
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .footer-info {
      text-align: center;
    }

    .input-group {
      flex-direction: column;
    }

    .scan-btn {
      justify-content: center;
    }

    .history-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .item-details {
      text-align: left;
    }

    .select-btn {
      align-self: stretch;
      justify-content: center;
    }
  }
</style>
