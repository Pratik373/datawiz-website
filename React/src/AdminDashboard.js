import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  assignAdminPlan,
  createManualAdminTest,
  deleteAdminTestPaper,
  getAdminSession,
  listAdminPayments,
  listAdminTestPapers,
  listAdminUsers,
  recordAdminPayment,
  uploadAdminTestFile,
} from './adminApi';
import { supabase } from './supabaseClient';
import './AdminDashboard.css';

const logoUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg';

const plans = {
  free: { label: 'Free', amount: 0 },
  basic: { label: 'Basic', amount: 299 },
  pro: { label: 'Pro', amount: 499 },
  premium: { label: 'Premium', amount: 999 },
};

const paidPlans = ['basic', 'pro', 'premium'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [admin, setAdmin] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (sessionStorage.getItem('tempAdminSession') === 'true') {
        if (active) {
          setAdmin({ email: 'adminspp@datawiz.com' });
          setPageLoading(false);
        }
        return;
      }

      try {
        const { admin: adminUser } = await getAdminSession();
        if (active) setAdmin(adminUser);
      } catch (_error) {
        navigate('/admin/login', { replace: true });
      } finally {
        if (active) setPageLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, [navigate]);

  const showNotice = useCallback((message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const handleLogout = async () => {
    sessionStorage.removeItem('tempAdminSession');
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/admin/login', { replace: true });
  };

  if (pageLoading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src={logoUrl} alt="Datawiz6" />
          <div>
            <strong>Datawiz6 Admin</strong>
            <span>{admin?.email}</span>
          </div>
        </div>
        <button className="admin-secondary-btn" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {[
          ['users', 'Users'],
          ['tests', 'Test Papers'],
          ['payments', 'Payments'],
          ['upload', 'Create Test'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? 'active' : ''}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {notice && <div className={`admin-notice ${notice.type}`}>{notice.message}</div>}
        {activeTab === 'users' && <UsersPanel showNotice={showNotice} />}
        {activeTab === 'tests' && <TestPapersPanel showNotice={showNotice} />}
        {activeTab === 'payments' && <PaymentsPanel showNotice={showNotice} />}
        {activeTab === 'upload' && <CreateTestPanel showNotice={showNotice} />}
      </main>
    </div>
  );
}

function UsersPanel({ showNotice }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users: nextUsers } = await listAdminUsers();
      setUsers(nextUsers);
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.full_name, user.id]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, users]);

  const handlePlanChange = async (userId, plan) => {
    setUpdatingId(userId);
    try {
      await assignAdminPlan(userId, plan);
      showNotice('Plan updated.');
      await fetchUsers();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <section className="admin-panel">
      <PanelHeader title="Users" subtitle="Registered users and their current mock-test plans." />

      <div className="admin-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users"
        />
        <button className="admin-secondary-btn" onClick={fetchUsers}>Refresh</button>
      </div>

      {loading ? (
        <div className="admin-empty">Loading users...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Change Plan</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const expired = user.expires_at && new Date(user.expires_at) < new Date();
                return (
                  <tr key={user.id}>
                    <td>{user.full_name || 'No name'}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td><PlanBadge plan={user.plan} /></td>
                    <td>{user.plan === 'free' ? 'Free' : expired ? 'Expired' : 'Active'}</td>
                    <td>
                      <select
                        value={user.plan}
                        onChange={(event) => handlePlanChange(user.id, event.target.value)}
                        disabled={updatingId === user.id}
                      >
                        {Object.entries(plans).map(([value, plan]) => (
                          <option key={value} value={value}>{plan.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="admin-empty">No users found.</div>}
        </div>
      )}
    </section>
  );
}

function PaymentsPanel({ showNotice }) {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    user_id: '',
    plan: 'basic',
    amount: plans.basic.amount,
    status: 'completed',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ payments: nextPayments }, { users: nextUsers }] = await Promise.all([
        listAdminPayments(),
        listAdminUsers(),
      ]);
      setPayments(nextPayments);
      setUsers(nextUsers);
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter((payment) => payment.status === filter);

  const handlePlanChange = (plan) => {
    setForm((current) => ({
      ...current,
      plan,
      amount: plans[plan].amount,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.user_id) {
      showNotice('Select a user first.', 'error');
      return;
    }

    setSaving(true);
    try {
      await recordAdminPayment({
        ...form,
        amount: Number(form.amount),
      });
      showNotice('Payment recorded.');
      setForm({
        user_id: '',
        plan: 'basic',
        amount: plans.basic.amount,
        status: 'completed',
        notes: '',
      });
      await fetchData();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <PanelHeader title="Payments" subtitle="Who paid, which plan they bought, and manual payment entry." />

      <div className="admin-toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <button className="admin-secondary-btn" onClick={fetchData}>Refresh</button>
      </div>

      {loading ? (
        <div className="admin-empty">Loading payments...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.user_full_name || payment.user_email || 'Unknown user'}</td>
                  <td><PlanBadge plan={payment.plan} /></td>
                  <td>{payment.currency} {Number(payment.amount).toFixed(2)}</td>
                  <td><span className={`payment-status ${payment.status}`}>{payment.status}</span></td>
                  <td>{formatDate(payment.payment_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && <div className="admin-empty">No payments found.</div>}
        </div>
      )}

      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <h3>Record Payment</h3>
        <label>
          <span>User</span>
          <select
            value={form.user_id}
            onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.email}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Plan</span>
          <select value={form.plan} onChange={(event) => handlePlanChange(event.target.value)}>
            {paidPlans.map((plan) => (
              <option key={plan} value={plan}>{plans[plan].label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input
            type="number"
            min="0"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          />
        </label>
        <label>
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
        <label className="admin-form-full">
          <span>Notes</span>
          <textarea
            rows="2"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Optional note"
          />
        </label>
        <button className="admin-primary-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Payment'}
        </button>
      </form>
    </section>
  );
}

function TestPapersPanel({ showNotice }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { test_papers: nextTests } = await listAdminTestPapers();
      setTests(nextTests);
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleDelete = async (testId) => {
    if (!window.confirm('Delete this test paper?')) return;
    setDeletingId(testId);
    try {
      await deleteAdminTestPaper(testId);
      showNotice('Test paper deleted.');
      await fetchTests();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <section className="admin-panel">
      <PanelHeader title="Test Papers" subtitle="Manual online tests and uploaded source files." />
      <div className="admin-toolbar">
        <button className="admin-secondary-btn" onClick={fetchTests}>Refresh</button>
      </div>

      {loading ? (
        <div className="admin-empty">Loading test papers...</div>
      ) : tests.length === 0 ? (
        <div className="admin-empty">No test papers created yet.</div>
      ) : (
        <div className="test-paper-list">
          {tests.map((test) => (
            <article key={test.id} className="test-paper-row">
              <div>
                <div className="test-paper-title-row">
                  <h3>{test.title}</h3>
                  <span>{test.type}</span>
                </div>
                <p>{test.description || 'No description'}</p>
                <small>
                  {test.duration_minutes} min | {test.questions_count} questions | {formatDate(test.created_at)}
                </small>
              </div>
              <div className="test-paper-actions">
                {test.signed_url && (
                  <a href={test.signed_url} target="_blank" rel="noopener noreferrer">
                    View File
                  </a>
                )}
                <button
                  onClick={() => handleDelete(test.id)}
                  disabled={deletingId === test.id}
                >
                  {deletingId === test.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CreateTestPanel({ showNotice }) {
  const [mode, setMode] = useState('manual');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionDraft, setQuestionDraft] = useState({
    section: 'A',
    topic: '',
    question: '',
    code: '',
    options: ['', '', '', ''],
    correct_answer: 0,
  });
  const [saving, setSaving] = useState(false);

  const resetCommonFields = () => {
    setTitle('');
    setDescription('');
    setDuration(60);
    setFile(null);
    setQuestions([]);
    setQuestionDraft({
      section: 'A',
      topic: '',
      question: '',
      code: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });
  };

  const addQuestion = () => {
    if (!questionDraft.question.trim() || questionDraft.options.some((option) => !option.trim())) {
      showNotice('Complete the question text and all options first.', 'error');
      return;
    }

    setQuestions((current) => [...current, {
      ...questionDraft,
      options: questionDraft.options.map((option) => option.trim()),
      question: questionDraft.question.trim(),
      topic: questionDraft.topic.trim(),
      code: questionDraft.code.trim(),
    }]);
    setQuestionDraft({
      section: 'A',
      topic: '',
      question: '',
      code: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });
  };

  const removeQuestion = (index) => {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleManualSave = async () => {
    if (!title.trim() || questions.length === 0) {
      showNotice('Add a title and at least one question.', 'error');
      return;
    }

    setSaving(true);
    try {
      await createManualAdminTest({
        title: title.trim(),
        description: description.trim(),
        duration_minutes: Number(duration),
        questions,
      });
      showNotice('Manual test created.');
      resetCommonFields();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!title.trim() || !file) {
      showNotice('Add a title and choose a file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('duration_minutes', String(duration));
    formData.append('file', file);

    setSaving(true);
    try {
      await uploadAdminTestFile(formData);
      showNotice('File test uploaded.');
      resetCommonFields();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <PanelHeader title="Create Test" subtitle="Build an online test manually or upload a source file in any format." />

      <div className="mode-switch">
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
          Manual
        </button>
        <button className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')}>
          File Upload
        </button>
      </div>

      <div className="admin-form-grid create-test-form">
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          <span>Duration (minutes)</span>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </label>
        <label className="admin-form-full">
          <span>Description</span>
          <textarea
            rows="3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>

      {mode === 'file' ? (
        <div className="file-upload-block">
          <label>
            <span>Test paper file</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button className="admin-primary-btn" onClick={handleFileUpload} disabled={saving}>
            {saving ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      ) : (
        <>
          <div className="question-editor">
            <h3>Add Question</h3>
            <div className="admin-form-grid">
              <label>
                <span>Section</span>
                <select
                  value={questionDraft.section}
                  onChange={(event) => setQuestionDraft((current) => ({ ...current, section: event.target.value }))}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </label>
              <label>
                <span>Topic</span>
                <input
                  value={questionDraft.topic}
                  onChange={(event) => setQuestionDraft((current) => ({ ...current, topic: event.target.value }))}
                />
              </label>
              <label className="admin-form-full">
                <span>Question</span>
                <textarea
                  rows="3"
                  value={questionDraft.question}
                  onChange={(event) => setQuestionDraft((current) => ({ ...current, question: event.target.value }))}
                />
              </label>
              <label className="admin-form-full">
                <span>Code snippet (optional)</span>
                <textarea
                  rows="3"
                  value={questionDraft.code}
                  onChange={(event) => setQuestionDraft((current) => ({ ...current, code: event.target.value }))}
                />
              </label>
            </div>

            <div className="option-grid">
              {questionDraft.options.map((option, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    checked={questionDraft.correct_answer === index}
                    onChange={() => setQuestionDraft((current) => ({ ...current, correct_answer: index }))}
                  />
                  <input
                    value={option}
                    onChange={(event) => {
                      const nextOptions = [...questionDraft.options];
                      nextOptions[index] = event.target.value;
                      setQuestionDraft((current) => ({ ...current, options: nextOptions }));
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                </label>
              ))}
            </div>

            <button className="admin-secondary-btn" onClick={addQuestion}>Add Question</button>
          </div>

          <div className="question-list">
            <h3>Questions Added</h3>
            {questions.length === 0 ? (
              <div className="admin-empty">No questions added yet.</div>
            ) : (
              questions.map((question, index) => (
                <div key={`${question.section}-${index}`} className="question-row">
                  <div>
                    <strong>Q{index + 1}</strong>
                    <span>{question.question}</span>
                  </div>
                  <button onClick={() => removeQuestion(index)}>Remove</button>
                </div>
              ))
            )}
          </div>

          <button className="admin-primary-btn" onClick={handleManualSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Manual Test'}
          </button>
        </>
      )}
    </section>
  );
}

function PanelHeader({ title, subtitle }) {
  return (
    <header className="panel-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function PlanBadge({ plan }) {
  return <span className={`plan-badge ${plan}`}>{plans[plan]?.label || plan}</span>;
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}
