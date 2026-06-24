// 흔한 한국 성씨 목록
const KOREAN_SURNAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
  '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남',
]

// 흔한 영어 이름 패턴 (간단한 사전)
const COMMON_ENGLISH_NAMES = [
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard',
  'joseph', 'thomas', 'charles', 'mary', 'patricia', 'jennifer', 'linda',
  'barbara', 'elizabeth', 'susan', 'jessica', 'sarah', 'karen',
  'minho', 'junho', 'jinho', 'soyeon', 'jiyeon', 'minji', 'hyunji',
]

export function isPseudonymSuspected(nickname: string): boolean {
  const trimmed = nickname.trim()

  // 한글 2~4자이면서 흔한 성씨로 시작하는 경우
  if (/^[가-힣]{2,4}$/.test(trimmed)) {
    const firstChar = trimmed[0]
    if (KOREAN_SURNAMES.includes(firstChar)) {
      return true
    }
  }

  // 영문 이름 사전 매칭 (대소문자 무관)
  const lower = trimmed.toLowerCase()
  if (COMMON_ENGLISH_NAMES.some((name) => lower === name)) {
    return true
  }

  return false
}

// 닉네임 표시용: 가명 의심 시 "(가명)" 붙이기
export function displayNickname(nickname: string, isPseudonym: boolean): string {
  return isPseudonym ? `${nickname} (가명)` : nickname
}

// 이니셜 추출: 한글이면 첫 글자, 영문이면 첫 대문자
export function getInitial(nickname: string): string {
  const trimmed = nickname.trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}
