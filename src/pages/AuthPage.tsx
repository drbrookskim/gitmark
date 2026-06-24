import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { isPseudonymSuspected, getInitial } from '../lib/pseudonym'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const initial = nickname.trim() ? getInitial(nickname) : '?'
  const isPseudonym = isPseudonymSuspected(nickname)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!nickname.trim()) {
          setError('닉네임을 입력해주세요.')
          return
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          nickname: nickname.trim(),
          isPseudonym,
          createdAt: Date.now(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) setError('이미 사용 중인 이메일입니다.')
        else if (err.message.includes('wrong-password') || err.message.includes('invalid-credential'))
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        else if (err.message.includes('weak-password'))
          setError('비밀번호는 6자 이상이어야 합니다.')
        else setError('오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-mono font-light tracking-widest text-[#e8e8e8]">
            g i t m a r k
          </h1>
          <p className="text-xs text-[#555] mt-2 font-mono">
            왔다 갔다는 흔적을 남기는 곳
          </p>
        </div>

        {/* 이니셜 아바타 미리보기 (가입 모드) */}
        {mode === 'signup' && (
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-purple-900 flex items-center justify-center text-2xl font-mono text-purple-200 transition-all">
              {initial}
            </div>
            {nickname.trim() && (
              <div className="mt-2 text-xs text-[#666] font-mono">
                {nickname.trim()}
                {isPseudonym && (
                  <span className="ml-1 text-yellow-600">(가명)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 탭 */}
        <div className="flex border-b border-[#2a2a2a] mb-6">
          <button
            className={`flex-1 pb-2 text-sm font-mono transition-colors ${
              mode === 'login'
                ? 'text-[#e8e8e8] border-b border-[#e8e8e8]'
                : 'text-[#555]'
            }`}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-mono transition-colors ${
              mode === 'signup'
                ? 'text-[#e8e8e8] border-b border-[#e8e8e8]'
                : 'text-[#555]'
            }`}
            onClick={() => setMode('signup')}
          >
            가입하기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-[#666] mb-1 font-mono">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="나를 부를 이름"
                maxLength={20}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e8e8e8] font-mono placeholder-[#444] focus:outline-none focus:border-[#555]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#666] mb-1 font-mono">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e8e8e8] font-mono placeholder-[#444] focus:outline-none focus:border-[#555]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#666] mb-1 font-mono">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                required
                minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 pr-10 text-sm text-[#e8e8e8] font-mono placeholder-[#444] focus:outline-none focus:border-[#555]"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] text-xs"
              >
                {showPw ? '숨김' : '표시'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#666] text-[#e8e8e8] py-2.5 rounded text-sm font-mono transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? '로그인' : '▶ 흔적 남기기 시작'}
          </button>
        </form>
      </div>
    </div>
  )
}
