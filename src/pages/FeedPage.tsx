import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import type { Post } from '../types'

export default function FeedPage() {
  const { firebaseUser } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('updatedAt', 'desc'),
      limit(50),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ postId: d.id, ...d.data() }) as Post))
      setLoading(false)
    })
    return unsub
  }, [])

  if (!firebaseUser) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-mono tracking-widest text-[#e8e8e8]">
          gitmark
        </span>
        <button
          onClick={() => navigate('/write')}
          className="text-xs font-mono text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          ✏ 흔적 남기기
        </button>
      </header>

      {/* 피드 */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#444] text-sm font-mono">
          불러오는 중...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#444] font-mono">
          <p className="text-sm">아직 아무도 다녀가지 않았어요.</p>
          <button
            onClick={() => navigate('/write')}
            className="mt-4 text-xs text-[#666] hover:text-[#e8e8e8] transition-colors"
          >
            첫 번째 흔적을 남겨보세요 →
          </button>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} />
          ))}
        </div>
      )}

      {/* 탭바 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0d0d0d] border-t border-[#2a2a2a] flex">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 text-xs font-mono text-[#e8e8e8]"
        >
          🏠 피드
        </button>
        <button
          onClick={() => navigate('/write')}
          className="flex-1 py-3 text-xs font-mono text-[#555] hover:text-[#e8e8e8]"
        >
          ✏ 쓰기
        </button>
        <button
          onClick={() => navigate('/my')}
          className="flex-1 py-3 text-xs font-mono text-[#555] hover:text-[#e8e8e8]"
        >
          👤 내 글
        </button>
      </nav>

      <div className="h-16" />
    </div>
  )
}
