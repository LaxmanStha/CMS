import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (date === null || date === undefined || date === '') return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date) {
  if (date === null || date === undefined || date === '') return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const COLORS = {
  primary: '#2563EB',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#0EA5E9',
};

export const CHART_COLORS = [
  '#2563EB',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#22C55E',
];

export function getStatusColor(status) {
  const colors = {
    active: 'success',
    inactive: 'text-secondary',
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    overdue: 'danger',
    paid: 'success',
    cancelled: 'danger',
  };
  return colors[status] || 'text-secondary';
}

export function getStatusBadgeClass(status) {
  const classes = {
    active: 'bg-badge-green text-green-800 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    pending: 'bg-badge-yellow text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-badge-green text-green-800 dark:bg-green-900/30 dark:text-green-300',
    failed: 'bg-badge-red text-red-800 dark:bg-red-900/30 dark:text-red-300',
    overdue: 'bg-badge-red text-red-800 dark:bg-red-900/30 dark:text-red-300',
    paid: 'bg-badge-green text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-badge-red text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return classes[status] || classes.inactive;
}

export function animateCounter(element, start, end, duration = 2000) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOut);
    element.textContent = formatNumber(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

export function intersectionObserver(target, callback, options = {}) {
  const observer = new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options,
  });
  
  observer.observe(target);
  
  return () => observer.disconnect();
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

