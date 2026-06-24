import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const MAX_CHARS = 280

export default function WritePage() {
  const { firebaseUser, user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const remaining = MAX_CHARS - content.length
  const percent = Math.round((content.length / MAX_CHARS) * 100)
  const isOverLimit = content.length > MAX_CHARS

  async function handleSubmit() {
    if (!firebaseUser || !user || !content.trim() || isOverLimit) return
    setSubmitting(true)
    const now = Date.now()
    await addDoc(collection(db, 'posts'), {
      authorUid: firebaseUser.uid,
      authorNickname: user.nickname,
      authorIsPseudonym: user.isPseudonym,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      likeCount: 0,
      commentCount: 0,
    })
    navigate('/')
  }

  function handleCancel() {
    if (content.trim()) {
      const confirmed = window.confirm('작성 중인 내용이 사라집니다. 취소할까요?')
      if (!confirmed) return
    }
    navigate(-1)
  }

  if (!firebaseUser) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <button
          onClick={handleCancel}
          className="text-sm font-mono text-[#555] hover:text-[#e8e8e8] transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isOverLimit || submitting}
          className="text-sm font-mono px-4 py-1 border border-[#3a3a3a] rounded hover:border-[#666] text-[#e8e8e8] disabled:opacity-30 transition-colors"
        >
          {submitting ? '...' : '남기기'}
        </button>
      </header>

      {/* 입력 영역 */}
      <div className="flex-1 px-4 py-4">
        {user && (
          <div className="text-xs text-[#555] font-mono mb-3">
            {user.nickname}{user.isPseudonym && ' (가명)'}
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="왔다 갔다는 흔적을 남기세요"
          autoFocus
          className="w-full bg-transparent text-sm text-[#e8e8e8] font-mono placeholder-[#333] resize-none focus:outline-none leading-relaxed"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>

      {/* 글자수 프로그레스 바 */}
      <div className="sticky bottom-0 bg-[#0d0d0d] border-t border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverLimit
                  ? 'bg-red-500'
                  : percent > 90
                  ? 'bg-yellow-500'
                  : 'bg-[#555]'
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <span
            className={`text-xs font-mono tabular-nums ${
              isOverLimit ? 'text-red-400' : remaining < 20 ? 'text-yellow-500' : 'text-[#555]'
            }`}
          >
            {remaining}
          </span>
        </div>
      </div>
    </div>
  )
}
