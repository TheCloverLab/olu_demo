import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Heart, MessageCircle, Send, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import type { WorkspaceExperience } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase'
import { getExperience, getForumPosts, createForumPost, getForumPostComments, createForumPostComment, toggleForumPostLike, type ForumPostWithAuthor } from '../../../domain/experience/api'

function Avatar({ user, size = 'sm' }: { user: { name?: string | null; avatar_img?: string | null; avatar_color?: string | null; initials?: string | null } | null | undefined; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (user?.avatar_img) {
    return <img src={user.avatar_img} alt={user.name ?? ''} className={clsx('rounded-xl object-cover flex-shrink-0', sz)} />
  }
  return (
    <div className={clsx(`bg-gradient-to-br ${user?.avatar_color || 'from-gray-600 to-gray-500'} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`, sz)}>
      {user?.initials || '?'}
    </div>
  )
}

function PostCard({
  post,
  currentUserId,
  isLiked,
  onLikeToggle,
}: {
  post: ForumPostWithAuthor
  currentUserId?: string
  isLiked?: boolean
  onLikeToggle: () => void
}) {
  const { t } = useTranslation()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [posting, setPosting] = useState(false)

  async function loadComments() {
    setLoadingComments(true)
    try {
      const data = await getForumPostComments(post.id)
      setComments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleComment() {
    if (!commentText.trim() || !currentUserId) return
    setPosting(true)
    try {
      await createForumPostComment(post.id, currentUserId, commentText.trim())
      setCommentText('')
      loadComments()
    } catch (err) {
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar user={post.author} />
          <div>
            <p className="font-semibold text-sm">{post.author?.name || 'Unknown'}</p>
            <p className="text-[var(--olu-muted)] text-xs">{post.author?.handle}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="h-32 rounded-xl object-cover" />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={onLikeToggle}
            className={clsx(
              'flex items-center gap-1.5 text-xs transition-colors',
              isLiked ? 'text-red-500' : 'text-[var(--olu-text-secondary)] hover:text-red-400'
            )}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
            {post.like_count}
          </button>
          <button
            onClick={() => {
              setShowComments(!showComments)
              if (!showComments && comments.length === 0) loadComments()
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--olu-text-secondary)] hover:text-cyan-400 transition-colors"
          >
            <MessageCircle size={14} />
            {post.comment_count}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="border-t border-[var(--olu-card-border)] pt-3 space-y-3">
            {loadingComments ? (
              <Loader2 size={16} className="animate-spin text-[var(--olu-muted)] mx-auto" />
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar user={comment.author} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{comment.author?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--olu-text-secondary)]">{comment.content}</p>
                  </div>
                </div>
              ))
            )}

            {currentUserId && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder={t('business.addComment')}
                  className="flex-1 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--olu-card-border)]"
                />
                <button
                  onClick={handleComment}
                  disabled={posting || !commentText.trim()}
                  className="p-1.5 rounded-xl bg-cyan-300 text-[#04111f] disabled:opacity-50"
                >
                  <Send size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ForumView() {
  const { experienceId } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostText, setNewPostText] = useState('')
  const [posting, setPosting] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())

  function reload() {
    if (!experienceId) return
    Promise.all([
      getExperience(experienceId),
      getForumPosts(experienceId),
    ])
      .then(([exp, p]) => { setExperience(exp); setPosts(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [experienceId])

  // Load which posts the current user has liked
  useEffect(() => {
    if (!user?.id || !experienceId) return
    supabase
      .from('forum_post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setLikedPostIds(new Set(data.map((d: { post_id: string }) => d.post_id)))
      })
  }, [user?.id, experienceId])

  async function handlePost() {
    if (!newPostText.trim() || !user || !experienceId) return
    setPosting(true)
    try {
      await createForumPost(experienceId, user.id, newPostText.trim())
      setNewPostText('')
      reload()
    } catch (err) {
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  async function handleLike(postId: string) {
    if (!user) return
    const wasLiked = likedPostIds.has(postId)
    // Optimistic update
    setLikedPostIds((prev) => {
      const next = new Set(prev)
      if (wasLiked) next.delete(postId); else next.add(postId)
      return next
    })
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, like_count: p.like_count + (wasLiked ? -1 : 1) } : p
    ))
    try {
      await toggleForumPostLike(postId, user.id)
    } catch (err) {
      console.error(err)
      // Revert on error
      setLikedPostIds((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.add(postId); else next.delete(postId)
        return next
      })
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, like_count: p.like_count + (wasLiked ? 1 : -1) } : p
      ))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-black text-xl">{experience?.name || 'Forum'}</h1>
          <p className="text-[var(--olu-muted)] text-xs">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Cover */}
      {experience?.cover && (
        <div className="h-32 rounded-2xl overflow-hidden">
          <img src={experience.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Composer */}
      {user && (
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder={t('consumer.writePost', "What's on your mind?")}
            rows={3}
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--olu-card-border)]"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePost}
              disabled={posting || !newPostText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
            >
              {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
          <MessageCircle size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--olu-muted)]">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isLiked={likedPostIds.has(post.id)}
              onLikeToggle={() => handleLike(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
