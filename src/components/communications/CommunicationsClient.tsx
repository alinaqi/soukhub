'use client';

import { useState, useEffect, useRef } from 'react';

interface Supplier {
  id: string;
  name: string;
  whatsapp_number: string;
}

interface Message {
  id: string;
  direction: 'outgoing' | 'incoming';
  content: string;
  status: string;
  sent_at: string;
  parsed_intent?: string;
  confidence?: number;
}

interface Conversation {
  supplier_id: string;
  supplier_name: string;
  whatsapp_number: string;
  last_message: string;
  last_message_at: string;
  direction: 'outgoing' | 'incoming';
  pending_orders: number;
  message_count: number;
}

type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready';

export function CommunicationsClient({ userId }: { userId: string }) {
  // WhatsApp connection state
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Message compose state
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Loading states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch WhatsApp status on mount
  useEffect(() => {
    fetchWhatsAppStatus();
    fetchConversations();

    // Poll for status updates
    const interval = setInterval(fetchWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      setWaStatus(data.status);
      setQrCode(data.qrCode);
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/communications');
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (supplierId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/communications/${supplierId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
        setSelectedSupplier(data.supplier);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectWhatsApp = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      });
      const data = await response.json();
      setWaStatus(data.status);
      setQrCode(data.qrCode);
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      setWaStatus('disconnected');
      setQrCode(null);
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedSupplier || !newMessage.trim() || waStatus !== 'ready') return;

    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: selectedSupplier.whatsapp_number,
          message: newMessage,
          supplier_id: selectedSupplier.id,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Refresh messages
        fetchMessages(selectedSupplier.id);
        fetchConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedSupplier({
      id: conv.supplier_id,
      name: conv.supplier_name,
      whatsapp_number: conv.whatsapp_number,
    });
    fetchMessages(conv.supplier_id);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whatsapp_number.includes(searchTerm)
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusIcon = () => {
    switch (waStatus) {
      case 'ready':
        return '🟢';
      case 'connecting':
      case 'qr_ready':
      case 'authenticated':
        return '🟡';
      default:
        return '🔴';
    }
  };

  const getStatusText = () => {
    switch (waStatus) {
      case 'ready':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'qr_ready':
        return 'Scan QR Code';
      case 'authenticated':
        return 'Authenticating...';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">Communications</h1>
          <p className="text-muted-foreground text-sm">
            Message suppliers via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>{getStatusIcon()}</span>
            <span>{getStatusText()}</span>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted"
          >
            {waStatus === 'ready' ? 'Settings' : 'Setup'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            />
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-xs mt-1">
                  Send a message to a supplier to start
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.supplier_id}
                  onClick={() => selectConversation(conv)}
                  className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 ${
                    selectedSupplier?.id === conv.supplier_id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="font-medium truncate">{conv.supplier_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {conv.last_message_at && formatTime(conv.last_message_at)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate mt-1">
                    {conv.direction === 'outgoing' && 'You: '}
                    {conv.last_message || 'No messages'}
                  </div>
                  {conv.pending_orders > 0 && (
                    <div className="mt-1">
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                        {conv.pending_orders} pending
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedSupplier ? (
            <>
              {/* Supplier Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedSupplier.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedSupplier.whatsapp_number}
                  </div>
                </div>
                <a
                  href={`https://wa.me/${selectedSupplier.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Open in WhatsApp
                </a>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === 'outgoing'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                        <div
                          className={`text-xs mt-1 flex items-center gap-2 ${
                            msg.direction === 'outgoing'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span>{formatTime(msg.sent_at)}</span>
                          {msg.direction === 'outgoing' && (
                            <span>{msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : ''}</span>
                          )}
                        </div>
                        {msg.direction === 'incoming' && msg.parsed_intent && (
                          <div className="mt-2 text-xs px-2 py-1 bg-background/50 rounded">
                            🤖 AI: {msg.parsed_intent}
                            {msg.confidence && ` (${Math.round(msg.confidence * 100)}%)`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="p-4 border-t border-border">
                {waStatus !== 'ready' ? (
                  <div className="text-center text-muted-foreground py-2">
                    Connect WhatsApp to send messages
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">WhatsApp Setup</h3>
              <button
                onClick={() => setShowSetup(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {waStatus === 'ready' ? (
                <div className="text-center space-y-4">
                  <div className="text-4xl">🟢</div>
                  <p className="font-medium">WhatsApp Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Your WhatsApp is linked and ready to send messages
                  </p>
                  <button
                    onClick={disconnectWhatsApp}
                    className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Disconnect
                  </button>
                </div>
              ) : waStatus === 'qr_ready' && qrCode ? (
                <div className="text-center space-y-4">
                  <p className="font-medium">Scan QR Code</p>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <ol className="text-sm text-muted-foreground text-left space-y-1">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Go to Settings → Linked Devices</li>
                    <li>3. Tap "Link a Device"</li>
                    <li>4. Scan this QR code</li>
                  </ol>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-4xl">📱</div>
                  <p className="font-medium">Connect WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Link your WhatsApp to send and receive messages directly
                  </p>
                  <button
                    onClick={connectWhatsApp}
                    disabled={connecting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect WhatsApp'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
