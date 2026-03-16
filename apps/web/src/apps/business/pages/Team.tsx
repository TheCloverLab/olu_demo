import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ChevronRight, CheckSquare, Circle, ShieldCheck, UserPlus, Mail, Briefcase, Users, Plus } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceEmployeesForUser, ensureDefaultGroupChat, createNewGroupChat } from '../../../domain/team/api'
import { ensureWorkspaceForUser } from '../../../domain/workspace/api'
import type { WorkspaceEmployee } from '../../../lib/supabase'
import { listChats } from '../../../domain/chat/api'
import clsx from 'clsx'

type GroupChat = {
  id: string
  name: string
  config: Record<string, any>
  last_message?: string | null
  last_message_at?: string | null
}

const STATUS_DOT_COLOR: Record<string, string> = {
  online: 'bg-emerald-400',
  busy: 'bg-amber-400',
  offline: 'bg-gray-500',
}

function GroupRow({ group }: { group: GroupChat }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/grp-${group.config?.chat_key || group.id}`)}
      className="w-full flex items-center gap-3 p-4 rounded-[24px] text-left border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] hover:bg-[var(--olu-card-bg)] transition-colors shadow-[0_2px_8px_rgba(2,8,23,0.12)]"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[var(--olu-card-bg)] flex items-center justify-center border border-[var(--olu-card-border)]">
          <div className="flex -space-x-1">
            {(group.config?.icons || []).slice(0, 3).map((icon: string, i: number) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-0.5">{group.name}</p>
        <p className="text-[var(--olu-text-secondary)] text-xs line-clamp-1">{group.last_message || 'No messages yet'}</p>
        <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5">{group.last_message_at ? new Date(group.last_message_at).toLocaleString() : '—'}</p>
      </div>
      <ChevronRight size={16} className="text-[var(--olu-text-secondary)] flex-shrink-0" />
    </motion.button>
  )
}

function PersonRow({ emp }: { emp: WorkspaceEmployee }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/person/${emp.id}`)}
      className="w-full rounded-[24px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 flex items-start gap-3 shadow-[0_2px_8px_rgba(2,8,23,0.12)] text-left hover:bg-[var(--olu-card-bg)] transition-colors"
    >
      <div className="relative flex-shrink-0">
        {emp.avatar_img ? (
          <img src={emp.avatar_img} alt={emp.name} className="w-12 h-12 rounded-xl object-cover bg-[var(--olu-card-bg)]" />
        ) : (
          <div className={clsx('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm', emp.color)}>
            {emp.name.split(' ').map((n) => n[0]).join('')}
          </div>
        )}
        <div className={clsx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--olu-section-bg)]', STATUS_DOT_COLOR[emp.status])} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm">{emp.name}</span>
          <span className="text-xs text-[var(--olu-text-secondary)] capitalize flex items-center gap-1">
            <Circle size={6} className={STATUS_DOT_COLOR[emp.status]} fill="currentColor" />
            {emp.status}
          </span>
        </div>
        <p className="text-[var(--olu-text-secondary)] text-xs flex items-center gap-1.5">
          <Briefcase size={12} />
          {emp.position}
        </p>
        {emp.email && (
          <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5 flex items-center gap-1.5">
            <Mail size={12} />
            {emp.email}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {(emp.skills || []).map((skill) => (
            <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-[var(--olu-accent-bg)] text-[var(--olu-text-secondary)] font-medium">
              {skill}
            </span>
          ))}
          {emp.salary_label && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              {emp.salary_label}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--olu-text-secondary)] flex-shrink-0 mt-3" />
    </motion.button>
  )
}

export default function Team() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [humans, setHumans] = useState<WorkspaceEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setGroups([])
        setHumans([])
        setLoading(false)
        return
      }

      try {
        ensureDefaultGroupChat(user).catch(() => {})
        const [membership, empData] = await Promise.all([
          ensureWorkspaceForUser(user),
          getWorkspaceEmployeesForUser(user).catch(() => [] as WorkspaceEmployee[]),
        ])
        const groupData = await listChats(membership.workspace_id, 'team').catch(() => [])
        setGroups((groupData || []) as GroupChat[])
        setHumans(empData)
      } catch (error) {
        console.error('Failed to load team data', error)
        setGroups([])
        setHumans([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  async function handleCreateGroup() {
    if (!user?.id) return
    const name = prompt('Group name:')
    if (!name?.trim()) return
    const participants = humans.map((h) => h.name)
    const icons = ['👥']
    try {
      await createNewGroupChat(user.id, name.trim(), participants, icons)
      const membership = await ensureWorkspaceForUser(user)
      const groupData = await listChats(membership.workspace_id, 'team').catch(() => [])
      setGroups((groupData || []) as GroupChat[])
    } catch (err) {
      console.error('Failed to create group', err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24 md:pb-8 flex items-center justify-center">
        <p className="text-[var(--olu-text-secondary)] text-sm">Loading team...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black text-2xl">{t('team.title')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-0.5">
            {humans.length} {t('team.people').toLowerCase()} · {groups.length} {t('team.groups').toLowerCase()}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
            <ShieldCheck size={18} className="text-cyan-600 dark:text-cyan-300" />
          </div>
          <div>
            <p className="font-semibold">{t('team.commandLayer')}</p>
            <p className="text-[var(--olu-text-secondary)] text-sm">{t('team.commandLayerDesc')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={14} className="text-[var(--olu-text-secondary)]" />
            <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('team.groups')}</p>
          </div>
          <button
            onClick={handleCreateGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <Plus size={12} />
            {t('team.newGroup', 'New Group')}
          </button>
        </div>
        <div className="space-y-2">
          {groups.length === 0 && (
            <p className="text-[var(--olu-muted)] text-xs text-center py-4">{t('team.noGroups')}</p>
          )}
          {groups.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[var(--olu-text-secondary)]" />
            <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('team.people')}</p>
            <span className="text-[var(--olu-muted)] text-xs">{humans.filter((h) => h.status === 'online').length} online</span>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <UserPlus size={12} />
            {t('common.invite')}
          </button>
        </div>

        {showInvite && (
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 mb-3 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">{t('common.fullName')}</label>
                <input type="text" placeholder={t('common.fullName')} className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-[var(--olu-card-border)]" />
              </div>
              <div>
                <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">{t('common.email')}</label>
                <input type="email" placeholder={t('common.email')} className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-[var(--olu-card-border)]" />
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors">
                  {t('common.sendInvite')}
                </button>
              </div>
            </div>
          </div>
        )}

        {humans.length === 0 ? (
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
            <Users size={32} className="mx-auto text-[var(--olu-muted)] mb-3" />
            <p className="text-[var(--olu-muted)] text-sm">No team members yet. Invite people to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {humans.map((emp) => (
              <PersonRow key={emp.id} emp={emp} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
