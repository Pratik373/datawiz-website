import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('analytics')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user?.email !== 'adminspp@datawiz.com') {
        navigate('/admin/login')
        return
      }
      setUser(session.user)
    })
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="text-on-surface-variant">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8F7F4' }}>
      <aside className="w-64 bg-surface-container border-r border-outline-variant p-md hidden md:flex flex-col">
        <div className="flex items-center gap-sm mb-lg">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-on-primary font-bold">D6</span>
          </div>
          <span className="font-headline-sm text-headline-sm font-bold">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { id: 'analytics', icon: 'bar_chart', label: 'Analytics' },
            { id: 'users', icon: 'people', label: 'Users' },
            { id: 'tests', icon: 'assignment', label: 'Test Papers' },
            { id: 'results', icon: 'fact_check', label: 'Test Results' },
            { id: 'payments', icon: 'payments', label: 'Payments' },
            { id: 'leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-sm px-md py-3 rounded-lg font-label-md text-label-md transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-sm px-md py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high font-label-md text-label-md transition-colors mt-auto">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-surface border-b border-outline-variant px-gutter py-4 flex items-center justify-between md:justify-end" style={{ backgroundColor: '#F8F7F4' }}>
          <button className="md:hidden" onClick={() => {}}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-md">
            <span className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</span>
            <button onClick={handleLogout}
              className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md">
              <span className="material-symbols-outlined">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-gutter overflow-auto">
          <div className="max-w-container-max mx-auto">
            <h1 className="font-headline-md text-headline-md mb-lg capitalize">{activeTab} Dashboard</h1>
            <div className="bg-surface-container-lowest border border-stone-border rounded-xl p-lg">
              <p className="text-on-surface-variant font-body-md text-body-md">
                {activeTab === 'analytics' && 'Analytics dashboard content - charts and metrics coming soon.'}
                {activeTab === 'users' && 'User management interface - view and manage registered students.'}
                {activeTab === 'tests' && 'Test papers management - create, edit, and manage mock tests.'}
                {activeTab === 'results' && 'Test results overview - view student performance and scores.'}
                {activeTab === 'payments' && 'Payment records - track subscriptions and transactions.'}
                {activeTab === 'leaderboard' && 'Leaderboard - view top-performing students.'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
