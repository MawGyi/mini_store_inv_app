<script lang="ts">
  import { t, formatCurrency, formatDate, useTranslations } from '../stores/translationHelpers';
  import { currentLanguage } from '../stores/language';
  
  // Example of using useTranslations for multiple keys
  const demoTexts = useTranslations([
    'common.search',
    'common.add', 
    'common.edit',
    'common.delete',
    'inventory.title',
    'pos.title',
    'reports.title'
  ]);
  
  // Sample data
  const samplePrice = 15000;
  const sampleDate = new Date();
</script>

<div class="demo-container">
  <div class="demo-header">
    <h2>🌍 Language System Demo</h2>
    <p>Current Language: <strong>{$currentLanguage === 'my' ? 'မြန်မာ' : 'English'}</strong></p>
  </div>
  
  <div class="demo-sections">
    <!-- Navigation Demo -->
    <section class="demo-section">
      <h3>🧭 Navigation</h3>
      <div class="demo-buttons">
        <button class="demo-btn primary">{$t('nav.dashboard')}</button>
        <button class="demo-btn secondary">{$t('nav.inventory')}</button>
        <button class="demo-btn success">{$t('nav.pos')}</button>
        <button class="demo-btn info">{$t('nav.reports')}</button>
      </div>
    </section>
    
    <!-- Common Actions Demo -->
    <section class="demo-section">
      <h3>⚡ Common Actions</h3>
      <div class="demo-buttons">
        <button class="demo-btn outline">{$demoTexts['common.search']}</button>
        <button class="demo-btn outline">{$demoTexts['common.add']}</button>
        <button class="demo-btn outline">{$demoTexts['common.edit']}</button>
        <button class="demo-btn outline">{$demoTexts['common.delete']}</button>
      </div>
    </section>
    
    <!-- Formatting Demo -->
    <section class="demo-section">
      <h3>💰 Localized Formatting</h3>
      <div class="demo-formats">
        <div class="format-item">
          <span class="format-label">Currency:</span>
          <span class="format-value">{$formatCurrency(samplePrice)}</span>
        </div>
        <div class="format-item">
          <span class="format-label">Date:</span>
          <span class="format-value">{$formatDate(sampleDate)}</span>
        </div>
      </div>
    </section>
    
    <!-- Status Messages Demo -->
    <section class="demo-section">
      <h3>📊 Status Messages</h3>
      <div class="demo-status">
        <div class="status-card available">
          <div class="status-icon">✅</div>
          <div class="status-text">{$t('inventory.available')}</div>
        </div>
        <div class="status-card warning">
          <div class="status-icon">⚠️</div>
          <div class="status-text">{$t('inventory.lowStock')}</div>
        </div>
        <div class="status-card error">
          <div class="status-icon">❌</div>
          <div class="status-text">{$t('inventory.outOfStock')}</div>
        </div>
      </div>
    </section>
    
    <!-- Notifications Demo -->
    <section class="demo-section">
      <h3>🔔 Notifications</h3>
      <div class="demo-notifications">
        <div class="notification success">
          <span class="notification-icon">✅</span>
          <span class="notification-text">{$t('notification.itemAdded')}</span>
        </div>
        <div class="notification info">
          <span class="notification-icon">ℹ️</span>
          <span class="notification-text">{$t('notification.itemUpdated')}</span>
        </div>
        <div class="notification success">
          <span class="notification-icon">🛒</span>
          <span class="notification-text">{$t('notification.saleCompleted')}</span>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
  .demo-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .demo-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--gray-200);
  }
  
  .demo-header h2 {
    color: var(--primary-600);
    margin-bottom: 0.5rem;
  }
  
  .demo-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .demo-section {
    padding: 1.5rem;
    background: var(--gray-50);
    border-radius: 0.75rem;
    border: 1px solid var(--gray-200);
  }
  
  .demo-section h3 {
    margin: 0 0 1rem 0;
    color: var(--gray-700);
    font-size: 1.125rem;
  }
  
  .demo-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .demo-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }
  
  .demo-btn.primary {
    background: var(--primary-500);
    color: white;
  }
  
  .demo-btn.secondary {
    background: var(--gray-500);
    color: white;
  }
  
  .demo-btn.success {
    background: var(--success-500);
    color: white;
  }
  
  .demo-btn.info {
    background: var(--primary-400);
    color: white;
  }
  
  .demo-btn.outline {
    background: white;
    border: 2px solid var(--primary-500);
    color: var(--primary-500);
  }
  
  .demo-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .demo-formats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .format-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-200);
  }
  
  .format-label {
    font-weight: 600;
    color: var(--gray-600);
  }
  
  .format-value {
    font-weight: 700;
    color: var(--primary-600);
    font-family: monospace;
  }
  
  .demo-status {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .status-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-200);
  }
  
  .status-card.available {
    border-left: 4px solid var(--success-500);
  }
  
  .status-card.warning {
    border-left: 4px solid var(--warning-500);
  }
  
  .status-card.error {
    border-left: 4px solid var(--danger-500);
  }
  
  .status-icon {
    font-size: 1.25rem;
  }
  
  .status-text {
    font-weight: 500;
    color: var(--gray-700);
  }
  
  .demo-notifications {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .notification {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-200);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .notification.success {
    background: var(--success-50);
    border-color: var(--success-200);
  }
  
  .notification.info {
    background: var(--primary-50);
    border-color: var(--primary-200);
  }
  
  .notification-icon {
    font-size: 1.125rem;
  }
  
  .notification-text {
    color: var(--gray-700);
    font-weight: 500;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .demo-container {
      margin: 1rem;
      padding: 1rem;
    }
    
    .demo-buttons {
      flex-direction: column;
    }
    
    .demo-btn {
      min-width: auto;
      width: 100%;
    }
    
    .demo-status {
      grid-template-columns: 1fr;
    }
  }
</style>
