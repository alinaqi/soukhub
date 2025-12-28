'use client';

import { useState } from 'react';
import {
  CUSTOMER_TEMPLATES,
  CommunicationTemplate,
  CustomerInfo,
  renderCustomerTemplate,
  generateWhatsAppLink,
  generateMailtoLink,
  getSuggestedTemplates,
} from '@/lib/customer-communication';

interface CustomerCommunicationProps {
  customer: CustomerInfo & {
    id: string;
    email?: string | null;
    phone?: string | null;
  };
  onCommunicationSent?: (type: 'email' | 'whatsapp', template: string) => void;
}

export function CustomerCommunication({
  customer,
  onCommunicationSent,
}: CustomerCommunicationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('suggested');

  const hasEmail = !!customer.email;
  const hasPhone = !!customer.phone;

  if (!hasEmail && !hasPhone) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">No contact information available</p>
        <p className="text-xs mt-1">Email or phone required for communication</p>
      </div>
    );
  }

  const suggestedTemplates = getSuggestedTemplates(customer);

  const categories = [
    { id: 'suggested', name: 'Suggested', icon: '✨' },
    { id: 'thank_you', name: 'Thank You', icon: '🙏' },
    { id: 'order_update', name: 'Orders', icon: '📦' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
    { id: 'promotion', name: 'Offers', icon: '🎁' },
    { id: 'reactivation', name: 'Win Back', icon: '💔' },
  ];

  const getTemplatesForCategory = (categoryId: string): CommunicationTemplate[] => {
    if (categoryId === 'suggested') {
      return suggestedTemplates;
    }
    return CUSTOMER_TEMPLATES.filter((t) => t.category === categoryId && t.id !== 'custom');
  };

  const handleSelectTemplate = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    if (template.id === 'custom') {
      setCustomMessage('');
      setCustomSubject('');
    } else {
      const rendered = renderCustomerTemplate(template, customer);
      setCustomMessage(rendered.message);
      setCustomSubject(rendered.subject || '');
    }
    setShowTemplates(false);
  };

  const handleSendWhatsApp = () => {
    if (!customer.phone || !customMessage) return;
    const link = generateWhatsAppLink(customer.phone, customMessage);
    window.open(link, '_blank');
    onCommunicationSent?.('whatsapp', selectedTemplate?.id || 'custom');
  };

  const handleSendEmail = () => {
    if (!customer.email || !customMessage) return;
    const link = generateMailtoLink(customer.email, customSubject, customMessage);
    window.location.href = link;
    onCommunicationSent?.('email', selectedTemplate?.id || 'custom');
  };

  return (
    <div className="space-y-4">
      {/* Quick Send Buttons */}
      <div className="flex gap-2">
        {hasPhone && (
          <button
            onClick={() => {
              if (!selectedTemplate) setShowTemplates(true);
              else handleSendWhatsApp();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
          >
            <span>💬</span>
            WhatsApp
          </button>
        )}
        {hasEmail && (
          <button
            onClick={() => {
              if (!selectedTemplate) setShowTemplates(true);
              else handleSendEmail();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
          >
            <span>✉️</span>
            Email
          </button>
        )}
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto border-b border-border bg-muted/30">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-background text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Template List */}
          <div className="max-h-48 overflow-y-auto">
            {getTemplatesForCategory(activeCategory).length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No templates in this category
              </div>
            ) : (
              getTemplatesForCategory(activeCategory).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span>{template.icon}</span>
                    <span className="font-medium text-sm">{template.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {template.message.substring(0, 60)}...
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Write Custom */}
          <button
            onClick={() => handleSelectTemplate(CUSTOMER_TEMPLATES.find((t) => t.id === 'custom')!)}
            className="w-full text-left px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors border-t border-border"
          >
            <div className="flex items-center gap-2">
              <span>✏️</span>
              <span className="font-medium text-sm">Write Custom Message</span>
            </div>
          </button>
        </div>
      )}

      {/* Message Preview/Editor */}
      {selectedTemplate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span>{selectedTemplate.icon}</span>
              <span className="font-medium">{selectedTemplate.name}</span>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setShowTemplates(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change
            </button>
          </div>

          {/* Subject line for email */}
          {hasEmail && (
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
            />
          )}

          {/* Message body */}
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none"
          />

          {/* Send Buttons */}
          <div className="flex gap-2">
            {hasPhone && (
              <button
                onClick={handleSendWhatsApp}
                disabled={!customMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>💬</span>
                Send via WhatsApp
              </button>
            )}
            {hasEmail && (
              <button
                onClick={handleSendEmail}
                disabled={!customMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>✉️</span>
                Send via Email
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested Quick Actions */}
      {!showTemplates && !selectedTemplate && suggestedTemplates.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested Messages
          </div>
          {suggestedTemplates.slice(0, 2).map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{template.icon}</span>
                <span className="font-medium text-sm">{template.name}</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => setShowTemplates(true)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2"
          >
            View all templates →
          </button>
        </div>
      )}

      {/* Initial State - No template selected */}
      {!showTemplates && !selectedTemplate && suggestedTemplates.length === 0 && (
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full text-center p-4 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <span className="block text-lg mb-1">💬</span>
          <span className="text-sm">Choose a message template</span>
        </button>
      )}
    </div>
  );
}
