import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabaseClient';

const ADMIN_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-api`;

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Please sign in again.');
  }
  return session.access_token;
}

async function requestJson(body) {
  const accessToken = await getAccessToken();
  const response = await fetch(ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
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
