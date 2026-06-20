import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'

export default function ProfileDropdown({ user, navigate }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [activeModalNotif, setActiveModalNotif] = useState(null)
  const [imageError, setImageError] = useState(false)
  
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_notification_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notification_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const ref = useRef(null)
  const location = useLocation()

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-dismiss toast popup after 7 seconds
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => {
      setToastMessage(null)
    }, 7000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Get active notifications (excluding dismissed ones)
  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id))

  // Determine if the yellow notification dot should be shown
  const showYellowDot = activeNotifications.some(n => !readIds.includes(n.id))

  // Fetch notifications
  useEffect(() => {
    if (!user) return
    let active = true

    async function loadNotifications() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error
        
        if (active) {
          const fetchedNotifs = data || []
          setNotifications(fetchedNotifs)

          // Perform calculations on the fresh list, taking into account current dismissals
          const freshActive = fetchedNotifs.filter(n => !dismissedIds.includes(n.id))

          if (freshActive.length > 0) {
            const latest = freshActive[0]
            const latestId = latest.id

            // Check if we have already shown a popup/toast for this latest notification
            const notifiedId = localStorage.getItem('notified_notification_id')
            if (notifiedId !== latestId) {
              const unreadCount = freshActive.filter(n => !readIds.includes(n.id)).length
              if (unreadCount > 1) {
                setToastMessage(`You have ${unreadCount} new notifications`)
              } else {
                setToastMessage('You have 1 new notification')
              }
              localStorage.setItem('notified_notification_id', latestId)
            }
          }
        }
      } catch (err) {
        console.error('Error loading notifications:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNotifications()

    // Realtime subscription to postgres changes on notifications table
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dismissedIds])

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 border border-primary text-primary font-label-md text-sm md:text-label-md rounded-full hover:bg-primary/5 active:scale-95 transition-all justify-self-end whitespace-nowrap"
      >
        Login
      </button>
    )
  }

  const initials = (user.user_metadata?.full_name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

  // Helper for formatting timestamp in dropdown
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const handleToggleOpen = () => {
    setOpen((prev) => !prev)
  }

  const handleRead = (notif) => {
    setActiveModalNotif(notif)
    setOpen(false)
    if (!readIds.includes(notif.id)) {
      const next = [...readIds, notif.id]
      setReadIds(next)
      localStorage.setItem('read_notification_ids', JSON.stringify(next))
    }
  }

  const handleDismiss = (id, e) => {
    if (e) e.stopPropagation() // Stop event bubble so we don't open the modal popup
    const nextDismissed = [...dismissedIds, id]
    setDismissedIds(nextDismissed)
    localStorage.setItem('dismissed_notification_ids', JSON.stringify(nextDismissed))
    
    // Also mark as read to clear yellow dot
    if (!readIds.includes(id)) {
      const nextRead = [...readIds, id]
      setReadIds(nextRead)
      localStorage.setItem('read_notification_ids', JSON.stringify(nextRead))
    }
  }

  return (
    <>
      <div className="relative justify-self-end" ref={ref}>
        <button
          onClick={handleToggleOpen}
          className="flex items-center gap-2 group"
          aria-label="Profile menu"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-primary/20 group-hover:ring-primary/50 overflow-hidden transition-all">
              {avatarUrl && !imageError ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover" 
                  onError={() => setImageError(true)}
                />
              ) : (
                initials
              )}
            </div>
            {showYellowDot && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full z-10 animate-pulse"></span>
            )}
          </div>
          <span
            className="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-fade-in flex flex-col">
            {/* User Info header */}
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <p className="font-label-md text-label-md text-on-surface truncate text-left">{displayName}</p>
              <p className="text-xs text-on-surface-variant truncate mt-0.5 text-left">{user.email}</p>
            </div>

            {/* Notifications Panel inside Profile */}
            <div className="border-b border-outline-variant bg-surface-container-lowest max-h-56 flex flex-col">
              <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">notifications</span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Notifications</span>
                {activeNotifications.length > 0 && (
                  <span className="ml-auto bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {activeNotifications.length}
                  </span>
                )}
              </div>

              <div className="overflow-y-auto max-h-[170px] divide-y divide-outline-variant/30">
                {loading && notifications.length === 0 ? (
                  <div className="px-4 py-3 text-center text-xs text-on-surface-variant">
                    Loading...
                  </div>
                ) : activeNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-on-surface-variant italic">
                    No notifications yet.
                  </div>
                ) : (
                  activeNotifications.map((notif) => {
                    const previewText = notif.message.length > 60 
                      ? notif.message.substring(0, 60) + '...' 
                      : notif.message
                    
                    const isUnread = !readIds.includes(notif.id)

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleRead(notif)}
                        className={`px-4 py-2.5 text-left transition-colors flex gap-2 cursor-pointer group relative ${
                          notif.type === 'premium'
                            ? 'bg-amber-50/60 hover:bg-amber-50 border-l-4 border-amber-500'
                            : 'hover:bg-surface-container'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                            {notif.type === 'premium' ? 'workspace_premium' : 'campaign'}
                          </span>
                          {isUnread && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 border border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="min-w-0 flex-grow pr-4">
                          <p className={`text-xs text-on-surface leading-snug break-words ${isUnread ? 'font-bold' : 'font-medium'}`}>
                            {previewText}
                          </p>
                          <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDismiss(notif.id, e)}
                          className="absolute top-2.5 right-2 p-0.5 rounded-full hover:bg-black/5 text-on-surface-variant/70 hover:text-on-surface transition-colors shrink-0"
                          title="Dismiss notification"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Action Links */}
            <div className="p-1">
              {location.pathname !== '/' && (
                <button
                  onClick={() => {
                    navigate('/')
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">home</span>
                  Home
                </button>
              )}
              {location.pathname !== '/tests' && location.pathname !== '/mock-tests' && (
                <button
                  onClick={() => {
                    navigate('/tests')
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">quiz</span>
                  My Tests
                </button>
              )}
              <button
                onClick={() => {
                  supabase.auth.signOut().then(() => {
                    setOpen(false)
                    navigate('/')
                  })
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render overlay features inside document.body using React Portals */}
      {toastMessage && createPortal(
        <div className="fixed top-20 right-4 w-80 bg-white rounded-xl shadow-2xl border border-primary/20 p-4 z-[100] flex gap-3 animate-slide-in-right">
          <div className="p-1.5 bg-primary/10 text-primary rounded-full shrink-0 flex items-center justify-center h-8 w-8">
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Announcement</p>
            <p className="text-sm text-on-surface leading-snug mt-1 font-medium break-words">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="shrink-0 text-on-surface-variant hover:text-on-surface self-start"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>,
        document.body
      )}

      {activeModalNotif && createPortal(
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setActiveModalNotif(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative border border-outline-variant animate-fade-in flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[24px] ${
                  activeModalNotif.type === 'premium' ? 'text-amber-500' : 'text-primary'
                }`}>
                  {activeModalNotif.type === 'premium' ? 'workspace_premium' : 'campaign'}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeModalNotif.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                }`}>
                  {activeModalNotif.type === 'premium' ? 'Premium Announcement' : 'Announcement'}
                </span>
              </div>
              <button 
                onClick={() => setActiveModalNotif(null)} 
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Message Body */}
            <div className="text-left py-2">
              <p className="text-sm md:text-base text-on-surface leading-relaxed whitespace-pre-wrap font-medium break-words">
                {activeModalNotif.message}
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-outline-variant/30 pt-3 flex justify-between items-center text-xs text-on-surface-variant/80">
              <span>{new Date(activeModalNotif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <button 
                onClick={() => {
                  handleDismiss(activeModalNotif.id)
                  setActiveModalNotif(null)
                }}
                className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Dismiss
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
