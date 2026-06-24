import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, deleteDoc, increment, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'
import { displayNickname } from '../lib/pseudonym'
import { formatRelativeTime, formatAbsoluteTime } from '../lib/time'
import type { Post } from '../types'

interface Props {
  post: Post
  onDeleted?: () => void
}

export default function PostCard({ post, onDeleted }: Props) {
  const { firebaseUser } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)

  const isDeleted = post.deletedAt !== null
  const isOwner = firebaseUser?.uid === post.authorUid

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    if (!firebaseUser) return

    const likeRef = doc(db, 'likes', `${post.postId}_${firebaseUser.uid}`)
    const likeSnap = await getDoc(likeRef)

    if (likeSnap.exists()) {
      await deleteDoc(likeRef)
      await updateDoc(doc(db, 'posts', post.postId), { likeCount: increment(-1) })
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await setDoc(likeRef, {
        postId: post.postId,
        userUid: firebaseUser.uid,
        createdAt: Date.now(),
      })
      await updateDoc(doc(db, 'posts', post.postId), { likeCount: increment(1) })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isOwner) return
    const confirmed = window.confirm('이 흔적을 지우시겠어요? 삭제 시각은 남습니다.')
    if (!confirmed) return
    await updateDoc(doc(db, 'posts', post.postId), { deletedAt: Date.now() })
    onDeleted?.()
  }

  if (isDeleted) {
    return (
      <div className="border-b border-[#2a2a2a] px-4 py-4">
        <div className="flex items-center gap-2 text-[#444]">
          <span className="text-lg">╳</span>
          <span className="text-xs font-mono">
            삭제됨 · {formatAbsoluteTime(post.deletedAt!)}
          </span>
        </div>
        <p className="text-xs text-[#333] mt-1 font-mono">이 흔적은 지워졌습니다</p>
      </div>
    )
  }

  return (
    <div
      className="border-b border-[#2a2a2a] px-4 py-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/post/${post.postId}`)}
    >
      <div className="flex gap-3">
        <Avatar nickname={post.authorNickname} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#e8e8e8]">
              {displayNickname(post.authorNickname, post.authorIsPseudonym)}
            </span>
            <span className="text-xs text-[#555]">
              · {formatRelativeTime(post.updatedAt)}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#ccc] leading-relaxed break-words">
            {post.content}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <button
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-pink-400' : 'text-[#555] hover:text-pink-400'
              }`}
              onClick={handleLike}
            >
              <span>{liked ? '♥' : '♡'}</span>
              <span>{likeCount}</span>
            </button>
            <span className="flex items-center gap-1 text-xs text-[#555]">
              <span>💬</span>
              <span>{post.commentCount}</span>
            </span>
            {isOwner && (
              <button
                className="ml-auto text-xs text-[#444] hover:text-red-400 transition-colors"
                onClick={handleDelete}
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
