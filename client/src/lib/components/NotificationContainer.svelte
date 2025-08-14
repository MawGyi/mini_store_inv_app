<script lang="ts">
  import { notifications } from '../stores/stores';
  import NotificationToast from './NotificationToast.svelte';
  
  function removeNotification(id: string) {
    notifications.update(n => n.filter(notification => notification.id !== id));
  }
</script>

<div class="notification-container">
  {#each $notifications as notification (notification.id)}
    <NotificationToast
      message={notification.message}
      type={notification.type}
      id={notification.id}
      on:close={() => removeNotification(notification.id)}
    />
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    top: var(--spacing-6);
    right: var(--spacing-6);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-2);
    max-width: 400px;
    pointer-events: none;
  }
  
  .notification-container > :global(*) {
    pointer-events: auto;
  }
  
  /* Responsive positioning */
  @media (max-width: 768px) {
    .notification-container {
      top: var(--spacing-4);
      right: var(--spacing-4);
      left: var(--spacing-4);
      align-items: stretch;
      max-width: none;
    }
  }
  
  @media (max-width: 480px) {
    .notification-container {
      top: var(--spacing-2);
      right: var(--spacing-2);
      left: var(--spacing-2);
    }
  }
</style>
