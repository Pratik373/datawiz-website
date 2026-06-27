import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabaseClient';

const ADMIN_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-api`;

let sessionCheckDone = false;

async function ensureSession() {
  if (sessionCheckDone) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.initialize();
  }
  sessionCheckDone = true;
}

async function getAccessToken() {
  await ensureSession();
  
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  const keys = Object.keys(localStorage).filter(k => k.includes('auth'));
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const data = JSON.parse(value);
        if (data?.access_token) {
          return data.access_token;
        }
      }
    } catch {}
  }
  
  throw new Error('Please sign in again.');
}

async function requestJson(body) {
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    throw new Error('Session expired. Please log in again.');
  }
  
  const response = await fetch(ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Server error: ' + text.substring(0, 100));
  }
  
  if (!response.ok) {
    throw new Error(payload.error || 'Admin request failed.');
  }
  return payload;
}

export function getAdminSession() {
  return requestJson({ action: 'session' });
}

export function listAdminUsers() {
  return requestJson({ action: 'list-users' });
}

export function assignAdminPlan(userId, plan) {
  return requestJson({ action: 'assign-plan', user_id: userId, plan });
}

export function listAdminPayments() {
  return requestJson({ action: 'list-payments' });
}

export function recordAdminPayment(payment) {
  return requestJson({ action: 'record-payment', ...payment });
}

export function listAdminTestPapers() {
  return requestJson({ action: 'list-test-papers' });
}

export function createManualAdminTest(test) {
  return requestJson({ action: 'create-manual-test', ...test });
}

export function deleteAdminTestPaper(testId) {
  return requestJson({ action: 'delete-test-paper', test_id: testId });
}

export async function uploadAdminTestFile(formData) {
  const accessToken = await getAccessToken();
  const response = await fetch(ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'File upload failed.');
  }
  return payload;
}

export function deleteAdminUser(userId) {
  return requestJson({ action: 'delete-user', user_id: userId });
}

export function editTestPaper(testId, updates) {
  return requestJson({ action: 'edit-test-paper', test_id: testId, ...updates });
}

export function getAnalytics() {
  return requestJson({ action: 'get-analytics' });
}

export function getLeaderboard() {
  return requestJson({ action: 'get-leaderboard' });
}

export function listAdminTestResults() {
  return requestJson({ action: 'list-test-results' });
}

export function listAdminNotifications() {
  return requestJson({ action: 'list-notifications' });
}

export function createAdminNotification(message, type) {
  return requestJson({ action: 'create-notification', message, type });
}

export function deleteAdminNotification(id) {
  return requestJson({ action: 'delete-notification', id });
}

export function listAdminSupportThreads() {
  return requestJson({ action: 'list-support-threads' });
}

export function getAdminSupportMessages(userId) {
  return requestJson({ action: 'get-support-messages', user_id: userId });
}

export function sendAdminSupportReply(userId, message, userEmail) {
  return requestJson({ action: 'send-support-reply', user_id: userId, message, user_email: userEmail });
}

