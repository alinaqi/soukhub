'use client';

import { useState, useEffect } from 'react';
import { generateThankYouNote, CustomerStats, BilingualNote } from '@/lib/customer-intelligence';

type Language = 'english' | 'arabic';

interface ThankYouNoteProps {
  customerId: string;
  productName: string;
  orderId: string;
  sellerName?: string;
  onPrint?: () => void;
}

export function ThankYouNote({
  customerId,
  productName,
  orderId,
  sellerName,
  onPrint,
}: ThankYouNoteProps) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [notes, setNotes] = useState<BilingualNote>({ english: '', arabic: '' });
  const [editedNotes, setEditedNotes] = useState<BilingualNote>({ english: '', arabic: '' });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>('english');

  useEffect(() => {
    if (customerId) {
      fetchStats();
    }
  }, [customerId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/stats`);
      const data = await response.json();
      if (response.ok && data.stats) {
        setStats(data.stats);
        const generatedNotes = generateThankYouNote(
          data.stats,
          productName,
          orderId,
          sellerName
        );
        setNotes(generatedNotes);
        setEditedNotes(generatedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentNote = isEditing ? editedNotes[activeLanguage] : notes[activeLanguage];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const isArabic = activeLanguage === 'arabic';
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${isArabic ? 'ar' : 'en'}">
        <head>
          <title>Thank You Note - Order #${orderId}</title>
          <style>
            body {
              font-family: ${isArabic ? "'Segoe UI', 'Tahoma', 'Arial', sans-serif" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"};
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.8;
              direction: ${isArabic ? 'rtl' : 'ltr'};
            }
            .note {
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 30px;
              background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .content {
              white-space: pre-wrap;
              font-size: 14px;
              color: #374151;
              text-align: ${isArabic ? 'right' : 'left'};
            }
            ${stats?.is_vip ? `
            .note {
              border-color: #fbbf24;
              background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
            }
            ` : ''}
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="note">
            <div class="header">
              ${stats?.is_vip ? '⭐ VIP Customer ⭐' : stats?.is_repeat ? '🌟 Valued Customer 🌟' : '💝 Thank You! 💝'}
            </div>
            <div class="content">${currentNote}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    onPrint?.();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(currentNote);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No customer data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{stats.name}</span>
          {stats.is_vip && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              ⭐ VIP
            </span>
          )}
          {stats.is_repeat && !stats.is_vip && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              Repeat Customer
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {stats.total_orders} order{stats.total_orders !== 1 ? 's' : ''} • AED {stats.total_spent.toLocaleString()}
        </span>
      </div>

      {/* Language Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveLanguage('english')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeLanguage === 'english'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setActiveLanguage('arabic')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeLanguage === 'arabic'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          العربية
        </button>
      </div>

      {/* Note Content */}
      <div
        className={`border rounded-lg p-4 ${
          stats.is_vip
            ? 'border-yellow-300 bg-yellow-50'
            : 'border-gray-200 bg-gray-50'
        }`}
        dir={activeLanguage === 'arabic' ? 'rtl' : 'ltr'}
      >
        {isEditing ? (
          <textarea
            value={editedNotes[activeLanguage]}
            onChange={(e) => setEditedNotes(prev => ({
              ...prev,
              [activeLanguage]: e.target.value
            }))}
            rows={10}
            className={`w-full bg-white border rounded-md p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 ${
              activeLanguage === 'arabic' ? 'text-right' : 'text-left'
            }`}
            dir={activeLanguage === 'arabic' ? 'rtl' : 'ltr'}
          />
        ) : (
          <pre className={`whitespace-pre-wrap text-sm text-gray-700 font-sans ${
            activeLanguage === 'arabic' ? 'text-right' : 'text-left'
          }`}>
            {currentNote}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (isEditing) {
              setNotes(editedNotes);
            }
            setIsEditing(!isEditing);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {isEditing ? 'Save Changes' : 'Edit Message'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            Copy
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print Note
          </button>
        </div>
      </div>

      {/* Referral Code Option */}
      {stats.is_repeat && (
        <ReferralCodeSection customerId={customerId} customerName={stats.name} />
      )}
    </div>
  );
}

function ReferralCodeSection({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createCode = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percent: 10 }),
      });

      const data = await response.json();
      if (response.ok) {
        setCode(data.referral.code);
      }
    } catch (error) {
      console.error('Failed to create referral code:', error);
    } finally {
      setCreating(false);
    }
  };

  if (code) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-800">Referral Code Created</div>
            <div className="text-lg font-bold text-green-900">{code}</div>
            <div className="text-xs text-green-600">10% off - Valid 30 days</div>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-700">Offer a referral discount?</div>
          <div className="text-xs text-gray-500">
            Generate a personalized code for {customerName.split(' ')[0]}
          </div>
        </div>
        <button
          onClick={createCode}
          disabled={creating}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Code'}
        </button>
      </div>
    </div>
  );
}
