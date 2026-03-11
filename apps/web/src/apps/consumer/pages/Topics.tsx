import { ChevronRight, Flame, MessageCircle, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../../context/AppContext'

export default function Topics() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { topicId } = useParams()
  const { consumerExperience } = useApp()
  const { topics } = consumerExperience.community
  const activeTopic = topicId ? topics.entries.find((topic) => topic.id === topicId) : null

  if (topicId && !activeTopic) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">{t('consumer.topicNotFound')}</div>
  }

  if (activeTopic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-300 flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <div>
            <h1 className="font-black text-2xl">{activeTopic.name}</h1>
            <p className="text-olu-muted text-sm">{t('consumer.membersInTopic', { count: Number(activeTopic.members) })}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={15} className="text-orange-300" />
            <p className="font-semibold">{t('consumer.aboutThisTopic')}</p>
          </div>
          <p className="text-sm text-olu-muted leading-relaxed">{activeTopic.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-2">{t('consumer.whatHappensHere')}</p>
            <div className="flex flex-wrap gap-2">
              {[t('consumer.discussionThreads'), t('consumer.memberFeedback'), t('consumer.hostReplies')].map((item) => (
                <span key={item} className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-2.5 py-1 text-[11px] text-olu-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-2">{t('consumer.joinConversation')}</p>
            <button
              onClick={() => navigate(`/chat?topic=${activeTopic.id}`)}
              className="mt-1 w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity"
            >
              {t('consumer.openDiscussion')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-300 flex items-center justify-center">
          <Users size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">{t('consumer.topics')}</h1>
          <p className="text-olu-muted text-sm">{topics.subtitle}</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={15} className="text-orange-300" />
          <p className="font-semibold">{t('consumer.activeRightNow')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[t('consumer.weeklyCritique'), t('consumer.memberQA'), t('consumer.dropWatch')].map((item) => (
            <span key={item} className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-2.5 py-1 text-[11px] text-olu-muted">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {topics.entries.map((topic) => (
          <button
            key={topic.id}
            onClick={() => navigate(`/topics/${topic.id}`)}
            className="w-full rounded-[24px] border border-olu-border bg-olu-surface p-5 text-left hover:bg-olu-card transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-lg">{topic.name}</p>
                <p className="text-xs text-olu-muted mt-1">{topic.members} {t('consumer.members')}</p>
              </div>
              <ChevronRight size={16} className="text-olu-muted" />
            </div>
            <p className="text-sm text-olu-muted mt-3 leading-relaxed">{topic.description}</p>
            <div className="inline-flex items-center gap-2 mt-4 text-sm text-sky-300">
              <MessageCircle size={14} />
              {t('consumer.openDiscussion')}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
