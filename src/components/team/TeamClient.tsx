'use client';

import { useState } from 'react';
import { AddTeamMemberModal } from './AddTeamMemberModal';
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

const ROLE_LABELS: Record<TeamRole, { label: string; icon: string; description: string }> = {
  owner: { label: 'Owner', icon: '👑', description: 'Full access to everything' },
  manager: { label: 'Manager', icon: '👔', description: 'Manage orders, inventory, team. No billing.' },
  packer: { label: 'Packer', icon: '📦', description: 'Pack and ship orders only' },
  viewer: { label: 'Viewer', icon: '👁', description: 'View only, no changes' },
};

interface TeamClientProps {
  members: TeamMember[];
}

export function TeamClient({ members: initialMembers }: TeamClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleMemberAdded = (member: TeamMember) => {
    setMembers([member, ...members]);
    setShowAddModal(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Remove this team member? They will no longer be able to access the system.')) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const formatLastActive = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-muted-foreground">
                Add team members like packers and managers with role-based access
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add Team Member
            </button>
          </div>
        </div>
      </header>

      {/* Role Legend */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <h3 className="text-sm font-medium mb-3">Available Roles</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(ROLE_LABELS)
            .filter(([role]) => role !== 'owner')
            .map(([role, { label, icon, description }]) => (
              <div key={role} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{icon}</span>
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">- {description}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Team List */}
      <div className="p-6">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">👥</span>
            <h3 className="mt-4 text-lg font-medium">No team members yet</h3>
            <p className="text-muted-foreground mt-1">
              Add packers or managers to help manage your orders
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Add Team Member
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const roleInfo = ROLE_LABELS[member.role];
              return (
                <div
                  key={member.id}
                  className={`rounded-xl border bg-card p-5 transition-all hover:shadow-md ${
                    !member.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                        {roleInfo.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <span className="text-sm text-muted-foreground">{roleInfo.label}</span>
                      </div>
                    </div>
                    {member.has_pin && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        PIN Set
                      </span>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5 mb-4 text-sm">
                    {member.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>📧</span>
                        <span>{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>📱</span>
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Active */}
                  <div className="text-xs text-muted-foreground mb-4">
                    Last active: {formatLastActive(member.last_active_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(member.id)}
                      className="px-3 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
}
