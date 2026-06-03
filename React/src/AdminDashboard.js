import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  assignAdminPlan,
  createManualAdminTest,
  deleteAdminTestPaper,
  deleteAdminUser,
  editTestPaper,
  getAdminSession,
  getAnalytics,
  getLeaderboard,
  listAdminPayments,
  listAdminTestPapers,
  listAdminTestResults,
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
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { admin: adminUser } = await getAdminSession();
        if (active) setAdmin(adminUser);
      } catch (_error) {
        if (active) {
          navigate('/admin/login', { replace: true });
        }
        return;
      }
      if (active) setPageLoading(false);
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
          <img src={logoUrl} alt="DataWiz" />
          <div>
            <strong>DataWiz Admin</strong>
            <span>{admin?.email}</span>
          </div>
        </div>
        <button className="admin-secondary-btn" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {[
          ['analytics', 'Analytics'],
          ['users', 'Users'],
          ['leaderboard', 'Leaderboard'],
          ['tests', 'Test Papers'],
          ['results', 'Test Results'],
          ['payments', 'Payments'],
          ['upload', 'Create Test'],
          ['whitelist', '🛡 Beta Access'],
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
        {activeTab === 'analytics' && <AnalyticsPanel showNotice={showNotice} />}
        {activeTab === 'users' && <UsersPanel showNotice={showNotice} />}
        {activeTab === 'leaderboard' && <LeaderboardPanel showNotice={showNotice} />}
        {activeTab === 'tests' && <TestPapersPanel showNotice={showNotice} />}
        {activeTab === 'results' && <TestResultsPanel showNotice={showNotice} />}
        {activeTab === 'payments' && <PaymentsPanel showNotice={showNotice} />}
        {activeTab === 'upload' && <CreateTestPanel showNotice={showNotice} />}
        {activeTab === 'whitelist' && <WhitelistPanel showNotice={showNotice} />}
      </main>
    </div>
  );
}

function AnalyticsPanel({ showNotice }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { analytics: data } = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        showNotice(error.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [showNotice]);

  if (loading) {
    return <div className="admin-empty">Loading analytics...</div>;
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <section className="admin-panel">
      <PanelHeader title="Analytics" subtitle="Overview of platform statistics and revenue." />

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-value">{analytics?.totalUsers || 0}</div>
          <div className="analytics-label">Total Users</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-value">{analytics?.totalTestPapers || 0}</div>
          <div className="analytics-label">Test Papers</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-value">{analytics?.totalQuestions || 0}</div>
          <div className="analytics-label">Total Questions</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-value">{analytics?.totalAttempts || 0}</div>
          <div className="analytics-label">Test Attempts</div>
        </div>
        <div className="analytics-card highlight">
          <div className="analytics-value">{formatCurrency(analytics?.totalRevenue || 0)}</div>
          <div className="analytics-label">Total Revenue</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-value">{formatCurrency(analytics?.currentMonthRevenue || 0)}</div>
          <div className="analytics-label">This Month</div>
          <div className={`analytics-change ${Number(analytics?.revenueGrowth) >= 0 ? 'positive' : 'negative'}`}>
            {analytics?.revenueGrowth || 0}% vs last month
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-value">{formatCurrency(analytics?.lastMonthRevenue || 0)}</div>
          <div className="analytics-label">Last Month</div>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Users by Plan</h3>
        <div className="analytics-plan-bars">
          {Object.entries(analytics?.planCounts || {}).map(([plan, count]) => (
            <div key={plan} className="analytics-plan-bar">
              <span className="plan-name">{plans[plan]?.label || plan}</span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${(count / (analytics?.totalUsers || 1)) * 100}%` }} />
              </div>
              <span className="plan-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>Monthly Revenue</h3>
        <div className="analytics-chart">
          {analytics?.monthlyRevenue?.map(([month, amount]) => (
            <div key={month} className="chart-bar">
              <div className="bar" style={{ height: `${(amount / (analytics?.totalRevenue || 1)) * 100}%` }} />
              <span className="bar-label">{month}</span>
              <span className="bar-value">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UsersPanel({ showNotice }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkPlan, setBulkPlan] = useState('');
  const [deletingId, setDeletingId] = useState('');

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

  const handleBulkAssign = async () => {
    if (!bulkPlan || selectedUsers.size === 0) return;
    for (const userId of selectedUsers) {
      await assignAdminPlan(userId, bulkPlan);
    }
    setSelectedUsers(new Set());
    setBulkPlan('');
    await fetchUsers();
    showNotice('Plan assigned to selected users.');
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!window.confirm(`Delete ${selectedUsers.size} selected user(s)? This cannot be undone.`)) return;
    for (const userId of selectedUsers) {
      try {
        await deleteAdminUser(userId);
      } catch (e) {
        showNotice(`Failed to delete user: ${e.message}`, 'error');
      }
    }
    setSelectedUsers(new Set());
    await fetchUsers();
    showNotice('Selected users deleted.');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeletingId(userId);
    try {
      await deleteAdminUser(userId);
      await fetchUsers();
      showNotice('User deleted.');
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setDeletingId('');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Joined', 'Plan', 'Status'];
    const rows = filteredUsers.map(user => [
      user.full_name || '',
      user.email,
      formatDate(user.created_at),
      user.plan,
      user.plan === 'free' ? 'Free' : (user.expires_at && new Date(user.expires_at) < new Date()) ? 'Expired' : 'Active'
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
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
        <button className="admin-secondary-btn" onClick={exportToCSV}>Export CSV</button>
      </div>

      {selectedUsers.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.size} selected</span>
          <select value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}>
            <option value="">Assign Plan...</option>
            {Object.entries(plans).map(([value, plan]) => (
              <option key={value} value={value}>{plan.label}</option>
            ))}
          </select>
          <button className="admin-primary-btn" onClick={handleBulkAssign} disabled={!bulkPlan}>Apply</button>
          <button className="admin-danger-btn" onClick={handleBulkDelete}>Delete Selected</button>
        </div>
      )}

      {loading ? (
        <div className="admin-empty">Loading users...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} /></th>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Change Plan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const expired = user.expires_at && new Date(user.expires_at) < new Date();
                return (
                  <tr key={user.id}>
                    <td><input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleSelect(user.id)} /></td>
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
                    <td>
                      <button className="admin-danger-btn-small" onClick={() => handleDeleteUser(user.id)} disabled={deletingId === user.id}>
                        {deletingId === user.id ? '...' : 'Delete'}
                      </button>
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
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingTest, setEditingTest] = useState(null);

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

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesSearch = !search || test.title.toLowerCase().includes(search.toLowerCase()) || (test.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || test.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [tests, search, filterType]);

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

  const handleEditSave = async () => {
    if (!editingTest) return;
    try {
      await editTestPaper(editingTest.id, {
        title: editingTest.title,
        description: editingTest.description,
        duration_minutes: editingTest.duration_minutes
      });
      showNotice('Test paper updated.');
      setEditingTest(null);
      await fetchTests();
    } catch (error) {
      showNotice(error.message, 'error');
    }
  };

  if (editingTest) {
    return (
      <section className="admin-panel">
        <PanelHeader title="Edit Test Paper" subtitle={`Editing: ${editingTest.title}`} />
        <div className="edit-form">
          <label>
            Title
            <input type="text" value={editingTest.title} onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })} />
          </label>
          <label>
            Description
            <textarea value={editingTest.description || ''} onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })} />
          </label>
          <label>
            Duration (minutes)
            <input type="number" value={editingTest.duration_minutes} onChange={(e) => setEditingTest({ ...editingTest, duration_minutes: parseInt(e.target.value) || 60 })} />
          </label>
          <div className="edit-actions">
            <button className="admin-primary-btn" onClick={handleEditSave}>Save Changes</button>
            <button className="admin-secondary-btn" onClick={() => setEditingTest(null)}>Cancel</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-panel">
      <PanelHeader title="Test Papers" subtitle="Manual online tests and uploaded source files." />
      <div className="admin-toolbar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search test papers" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="manual">Manual</option>
          <option value="file">File</option>
        </select>
        <button className="admin-secondary-btn" onClick={fetchTests}>Refresh</button>
      </div>

      {loading ? (
        <div className="admin-empty">Loading test papers...</div>
      ) : filteredTests.length === 0 ? (
        <div className="admin-empty">{tests.length === 0 ? 'No test papers created yet.' : 'No test papers match your search.'}</div>
      ) : (
        <div className="test-paper-list">
          {filteredTests.map((test) => (
            <article key={test.id} className="test-paper-row">
              <div>
                <div className="test-paper-title-row">
                  <h3>{test.title}</h3>
                  <span className={`type-badge type-${test.type}`}>{test.type}</span>
                </div>
                <p>{test.description || 'No description'}</p>
                <small>
                  {test.duration_minutes} min | {test.questions_count} questions | {formatDate(test.created_at)}
                </small>
              </div>
              <div className="test-paper-actions">
                {test.type === 'manual' && (
                  <button onClick={() => setEditingTest(test)}>Edit</button>
                )}
                {test.signed_url && (
                  <a href={test.signed_url} target="_blank" rel="noopener noreferrer">View File</a>
                )}
                <button className="admin-danger-btn-small" onClick={() => handleDelete(test.id)} disabled={deletingId === test.id}>
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

function TestResultsPanel({ showNotice }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const { results: data } = await listAdminTestResults();
      setResults(data);
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredResults = useMemo(() => {
    if (!search) return results;
    const q = search.toLowerCase();
    return results.filter(r =>
      r.user_email.toLowerCase().includes(q) ||
      r.test_title.toLowerCase().includes(q)
    );
  }, [results, search]);

  const exportCSV = () => {
    const headers = ['User Email', 'Test Title', 'Score', 'Total Questions', 'Correct Answers', 'Time (sec)', 'Completed At'];
    const rows = filteredResults.map(r => [
      r.user_email,
      r.test_title,
      r.score,
      r.total_questions,
      r.correct_answers,
      r.time_taken_seconds || '',
      formatDate(r.completed_at)
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-panel">
      <PanelHeader title="Test Results" subtitle="Scores and attempts by users on test papers." />
      <div className="admin-toolbar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or test" />
        <button className="admin-secondary-btn" onClick={fetchResults}>Refresh</button>
        <button className="admin-secondary-btn" onClick={exportCSV}>Export CSV</button>
      </div>

      {loading ? (
        <div className="admin-empty">Loading results...</div>
      ) : filteredResults.length === 0 ? (
        <div className="admin-empty">{results.length === 0 ? 'No test results yet.' : 'No results match your search.'}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Test</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Time</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => {
                const percentage = Math.round((r.correct_answers / r.total_questions) * 100);
                const minutes = Math.floor((r.time_taken_seconds || 0) / 60);
                const seconds = (r.time_taken_seconds || 0) % 60;
                return (
                  <tr key={r.id}>
                    <td>{r.user_email}</td>
                    <td>{r.test_title}</td>
                    <td>{r.correct_answers}/{r.total_questions}</td>
                    <td>
                      <span className={`score-badge ${percentage >= 60 ? 'pass' : 'fail'}`}>
                        {percentage}%
                      </span>
                    </td>
                    <td>{minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}</td>
                    <td>{formatDate(r.completed_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LeaderboardPanel({ showNotice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('attempts');

  useEffect(() => {
    async function load() {
      try {
        const result = await getLeaderboard();
        setData(result);
      } catch (error) {
        showNotice(error.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showNotice]);

  if (loading) return <div className="admin-empty">Loading leaderboard...</div>;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const views = [
    ['attempts', 'Most Attempts'],
    ['scores', 'Top Scores'],
    ['speed', 'Fastest Times'],
  ];

  let rows = [];
  let columns = [];

  if (view === 'attempts') {
    columns = ['#', 'User', 'Email', 'Tests', 'Avg %'];
    rows = (data?.byAttempts || []).map((r, i) => (
      <tr key={r.userId}>
        <td className="rank">{i + 1}</td>
        <td>{r.name || 'No name'}</td>
        <td>{r.email}</td>
        <td><strong>{r.attempts}</strong></td>
        <td><span className={`score-badge ${r.avgPercentage >= 60 ? 'pass' : 'fail'}`}>{r.avgPercentage}%</span></td>
      </tr>
    ));
  } else if (view === 'scores') {
    columns = ['#', 'User', 'Email', 'Test', 'Score', '%', 'Time'];
    rows = (data?.byScore || []).map((r, i) => (
      <tr key={`${r.userId}-${r.testId}-${i}`}>
        <td className="rank">{i + 1}</td>
        <td>{r.name || 'No name'}</td>
        <td>{r.email}</td>
        <td>{r.testTitle}</td>
        <td>{r.score}/{r.total}</td>
        <td><span className={`score-badge ${r.percentage >= 60 ? 'pass' : 'fail'}`}>{r.percentage}%</span></td>
        <td>{formatTime(r.timeTaken)}</td>
      </tr>
    ));
  } else {
    columns = ['#', 'User', 'Email', 'Test', '%', 'Time'];
    rows = (data?.bySpeed || []).map((r, i) => (
      <tr key={`${r.userId}-${i}`}>
        <td className="rank">{i + 1}</td>
        <td>{r.name || 'No name'}</td>
        <td>{r.email}</td>
        <td>{r.testTitle}</td>
        <td><span className={`score-badge ${r.percentage >= 60 ? 'pass' : 'fail'}`}>{r.percentage}%</span></td>
        <td><strong>{formatTime(r.timeTaken)}</strong></td>
      </tr>
    ));
  }

  return (
    <section className="admin-panel">
      <PanelHeader title="Leaderboard" subtitle="User rankings by test attempts, scores, and speed." />

      <div className="mode-switch">
        {views.map(([key, label]) => (
          <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
            {label}
          </button>
        ))}
      </div>

      {(view === 'attempts' && data?.byAttempts?.length === 0) ||
       (view === 'scores' && data?.byScore?.length === 0) ||
       (view === 'speed' && data?.bySpeed?.length === 0) ? (
        <div className="admin-empty">No data yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table leaderboard-table">
            <thead>
              <tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
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

/* ══════════════════════════════════════════════════════
   Beta Tester Whitelist Panel
   Allows admin to manage emails that bypass maintenance mode
══════════════════════════════════════════════════════ */
function WhitelistPanel({ showNotice }) {
  const [emails, setEmails]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding]     = useState(false);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/maintenance-whitelist');
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      showNotice('Failed to load whitelist: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res  = await fetch('/api/maintenance-whitelist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotice(`✅ ${newEmail} added to whitelist`);
      setNewEmail('');
      loadEmails();
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, email) => {
    if (!window.confirm(`Remove ${email} from whitelist?`)) return;
    try {
      const res  = await fetch('/api/maintenance-whitelist', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotice(`Removed ${email}`);
      loadEmails();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const isMaintenance = process.env.REACT_APP_MAINTENANCE_MODE === 'true';

  return (
    <section className="admin-panel">
      <PanelHeader
        title="🛡 Beta Access Whitelist"
        subtitle="Emails added here can bypass maintenance mode and test the full platform."
      />

      {/* Status banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        borderRadius: '10px',
        marginBottom: '1.5rem',
        background: isMaintenance ? 'rgba(255,165,0,0.1)' : 'rgba(126,232,184,0.1)',
        border: `1px solid ${isMaintenance ? 'rgba(255,165,0,0.3)' : 'rgba(126,232,184,0.3)'}`,
      }}>
        <span style={{ fontSize: '1.3rem' }}>{isMaintenance ? '🔧' : '✅'}</span>
        <div>
          <strong style={{ color: isMaintenance ? '#ffa500' : '#7ee8b8' }}>
            Maintenance Mode is {isMaintenance ? 'ON' : 'OFF'}
          </strong>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#8e9dcc' }}>
            {isMaintenance
              ? 'Only whitelisted emails + admin can access the site. Set REACT_APP_MAINTENANCE_MODE=false to go live.'
              : 'Site is live for all users. Set REACT_APP_MAINTENANCE_MODE=true to enable maintenance mode.'}
          </p>
        </div>
      </div>

      {/* Add email form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          placeholder="Enter tester email (e.g. friend@gmail.com)"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          required
          style={{
            flex: 1,
            minWidth: '260px',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(139,151,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="admin-primary-btn"
          disabled={adding}
          style={{ whiteSpace: 'nowrap' }}
        >
          {adding ? 'Adding…' : '+ Add to Whitelist'}
        </button>
      </form>

      {/* Whitelist table */}
      {loading ? (
        <div className="admin-empty">Loading whitelist…</div>
      ) : emails.length === 0 ? (
        <div className="admin-empty">
          <p>No beta testers added yet.</p>
          <p style={{ fontSize: '0.85rem', color: '#8e9dcc' }}>Add an email above to give someone access during maintenance.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Added On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((entry, i) => (
                <tr key={entry.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', color: '#a3b8ff' }}>{entry.email}</td>
                  <td>{formatDate(entry.created_at)}</td>
                  <td>
                    <button
                      className="admin-danger-btn"
                      onClick={() => handleRemove(entry.id, entry.email)}
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
