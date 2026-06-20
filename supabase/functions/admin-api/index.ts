import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const plans = {
  free: { label: 'Free', amount: 0 },
  basic: { label: 'Basic', amount: 299 },
  pro: { label: 'Pro', amount: 499 },
  premium: { label: 'Premium', amount: 999 },
} as const;

type Plan = keyof typeof plans;
type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase function environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && value in plans;
}

function isPaidPlan(value: unknown): value is Exclude<Plan, 'free'> {
  return value === 'basic' || value === 'pro' || value === 'premium';
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === 'completed' || value === 'pending' || value === 'failed' || value === 'refunded';
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Missing authorization token.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const user = userData.user;

  if (userError || !user?.email) {
    throw new Response(JSON.stringify({ error: 'Invalid session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: linkedAdmin, error: linkedAdminError } = await supabaseAdmin
    .from('admin_users')
    .select('id, user_id, email, display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (linkedAdminError) {
    throw linkedAdminError;
  }

  let adminRow = linkedAdmin;

  if (!adminRow) {
    const { data: emailAdmin, error: emailAdminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, user_id, email, display_name')
      .ilike('email', user.email)
      .maybeSingle();

    if (emailAdminError) {
      throw emailAdminError;
    }

    adminRow = emailAdmin;
  }

  if (!adminRow) {
    throw new Response(JSON.stringify({ error: 'Admin access required.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!adminRow.user_id) {
    await supabaseAdmin
      .from('admin_users')
      .update({ user_id: user.id })
      .eq('id', adminRow.id);
  }

  return {
    id: user.id,
    email: user.email,
    display_name: adminRow.display_name,
  };
}

async function listAllUsers() {
  const perPage = 200;
  const allUsers = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to list users: ${response.status}`);
    }

    const payload = await response.json();
    const users = payload.users || [];

    if (!Array.isArray(users)) break;

    allUsers.push(...users);

    if (users.length < perPage) break;
    page += 1;
  }

  return allUsers;
}

async function listUsers() {
  const [users, { data: subscriptions, error: subscriptionError }] = await Promise.all([
    listAllUsers(),
    supabaseAdmin.from('user_subscriptions').select('*'),
  ]);

  if (subscriptionError) throw subscriptionError;

  const subscriptionsByUser = new Map((subscriptions || []).map((row) => [row.user_id, row]));

  return users.map((user) => {
    const subscription = subscriptionsByUser.get(user.id);
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      plan: subscription?.plan || 'free',
      started_at: subscription?.started_at || null,
      expires_at: subscription?.expires_at || null,
    };
  });
}

async function listPayments() {
  const [{ data: payments, error }, users] = await Promise.all([
    supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false }),
    listAllUsers(),
  ]);

  if (error) throw error;

  const usersById = new Map(users.map((user) => [user.id, user]));

  return (payments || []).map((payment) => {
    const user = usersById.get(payment.user_id);
    return {
      ...payment,
      user_email: user?.email || '',
      user_full_name: user?.user_metadata?.full_name || '',
    };
  });
}

async function listTestPapers() {
  const { data, error } = await supabaseAdmin
    .from('test_papers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data || []).map(async (paper) => {
      if (!paper.file_path) return { ...paper, signed_url: null };

      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('test-papers')
        .createSignedUrl(paper.file_path, 60 * 60);

      return {
        ...paper,
        signed_url: signedUrlData?.signedUrl || null,
      };
    }),
  );
}

async function assignPlan(payload: Record<string, unknown>) {
  const userId = text(payload.user_id);
  const plan = payload.plan;

  if (!userId || !isPlan(plan)) {
    return json({ error: 'A valid user and plan are required.' }, 400);
  }

  const startedAt = new Date();
  const expiresAt = plan === 'free'
    ? null
    : new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt,
      updated_at: startedAt.toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return json({ ok: true });
}

async function recordPayment(payload: Record<string, unknown>) {
  const userId = text(payload.user_id);
  const plan = payload.plan;
  const status = payload.status;
  const amount = number(payload.amount, NaN);
  const notes = text(payload.notes);

  if (!userId || !isPaidPlan(plan) || !isPaymentStatus(status) || !Number.isFinite(amount) || amount < 0) {
    return json({ error: 'A valid user, paid plan, amount, and status are required.' }, 400);
  }

  const paymentDate = new Date().toISOString();

  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      plan,
      amount,
      status,
      notes: notes || null,
      payment_date: paymentDate,
    });

  if (paymentError) throw paymentError;

  if (status === 'completed') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan,
        started_at: paymentDate,
        expires_at: expiresAt,
        updated_at: paymentDate,
      }, { onConflict: 'user_id' });

    if (subscriptionError) throw subscriptionError;
  }

  return json({ ok: true });
}

function validateQuestion(rawQuestion: unknown, index: number) {
  if (!rawQuestion || typeof rawQuestion !== 'object') {
    return `Question ${index + 1} is invalid.`;
  }

  const question = rawQuestion as Record<string, unknown>;
  const prompt = text(question.question);
  const section = text(question.section) || 'A';
  const topic = text(question.topic);
  const code = text(question.code);
  const options = Array.isArray(question.options)
    ? question.options.map((option) => text(option))
    : [];
  const correctAnswer = number(question.correct_answer, NaN);

  if (!prompt) return `Question ${index + 1} needs text.`;
  if (options.length < 2 || options.some((option) => !option)) {
    return `Question ${index + 1} needs at least two complete options.`;
  }
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    return `Question ${index + 1} has an invalid correct answer.`;
  }

  return {
    position: index + 1,
    section,
    topic: topic || null,
    question: prompt,
    code: code || null,
    options,
    correct_answer: correctAnswer,
  };
}

async function createManualTest(payload: Record<string, unknown>, adminUserId: string) {
  const title = text(payload.title);
  const description = text(payload.description);
  const durationMinutes = number(payload.duration_minutes, 60);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  if (!title || !Number.isInteger(durationMinutes) || durationMinutes <= 0 || questions.length === 0) {
    return json({ error: 'Title, duration, and at least one question are required.' }, 400);
  }

  const normalizedQuestions = questions.map(validateQuestion);
  const firstError = normalizedQuestions.find((question) => typeof question === 'string');
  if (firstError) return json({ error: firstError }, 400);

  const { data: paper, error: paperError } = await supabaseAdmin
    .from('test_papers')
    .insert({
      title,
      description: description || null,
      type: 'manual',
      duration_minutes: durationMinutes,
      questions_count: questions.length,
      created_by: adminUserId,
    })
    .select()
    .single();

  if (paperError) throw paperError;

  const questionRows = normalizedQuestions.map((question) => ({
    ...(question as Exclude<typeof question, string>),
    test_id: paper.id,
  }));

  const { error: questionsError } = await supabaseAdmin
    .from('test_questions')
    .insert(questionRows);

  if (questionsError) {
    await supabaseAdmin.from('test_papers').delete().eq('id', paper.id);
    throw questionsError;
  }
  return json({ ok: true, test_id: paper.id });
}

async function uploadTestFile(req: Request, adminUserId: string) {
  const formData = await req.formData();
  const title = text(formData.get('title'));
  const description = text(formData.get('description'));
  const durationMinutes = number(formData.get('duration_minutes'), 60);
  const file = formData.get('file');

  if (!title || !Number.isInteger(durationMinutes) || durationMinutes <= 0 || !(file instanceof File)) {
    return json({ error: 'Title, duration, and a file are required.' }, 400);
  }

  const originalName = file.name || 'uploaded-test-paper';
  const filePath = `${crypto.randomUUID()}/${safeFileName(originalName)}`;
  const fileBytes = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from('test-papers')
    .upload(filePath, fileBytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: paper, error: paperError } = await supabaseAdmin
    .from('test_papers')
    .insert({
      title,
      description: description || null,
      type: 'file',
      duration_minutes: durationMinutes,
      questions_count: 0,
      file_path: filePath,
      original_filename: originalName,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      created_by: adminUserId,
    })
    .select()
    .single();

  if (paperError) {
    await supabaseAdmin.storage.from('test-papers').remove([filePath]);
    throw paperError;
  }

  return json({ ok: true, test_id: paper.id });
}

async function deleteTestPaper(payload: Record<string, unknown>) {
  const testId = text(payload.test_id);
  if (!testId) return json({ error: 'A test paper is required.' }, 400);

  const { data: paper, error: lookupError } = await supabaseAdmin
    .from('test_papers')
    .select('id, file_path')
    .eq('id', testId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!paper) return json({ error: 'Test paper not found.' }, 404);

  const { error: deleteError } = await supabaseAdmin
    .from('test_papers')
    .delete()
    .eq('id', testId);

  if (deleteError) throw deleteError;

  if (paper.file_path) {
    await supabaseAdmin.storage.from('test-papers').remove([paper.file_path]);
  }

  return json({ ok: true });
}

async function deleteUser(payload: Record<string, unknown>) {
  const userId = text(payload.user_id);
  if (!userId) return json({ error: 'User ID is required.' }, 400);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;

  return json({ ok: true });
}

async function editTestPaper(payload: Record<string, unknown>) {
  const testId = text(payload.test_id);
  if (!testId) return json({ error: 'Test ID is required.' }, 400);

  const title = text(payload.title);
  const description = text(payload.description);
  const durationMinutes = number(payload.duration_minutes, NaN);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description || null;
  if (Number.isInteger(durationMinutes) && durationMinutes > 0) {
    updates.duration_minutes = durationMinutes;
  }

  const { error: updateError } = await supabaseAdmin
    .from('test_papers')
    .update(updates)
    .eq('id', testId);

  if (updateError) throw updateError;
  return json({ ok: true });
}

async function editTestQuestions(payload: Record<string, unknown>) {
  const testId = text(payload.test_id);
  if (!testId) return json({ error: 'Test ID is required.' }, 400);

  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  await supabaseAdmin.from('test_questions').delete().eq('test_id', testId);

  const normalizedQuestions = questions.map(validateQuestion);
  const firstError = normalizedQuestions.find((q) => typeof q === 'string');
  if (firstError) return json({ error: firstError }, 400);

  const questionRows = normalizedQuestions.map((q, i) => ({
    ...(q as Exclude<typeof q, string>),
    test_id: testId,
    position: i + 1,
  }));

  const { error: insertError } = await supabaseAdmin
    .from('test_questions')
    .insert(questionRows);

  if (insertError) throw insertError;

  await supabaseAdmin
    .from('test_papers')
    .update({
      questions_count: questions.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId);

  return json({ ok: true });
}

async function getAnalytics() {
  let users: any[] = [];
  let payments: { amount: string; status: string; created_at: string }[] | null = null;
  let testPapers: { id: string; type: string; questions_count: number }[] | null = null;
  let testResults: { id: string }[] | null = null;

  try { users = await listAllUsers(); } catch (e) { console.error('listAllUsers failed:', e); }
  try { ({ data: payments } = await supabaseAdmin.from('payments').select('amount, status, created_at')); } catch (e) { console.error('payments query failed:', e); }
  try { ({ data: testPapers } = await supabaseAdmin.from('test_papers').select('id, type, questions_count')); } catch (e) { console.error('test_papers query failed:', e); }
  try { ({ data: testResults } = await supabaseAdmin.from('test_results').select('id')); } catch (e) { console.error('test_results query failed:', e); }

  const completedPayments = (payments || []).filter((p) => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyRevenue: Record<string, number> = {};
  completedPayments.forEach((p) => {
    const date = new Date(p.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(p.amount || 0);
  });

  const currentMonthKey = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`;
  const lastMonthKey = `${thisYear}-${String(thisMonth).padStart(2, '0')}`;

  const currentMonthRevenue = monthlyRevenue[currentMonthKey] || 0;
  const lastMonthRevenue = monthlyRevenue[lastMonthKey] || 0;

  const revenueGrowth = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : '0';

  const planCounts: Record<string, number> = { free: 0, basic: 0, pro: 0, premium: 0 };
  try {
    const { data: subscriptions } = await supabaseAdmin.from('user_subscriptions').select('plan');
    (subscriptions || []).forEach((s) => {
      if (s.plan in planCounts) planCounts[s.plan]++;
    });
  } catch (e) { console.error('user_subscriptions query failed:', e); }

  const totalTests = (testPapers || []).reduce((sum, p) => sum + (p.questions_count || 0), 0);

  return {
    totalUsers: users.length,
    totalRevenue,
    currentMonthRevenue,
    lastMonthRevenue,
    revenueGrowth,
    planCounts,
    totalTestPapers: (testPapers || []).length,
    totalQuestions: totalTests,
    totalAttempts: (testResults || []).length,
    monthlyRevenue: Object.entries(monthlyRevenue)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .reverse(),
  };
}

async function getLeaderboard() {
  const [users, { data: results }, { data: papers }] = await Promise.all([
    listAllUsers(),
    supabaseAdmin.from('test_results').select('*'),
    supabaseAdmin.from('test_papers').select('id, title'),
  ]);

  const usersById = new Map(users.map(u => [u.id, u]));
  const papersById = new Map((papers || []).map(p => [p.id, p]));

  const userAttempts: Record<string, { count: number; totalScore: number; totalCorrect: number; totalQuestions: number }> = {};
  const bestScores: Record<string, { score: number; total: number; testId: string; testTitle: string; timeTaken: number }> = {};

  for (const r of (results || [])) {
    if (!userAttempts[r.user_id]) {
      userAttempts[r.user_id] = { count: 0, totalScore: 0, totalCorrect: 0, totalQuestions: 0 };
    }
    userAttempts[r.user_id].count++;
    userAttempts[r.user_id].totalCorrect += r.correct_answers;
    userAttempts[r.user_id].totalQuestions += r.total_questions;

    const pct = (r.correct_answers / r.total_questions) * 100;
    const existing = bestScores[r.user_id];
    if (!existing || pct > existing.score) {
      bestScores[r.user_id] = {
        score: pct,
        total: r.total_questions,
        testId: r.test_id,
        testTitle: papersById.get(r.test_id)?.title || 'Unknown',
        timeTaken: r.time_taken_seconds || 0,
      };
    }
  }

  const byAttempts = Object.entries(userAttempts)
    .map(([userId, data]) => ({
      userId,
      email: usersById.get(userId)?.email || 'Unknown',
      name: usersById.get(userId)?.user_metadata?.full_name || '',
      attempts: data.count,
      avgPercentage: Math.round((data.totalCorrect / data.totalQuestions) * 100),
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 100);

  const byScore = (results || [])
    .map(r => ({
      userId: r.user_id,
      email: usersById.get(r.user_id)?.email || 'Unknown',
      name: usersById.get(r.user_id)?.user_metadata?.full_name || '',
      testId: r.test_id,
      testTitle: papersById.get(r.test_id)?.title || 'Unknown',
      score: r.correct_answers,
      total: r.total_questions,
      percentage: Math.round((r.correct_answers / r.total_questions) * 100),
      timeTaken: r.time_taken_seconds || 0,
      completedAt: r.completed_at,
    }))
    .sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken)
    .slice(0, 100);

  const bySpeed = (results || [])
    .filter(r => r.time_taken_seconds > 0 && (r.correct_answers / r.total_questions) >= 0.6)
    .map(r => ({
      userId: r.user_id,
      email: usersById.get(r.user_id)?.email || 'Unknown',
      name: usersById.get(r.user_id)?.user_metadata?.full_name || '',
      testTitle: papersById.get(r.test_id)?.title || 'Unknown',
      percentage: Math.round((r.correct_answers / r.total_questions) * 100),
      timeTaken: r.time_taken_seconds || 0,
      completedAt: r.completed_at,
    }))
    .sort((a, b) => a.timeTaken - b.timeTaken)
    .slice(0, 100);

  return { byAttempts, byScore, bySpeed };
}

async function listTestResults() {
  const { data: results, error } = await supabaseAdmin
    .from('test_results')
    .select('*, test_papers(title)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const users = await listAllUsers();
  const usersById = new Map(users.map(u => [u.id, u]));

  return (results || []).map(r => ({
    id: r.id,
    user_id: r.user_id,
    user_email: usersById.get(r.user_id)?.email || 'Unknown',
    test_id: r.test_id,
    test_title: r.test_papers?.title || 'Unknown',
    score: r.score,
    total_questions: r.total_questions,
    correct_answers: r.correct_answers,
    time_taken_seconds: r.time_taken_seconds,
    started_at: r.started_at,
    completed_at: r.completed_at,
    created_at: r.created_at,
  }));
}

async function listNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function createNotification(payload: Record<string, unknown>) {
  const message = text(payload.message);
  const type = text(payload.type);

  if (!message || (type !== 'general' && type !== 'premium')) {
    return json({ error: 'Message and valid type (general/premium) are required.' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({ message, type })
    .select()
    .single();

  if (error) throw error;
  return { ok: true, notification: data };
}

async function deleteNotification(payload: Record<string, unknown>) {
  const id = text(payload.id);
  if (!id) return json({ error: 'Notification ID is required.' }, 400);

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  try {
    const admin = await requireAdmin(req);
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return uploadTestFile(req, admin.id);
    }

    const payload = await req.json().catch(() => ({}));
    const action = text(payload.action);

    switch (action) {
      case 'session':
        return json({ admin });
      case 'list-users':
        return json({ users: await listUsers() });
      case 'assign-plan':
        return assignPlan(payload);
      case 'delete-user':
        return json(await deleteUser(payload));
      case 'list-payments':
        return json({ payments: await listPayments() });
      case 'record-payment':
        return recordPayment(payload);
      case 'list-test-papers':
        return json({ test_papers: await listTestPapers() });
      case 'create-manual-test':
        return createManualTest(payload, admin.id);
      case 'delete-test-paper':
        return deleteTestPaper(payload);
      case 'edit-test-paper':
        return json(await editTestPaper(payload));
      case 'edit-test-questions':
        return json(await editTestQuestions(payload));
      case 'get-analytics':
        return json({ analytics: await getAnalytics() });
      case 'get-leaderboard':
        return json(await getLeaderboard());
      case 'list-test-results':
        return json({ results: await listTestResults() });
      case 'list-notifications':
        return json({ notifications: await listNotifications() });
      case 'create-notification':
        return json(await createNotification(payload));
      case 'delete-notification':
        return json(await deleteNotification(payload));
      default:
        return json({ error: 'Unknown admin action.' }, 400);
    }
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error.' }, 500);
  }
});

