import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import { displayNickname } from '../lib/pseudonym'
import { formatRelativeTime, formatAbsoluteTime } from '../lib/time'
import type { Post, Comment } from '../types'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const { firebaseUser, user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return
    getDoc(doc(db, 'posts', postId)).then((snap) => {
      if (snap.exists()) {
        const p = { postId: snap.id, ...snap.data() } as Post
        setPost(p)
        setLikeCount(p.likeCount)
      }
    })

    if (firebaseUser) {
      getDoc(doc(db, 'likes', `${postId}_${firebaseUser.uid}`)).then((snap) => {
        setLiked(snap.exists())
      })
    }

    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ commentId: d.id, ...d.data() }) as Comment))
    })
    return unsub
  }, [postId, firebaseUser])

  async function handleLike() {
    if (!firebaseUser || !postId) return
    const likeRef = doc(db, 'likes', `${postId}_${firebaseUser.uid}`)
    const likeSnap = await getDoc(likeRef)
    if (likeSnap.exists()) {
      await deleteDoc(likeRef)
      await updateDoc(doc(db, 'posts', postId), { likeCount: increment(-1) })
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await setDoc(likeRef, { postId, userUid: firebaseUser.uid, createdAt: Date.now() })
      await updateDoc(doc(db, 'posts', postId), { likeCount: increment(1) })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  async function handleDeletePost() {
    if (!postId) return
    const confirmed = window.confirm('이 흔적을 지우시겠어요? 삭제 시각은 남습니다.')
    if (!confirmed) return
    await updateDoc(doc(db, 'posts', postId), { deletedAt: Date.now() })
    navigate('/')
  }

  async function handleSubmitComment() {
    if (!firebaseUser || !user || !commentText.trim() || !postId) return
    setSubmitting(true)
    const now = Date.now()
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      postId,
      parentCommentId: replyTo,
      authorUid: firebaseUser.uid,
      authorNickname: user.nickname,
      authorIsPseudonym: user.isPseudonym,
      content: commentText.trim(),
      createdAt: now,
      deletedAt: null,
    })
    await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) })
    setCommentText('')
    setReplyTo(null)
    setSubmitting(false)
  }

  async function handleDeleteComment(commentId: string) {
    if (!postId) return
    const confirmed = window.confirm('댓글을 삭제할까요?')
    if (!confirmed) return
    await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
      deletedAt: Date.now(),
    })
    await updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) })
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#444] text-sm font-mono">
        불러오는 중...
      </div>
    )
  }

  const isDeleted = post.deletedAt !== null
  const isOwner = firebaseUser?.uid === post.authorUid
  const topLevelComments = comments.filter((c) => !c.parentCommentId)
  const replies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId)

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-[#2a2a2a] px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-mono text-[#555] hover:text-[#e8e8e8] transition-colors"
        >
          ← 피드로
        </button>
      </header>

      {/* 본문 */}
      <div className="px-4 py-5 border-b border-[#2a2a2a]">
        {isDeleted ? (
          <div>
            <div className="flex items-center gap-2 text-[#444]">
              <span>╳</span>
              <span className="text-xs font-mono">삭제됨 · {formatAbsoluteTime(post.deletedAt!)}</span>
            </div>
            <p className="text-xs text-[#333] mt-1 font-mono">이 흔적은 지워졌습니다</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <Avatar nickname={post.authorNickname} size="lg" />
              <div>
                <div className="font-medium text-sm text-[#e8e8e8]">
                  {displayNickname(post.authorNickname, post.authorIsPseudonym)}
                </div>
                <div className="text-xs text-[#555] font-mono mt-0.5">
                  {formatRelativeTime(post.updatedAt)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#ccc] leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  liked ? 'text-pink-400' : 'text-[#555] hover:text-pink-400'
                }`}
              >
                <span>{liked ? '♥' : '♡'}</span>
                <span className="text-xs">{likeCount}</span>
              </button>
              <span className="text-xs text-[#555] font-mono">💬 {post.commentCount}</span>
              {isOwner && (
                <button
                  onClick={handleDeletePost}
                  className="ml-auto text-xs text-[#444] hover:text-red-400 font-mono transition-colors"
                >
                  삭제
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 댓글 목록 */}
      <div>
        {topLevelComments.map((comment) => (
          <div key={comment.commentId}>
            <CommentRow
              comment={comment}
              postId={postId!}
              myUid={firebaseUser?.uid}
              onReply={() => setReplyTo(comment.commentId)}
              onDelete={handleDeleteComment}
            />
            {replies(comment.commentId).map((reply) => (
              <div key={reply.commentId} className="pl-10">
                <CommentRow
                  comment={reply}
                  postId={postId!}
                  myUid={firebaseUser?.uid}
                  onDelete={handleDeleteComment}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 댓글 입력 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0d0d0d] border-t border-[#2a2a2a] px-4 py-3">
        {replyTo && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#555] font-mono">답글 작성 중</span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-[#444] hover:text-[#888]"
            >
              취소
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            placeholder={replyTo ? '답글을 남기세요' : '흔적을 남기세요'}
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e8e8e8] font-mono placeholder-[#333] focus:outline-none focus:border-[#555]"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            className="text-sm font-mono text-[#555] hover:text-[#e8e8e8] disabled:opacity-30 transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentRow({
  comment,
  myUid,
  onReply,
  onDelete,
}: {
  comment: Comment
  postId: string
  myUid?: string
  onReply?: () => void
  onDelete: (id: string) => void
}) {
  if (comment.deletedAt !== null) {
    return (
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2 text-[#333]">
          <span className="text-xs">●</span>
          <span className="text-xs font-mono">
            삭제됨 · {formatAbsoluteTime(comment.deletedAt)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-[#1e1e1e]">
      <div className="flex gap-2">
        <Avatar nickname={comment.authorNickname} size="sm" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-[#e8e8e8]">
              {displayNickname(comment.authorNickname, comment.authorIsPseudonym)}
            </span>
            <span className="text-xs text-[#444] font-mono">
              · {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-xs text-[#bbb] mt-1 leading-relaxed">{comment.content}</p>
          <div className="flex gap-3 mt-1">
            {onReply && (
              <button
                onClick={onReply}
                className="text-xs text-[#444] hover:text-[#888] font-mono transition-colors"
              >
                답글
              </button>
            )}
            {myUid === comment.authorUid && (
              <button
                onClick={() => onDelete(comment.commentId)}
                className="text-xs text-[#444] hover:text-red-400 font-mono transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
