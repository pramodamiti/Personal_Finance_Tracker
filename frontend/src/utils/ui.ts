export function extractErrorMessage(error: any): string | undefined {
  if (!error) {
    return undefined;
  }

  const data = error?.response?.data;
  const status = Number(error?.response?.status ?? 0);
  const code = String(error?.code ?? '').toUpperCase();
  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data?.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
  }

  if (!error?.response || code === 'ERR_NETWORK' || code === 'ECONNABORTED' || rawMessage === 'Network Error') {
    return 'Unable to reach the server. Check your connection and make sure the backend is running.';
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return 'You do not have permission to do this.';
  }

  if (status === 404) {
    return 'The requested data could not be found.';
  }

  if (status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.';
  }

  if (rawMessage) {
    return rawMessage;
  }

  return 'Something went wrong. Please try again.';
}

export function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
}
