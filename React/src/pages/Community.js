import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Community.css'

export default function Community() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Channels and active channel
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Messages and input state
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [sending, setSending] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // 1. Authenticate & Check Admin status
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }
      const currentUser = session.user
      setUser(currentUser)

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle()

      const adminFlag = !!adminData || currentUser.email === 'adminspp@datawiz.com'
      setIsAdmin(adminFlag)

      // Fetch user's group memberships
      const { data: memberData } = await supabase
        .from('community_group_members')
        .select('group_id')
        .eq('user_email', currentUser.email)

      await fetchGroups(adminFlag, memberData ? memberData.map(m => m.group_id) : [])
      setLoading(false)
    }

    initAuth()
  }, [navigate])

  // 2. Fetch accessible community groups
  async function fetchGroups(adminFlag, allowedGroupIds) {
    const { data, error } = await supabase
      .from('community_groups')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching community groups:', error)
      return
    }

    // Filter channels: Admins see all. Standard users only see channels they are explicitly members of.
    const filtered = (data || []).filter(g => {
      if (adminFlag) return true
      return allowedGroupIds.includes(g.id)
    })

    setGroups(filtered)
    if (filtered.length > 0) {
      setActiveGroup(filtered[0])
    }
  }

  // Realtime subscription for community_groups table updates (Pause/Resume, Group updates)
  useEffect(() => {
    const groupChannel = supabase
      .channel('comm_groups_global_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_groups' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setGroups((prevGroups) =>
              prevGroups.map((g) => (g.id === payload.new.id ? { ...g, ...payload.new } : g))
            )
            setActiveGroup((prevActive) =>
              prevActive && prevActive.id === payload.new.id ? { ...prevActive, ...payload.new } : prevActive
            )
          } else if (payload.eventType === 'DELETE') {
            setGroups((prevGroups) => prevGroups.filter((g) => g.id !== payload.old.id))
            setActiveGroup((prevActive) =>
              prevActive && prevActive.id === payload.old.id ? null : prevActive
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(groupChannel)
    }
  }, [])

  // 3. Fetch messages for active group & subscribe to Realtime updates
  useEffect(() => {
    if (!activeGroup) return

    let channel = null
    const channelTopic = `comm_${activeGroup.id}_${Math.random().toString(36).substring(7)}`

    async function fetchMessagesAndSubscribe() {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('created_at', { ascending: true })

      if (!error) {
        setMessages(data || [])
        scrollToBottom()
      }

      channel = supabase.channel(channelTopic)
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_messages',
            filter: `group_id=eq.${activeGroup.id}`
          },
          (payload) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) {
                return prev
              }
              return [...prev, payload.new]
            })
            scrollToBottom()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'community_messages'
          },
          (payload) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        )
        .subscribe()
    }

    fetchMessagesAndSubscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [activeGroup])

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return
    try {
      const { error } = await supabase.from('community_messages').delete().eq('id', msgId)
      if (error) throw error
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } catch (err) {
      alert(`Could not delete message: ${err.message || err}`)
    }
  }

  const handleOptOutGroup = async () => {
    if (!activeGroup || !user) return
    if (activeGroup.slug === 'general-community') {
      alert('You cannot opt out of the General Community channel.')
      return
    }
    if (!window.confirm(`Are you sure you want to leave / opt-out of "${activeGroup.name}"?`)) return

    try {
      const { error } = await supabase
        .from('community_group_members')
        .delete()
        .eq('group_id', activeGroup.id)
        .eq('user_email', user.email)

      if (error) throw error

      const updatedGroups = groups.filter(g => g.id !== activeGroup.id)
      setGroups(updatedGroups)
      if (updatedGroups.length > 0) {
        setActiveGroup(updatedGroups[0])
      } else {
        setActiveGroup(null)
      }
      alert(`You have successfully left ${activeGroup.name}.`)
    } catch (err) {
      alert(`Failed to leave community: ${err.message || err}`)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Handle file pick for Admin
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearFileSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || sending || !user || !activeGroup) return

    setSending(true)
    let uploadedMediaUrl = null
    let mediaType = null

    try {
      if (selectedFile && isAdmin) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `chat_attachments/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from('community-media')
          .upload(filePath, selectedFile)

        if (uploadErr) {
          throw uploadErr
        }

        const { data: publicUrlData } = supabase.storage
          .from('community-media')
          .getPublicUrl(filePath)

        uploadedMediaUrl = publicUrlData.publicUrl
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'file'
      }

      const senderDisplayName = isAdmin ? 'admin_datwiz' : (user.user_metadata?.full_name || user.email.split('@')[0])
      const { error: insertErr } = await supabase.from('community_messages').insert({
        group_id: activeGroup.id,
        sender_id: user.id,
        sender_name: senderDisplayName,
        sender_email: user.email,
        sender_role: isAdmin ? 'admin' : 'student',
        content: newMessage.trim(),
        media_url: uploadedMediaUrl,
        media_type: mediaType
      })

      if (insertErr) throw insertErr

      setNewMessage('')
      clearFileSelection()
    } catch (err) {
      console.error('Failed to send message:', err)
      alert(`Could not send message: ${err.message || err}`)
    } finally {
      setSending(false)
    }
  }

  // Compute active members in current channel for the right sidebar
  const activeParticipants = useMemo(() => {
    const map = new Map()
    messages.forEach((m) => {
      if (!map.has(m.sender_email)) {
        const isAdminUser = m.sender_role === 'admin' || m.sender_email === 'adminspp@datawiz.com'
        map.set(m.sender_email, {
          name: isAdminUser ? 'admin_datwiz' : (m.sender_name || m.sender_email?.split('@')[0]),
          email: m.sender_email,
          role: m.sender_role
        })
      }
    })
    const list = Array.from(map.values())
    return {
      admins: list.filter(p => p.role === 'admin' || p.email === 'adminspp@datawiz.com'),
      students: list.filter(p => p.role !== 'admin' && p.email !== 'adminspp@datawiz.com')
    }
  }, [messages])

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const q = searchQuery.toLowerCase()
    return groups.filter(g => g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
  }, [groups, searchQuery])

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="cdac-loading">
        <div className="cdac-spinner"></div>
        <p>Loading CDAC Community Hub...</p>
      </div>
    )
  }

  return (
    <div className="cdac-hub-layout">
      {/* Top Header Navigation Bar */}
      <header className="cdac-top-header">
        <div className="header-left">
          <div className="app-logo-badge">DS</div>
          <h1 className="app-title">CDAC Hub</h1>
          <Link to="/" className="home-back-btn">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Home</span>
          </Link>
        </div>

        <div className="header-center">
          <div className="header-search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <span className="material-symbols-outlined header-icon">notifications</span>
          <div className="user-avatar-circle" title={user?.email}>
            {getInitials(user?.user_metadata?.full_name || user?.email)}
          </div>
        </div>
      </header>

      {/* 3-Column Main Content Layout */}
      <div className="cdac-main-container">
        {/* Column 1: Left Navigation Sidebar */}
        <aside className="cdac-sidebar-left">
          <div className="prep-hub-header">
            <h2>C-CAT Prep Hub</h2>
            <span className="active-count">Active Channels: {groups.length}</span>
          </div>

          <div className="channels-nav-list">
            {filteredGroups.map((group) => {
              const isActive = activeGroup?.id === group.id
              return (
                <button
                  key={group.id}
                  className={`channel-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveGroup(group)}
                >
                  <span className="material-symbols-outlined channel-icon">
                    {group.category === 'DAC' ? 'code' : group.category === 'DBDA' ? 'analytics' : 'forum'}
                  </span>
                  <span className="channel-title">{group.name}</span>
                  {group.is_private && <span className="lock-icon" title="Private Batch">🔒</span>}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Column 2: Center Main Chat Stream */}
        <main className="cdac-chat-center">
          {activeGroup ? (
            <>
              {/* Chat Header */}
              <div className="chat-stream-header">
                <div className="title-area">
                  <h2>{activeGroup.name}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="live-status">🟢 Live Realtime</span>
                    {activeGroup.is_read_only && <span style={{ fontSize: '0.75rem', background: '#0284c7', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>📢 Announcement Channel</span>}
                  </div>
                </div>
              </div>

              {/* Messages Window */}
              <div className="chat-stream-messages">
                <div className="date-separator">
                  <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {messages.length === 0 ? (
                  activeGroup.is_read_only ? (
                    <div className="cdac-empty-chat">
                      <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#0284c7' }}>campaign</span>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a', margin: '8px 0 4px' }}>Official Announcement Channel</p>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Admins will post updates, resources, and announcements here. Stay tuned!</p>
                    </div>
                  ) : (
                    <div className="cdac-empty-chat">
                      <span className="material-symbols-outlined">forum</span>
                      <p>No messages in this channel yet. Start the conversation!</p>
                    </div>
                  )
                ) : (
                  messages.map((msg) => {
                    const isMsgAdmin = msg.sender_role === 'admin' || msg.sender_email === 'adminspp@datawiz.com'
                    const isSelf = msg.sender_id === user?.id || msg.sender_email === user?.email
                    return (
                      <div
                        key={msg.id}
                        className={`cdac-message-wrapper ${isSelf ? 'self-type' : 'other-type'} ${isMsgAdmin ? 'admin-msg' : ''}`}
                      >
                        <div className="msg-meta-bar">
                          <span className="sender-author">
                            {isMsgAdmin ? 'admin_datwiz' : (msg.sender_name || msg.sender_email?.split('@')[0])}
                          </span>
                          {isMsgAdmin && <span className="admin-tag">ADMIN</span>}
                          <span className="msg-timestamp">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {(isSelf || isAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="msg-delete-btn"
                              title="Delete message"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </div>

                        <div className="msg-content-box">
                          {msg.content && <p className="msg-text-paragraph">{msg.content}</p>}
                          {msg.media_url && (
                            <div className="msg-image-attachment">
                              <img
                                src={msg.media_url}
                                alt="Shared attachment"
                                onClick={() => setLightboxUrl(msg.media_url)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Message Input Composer */}
              <div className="chat-stream-composer">
                {activeGroup.is_read_only && !isAdmin ? (
                  <div style={{ textAlign: 'center', padding: '12px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', color: '#0369a1', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>campaign</span>
                    <span>This is an official announcement channel. Admins will share updates and important information here.</span>
                  </div>
                ) : (
                  <>
                    {previewUrl && (
                      <div className="composer-preview-strip">
                        <img src={previewUrl} alt="Upload preview" />
                        <span>{selectedFile?.name} (Admin Attachment)</span>
                        <button type="button" onClick={clearFileSelection}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="composer-form-row">
                      {isAdmin ? (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="attach-plus-btn"
                            title="Attach Photo / Diagram"
                          >
                            <span className="material-symbols-outlined">add_circle_outline</span>
                          </button>
                        </>
                      ) : null}

                      <div className="input-with-emoji">
                        <input
                          type="text"
                          placeholder={activeGroup.is_read_only ? `[Admin Announcement Mode] Message ${activeGroup.name}...` : `Message ${activeGroup.name}...`}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          disabled={sending}
                        />
                        <span className="material-symbols-outlined emoji-icon">sentiment_satisfied</span>
                      </div>

                      <button
                        type="submit"
                        disabled={sending || (!newMessage.trim() && !selectedFile)}
                        className="teal-send-btn"
                      >
                        <span className="material-symbols-outlined">send</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="cdac-empty-chat">Select a channel to view messages.</div>
          )}
        </main>

        {/* Column 3: Right Sidebar (About Channel & Active Members) */}
        <aside className="cdac-sidebar-right">
          {activeGroup && (
            <>
              <div className="about-channel-section">
                <h3>About Channel</h3>
                <p>{activeGroup.description || 'Official discussion forum for C-CAT aspirants. Share doubts, updates, and stay connected.'}</p>
                {!isAdmin && activeGroup.slug !== 'general-community' && (
                  <button
                    type="button"
                    onClick={handleOptOutGroup}
                    style={{
                      marginTop: '12px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      background: '#fef2f2',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
                    <span>Leave Community</span>
                  </button>
                )}
              </div>

              <div className="members-section">
                <div className="members-group-title">ADMIN ({activeParticipants.admins.length || (isAdmin ? 1 : 0)})</div>
                <div className="members-list">
                  {(activeParticipants.admins.length > 0 ? activeParticipants.admins : (isAdmin ? [{ name: 'admin_datwiz', email: user?.email }] : [])).map((admin, idx) => (
                    <div key={idx} className="member-row">
                      <div className="avatar-badge admin-av">{getInitials(admin.name)}</div>
                      <div className="member-info">
                        <span className="member-name">{admin.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="members-group-title">STUDENTS IN CHANNEL ({activeParticipants.students.length})</div>
                <div className="members-list">
                  {activeParticipants.students.length === 0 ? (
                    <div className="no-members-text">No student activity yet</div>
                  ) : (
                    activeParticipants.students.map((st, idx) => (
                      <div key={idx} className="member-row">
                        <div className="avatar-badge student-av">{getInitials(st.name)}</div>
                        <span className="member-name">{st.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Lightbox Modal for Full Image Expansion */}
      {lightboxUrl && (
        <div className="cdac-lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <div className="cdac-lightbox-body" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Expanded preview" />
            <button onClick={() => setLightboxUrl(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
