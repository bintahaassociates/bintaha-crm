import { GOOGLE_APPS_SCRIPT_URL } from './supabase';

export async function syncInquiryToGoogleScript(data: {
  name: string;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    return { success: false, error: 'Google Apps Script URL not configured' };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        ...data,
        source: data.source || 'crm_web',
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true };
  } catch (err) {
    console.error('Google Apps Script webhook failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchInquiriesFromGoogleScript(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    return { success: false, error: 'Google Apps Script URL not configured' };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });

    return { success: true, data: [] };
  } catch (err) {
    console.error('Google Apps Script fetch failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
