import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './SupportChatWidget.css';

export default function SupportChatWidget({ user, hasPremiumAccess, onOpenUpgradeModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages for logged in user
  const fetchMessages = async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        if (isOpen) {
          setUnreadCount(0);
        } else {
          const unread = data.filter(m => m.sender === 'admin' && !m.is_read_by_user).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Error fetching support messages:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Mark admin messages as read when drawer is opened
  const markMessagesAsRead = async () => {
    if (!user) return;
    setUnreadCount(0);
    try {
      await supabase
        .from('support_messages')
        .update({ is_read_by_user: true })
        .eq('user_id', user.id)
        .eq('sender', 'admin')
        .eq('is_read_by_user', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages(true);
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      markMessagesAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleToggle = () => {
    if (!hasPremiumAccess && !isOpen) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      } else {
        alert('Priority Support Messaging is an exclusive feature for Premium members. Please upgrade to access direct admin messaging!');
      }
      return;
    }
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          user_email: user.email,
          sender: 'user',
          message: msgText,
          is_read_by_admin: false,
          is_read_by_user: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
      setNewMessage(msgText);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="support-chat-widget-container">
      {/* Floating Toggle Button */}
      <button 
        className={`support-chat-toggle-btn ${!isOpen && unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleToggle}
        title="Direct Support Chat with Admin"
        aria-label="Support Chat"
      >
        <span className="material-symbols-outlined icon">
          {isOpen ? 'close' : 'support_agent'}
        </span>
        {!isOpen && unreadCount > 0 && (
          <span className="support-chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Drawer Popup */}
      {isOpen && (
        <div className="support-chat-drawer">
          <div className="support-chat-header">
            <div className="header-info">
              <span className="material-symbols-outlined header-icon">bolt</span>
              <div>
                <h4>⚡ DM to Admin</h4>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="support-chat-body">
            {loading ? (
              <div className="chat-loading">Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty-state">
                <span className="material-symbols-outlined empty-icon">forum</span>
                <p><strong>Welcome to Premium Support!</strong></p>
                <p>Have questions about your mock tests, study materials, or account? Send us a message directly!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id || msg.created_at} 
                  className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}
                >
                  <div className="chat-bubble">
                    <div className="bubble-sender">
                      {msg.sender === 'user' ? 'You' : '🛡 Admin Support'}
                    </div>
                    <div className="bubble-message">{msg.message}</div>
                    <div className="bubble-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="support-chat-footer" onSubmit={handleSendMessage}>
            <input 
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={!newMessage.trim() || sending}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
