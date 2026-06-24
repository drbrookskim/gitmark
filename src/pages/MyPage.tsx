import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import { displayNickname } from '../lib/pseudonym'
import type { Post } from '../types'

export default function MyPage() {
  const { firebaseUser, user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<'posts'>('posts')

  useEffect(() => {
    if (!firebaseUser) return
    const q = query(
      collection(db, 'posts'),
      where('authorUid', '==', firebaseUser.uid),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ postId: d.id, ...d.data() }) as Post))
    })
    return unsub
  }, [firebaseUser])

  async function handleLogout() {
    await signOut(auth)
    navigate('/auth')
  }

  if (!firebaseUser || !user) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-mono text-[#555] hover:text-[#e8e8e8]"
        >
          ←
        </button>
        <span className="text-sm font-mono text-[#888]">내 흔적 모음</span>
        <button
          onClick={handleLogout}
          className="text-xs font-mono text-[#444] hover:text-red-400 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 프로필 */}
      <div className="px-4 py-6 border-b border-[#2a2a2a] flex flex-col items-center gap-3">
        <Avatar nickname={user.nickname} size="lg" />
        <div className="text-center">
          <div className="text-sm font-mono text-[#e8e8e8]">
            {displayNickname(user.nickname, user.isPseudonym)}
          </div>
          <div className="text-xs text-[#444] font-mono mt-1">
            내가 남긴 흔적 {posts.filter((p) => !p.deletedAt).length}개
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-[#2a2a2a]">
        <button
          onClick={() => setTab('posts')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            tab === 'posts' ? 'text-[#e8e8e8] border-b border-[#e8e8e8]' : 'text-[#555]'
          }`}
        >
          내 글 ({posts.length})
        </button>
      </div>

      {/* 글 목록 */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[#444] text-xs font-mono">
          아직 남긴 흔적이 없어요.
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.postId}
            post={post}
            onDeleted={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.postId === post.postId
                    ? { ...p, deletedAt: Date.now() }
                    : p,
                ),
              )
            }
          />
        ))
      )}

      {/* 탭바 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0d0d0d] border-t border-[#2a2a2a] flex">
        <button onClick={() => navigate('/')} className="flex-1 py-3 text-xs font-mono text-[#555] hover:text-[#e8e8e8]">
          🏠 피드
        </button>
        <button onClick={() => navigate('/write')} className="flex-1 py-3 text-xs font-mono text-[#555] hover:text-[#e8e8e8]">
          ✏ 쓰기
        </button>
        <button onClick={() => navigate('/my')} className="flex-1 py-3 text-xs font-mono text-[#e8e8e8]">
          👤 내 글
        </button>
      </nav>
    </div>
  )
}
