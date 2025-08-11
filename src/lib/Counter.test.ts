import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Counter from './Counter.svelte';

describe('Counter Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(Counter);
    expect(getByText('count is 0')).toBeTruthy();
  });

  it('increments count when button is clicked', async () => {
    const { getByText } = render(Counter);
    const button = getByText('count is 0');
    
    await fireEvent.click(button);
    expect(getByText('count is 1')).toBeTruthy();
    
    await fireEvent.click(button);
    expect(getByText('count is 2')).toBeTruthy();
  });
});
