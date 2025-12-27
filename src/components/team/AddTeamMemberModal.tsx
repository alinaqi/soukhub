'use client';

import { useState } from 'react';
import type { TeamRole } from '@/types/database';

interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  has_pin: boolean;
  last_active_at: string | null;
  created_at: string;
}

const ROLES: { value: TeamRole; label: string; icon: string; description: string }[] = [
  {
    value: 'manager',
    label: 'Manager',
    icon: '👔',
    description: 'Manage orders, inventory, team. No billing access.',
  },
  {
    value: 'packer',
    label: 'Packer',
    icon: '📦',
    description: 'Pack and ship orders. Optimized packing interface.',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: '👁',
    description: 'View-only access. Cannot make changes.',
  },
];

interface AddTeamMemberModalProps {
  onClose: () => void;
  onSuccess: (member: TeamMember) => void;
}

export function AddTeamMemberModal({ onClose, onSuccess }: AddTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: 'packer' as TeamRole,
    email: '',
    phone: '',
    pin: '',
    usePin: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate PIN if using PIN login
    if (formData.usePin && formData.pin && !/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          pin: formData.usePin && formData.pin ? formData.pin : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add team member');
      }

      onSuccess(data.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Team Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Ahmed"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-3">Role *</label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: role.value }))}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    formData.role === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Method */}
          <div>
            <label className="block text-sm font-medium mb-2">How will they log in?</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer">
                <input
                  type="radio"
                  checked={formData.usePin}
                  onChange={() => setFormData((prev) => ({ ...prev, usePin: true }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">PIN code (recommended for packers)</div>
                  <div className="text-sm text-muted-foreground">
                    Quick 4-digit PIN for shared devices
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.usePin}
                  onChange={() => setFormData((prev) => ({ ...prev, usePin: false }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Email invite</div>
                  <div className="text-sm text-muted-foreground">
                    They get their own login account
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* PIN Input */}
          {formData.usePin && (
            <div>
              <label className="block text-sm font-medium mb-2">4-Digit PIN</label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData((prev) => ({ ...prev, pin: val }));
                }}
                placeholder="• • • •"
                maxLength={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Team member will use this PIN to log in quickly
              </p>
            </div>
          )}

          {/* Email (if not using PIN) */}
          {!formData.usePin && (
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="team@email.com"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                required={!formData.usePin}
              />
            </div>
          )}

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+971 50 123 4567"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Team Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
