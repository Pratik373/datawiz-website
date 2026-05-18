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
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users || [];
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
      default:
        return json({ error: 'Unknown admin action.' }, 400);
    }
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error.' }, 500);
  }
});
