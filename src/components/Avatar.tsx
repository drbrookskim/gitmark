import { getInitial } from '../lib/pseudonym'

const AVATAR_COLORS = [
  'bg-purple-900 text-purple-200',
  'bg-blue-900 text-blue-200',
  'bg-green-900 text-green-200',
  'bg-yellow-900 text-yellow-200',
  'bg-red-900 text-red-200',
  'bg-indigo-900 text-indigo-200',
]

function colorForNickname(nickname: string): string {
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface Props {
  nickname: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-xl',
}

export default function Avatar({ nickname, size = 'md' }: Props) {
  const initial = getInitial(nickname)
  const color = colorForNickname(nickname)

  return (
    <div
      className={`${sizeClass[size]} ${color} rounded-full flex items-center justify-center font-mono font-medium shrink-0`}
    >
      {initial}
    </div>
  )
}
