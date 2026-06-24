export interface User {
  uid: string
  nickname: string
  isPseudonym: boolean
  createdAt: number
}

export interface Post {
  postId: string
  authorUid: string
  authorNickname: string
  authorIsPseudonym: boolean
  content: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  likeCount: number
  commentCount: number
}

export interface Like {
  postId: string
  userUid: string
  createdAt: number
}

export interface Comment {
  commentId: string
  postId: string
  parentCommentId: string | null
  authorUid: string
  authorNickname: string
  authorIsPseudonym: boolean
  content: string
  createdAt: number
  deletedAt: number | null
}
