import { useState, useRef, useEffect } from 'react'
import Post from '../Globals/Post'
import Replies from '../Globals/Replies'

const CommentPost = ({
  post,
  overflowLimit = 0,
  showToggleRepliesButton = false
}: {
  post: IOrbisPost
  overflowLimit?: number
  showToggleRepliesButton?: boolean
}) => {
  const innerPostbox = useRef<any>(null)
  const masterPost = useRef<any>(null)
  const [showReplies, setShowReplies] = useState<boolean>(false)
  const [replyTo, setReplyTo] = useState<IOrbisPost | null>(null)
  const [scrollToEl, setScrollToEl] = useState<HTMLElement | string | null>(
    null
  )

  useEffect(() => {
    if (scrollToEl !== null && masterPost.current) {
      const _scrollable: HTMLElement =
        masterPost.current?.closest('.comments__posts')

      if (!_scrollable) return

      const halfScrollable = _scrollable.offsetHeight / 2

      if (scrollToEl === 'masterPost' && masterPost.current) {
        setTimeout(() => {
          _scrollable.scrollTo({
            top: masterPost.current?.offsetTop - _scrollable.offsetTop,
            behavior: 'smooth'
          })
        }, 500)
      } else if (scrollToEl === 'postbox' && innerPostbox.current) {
        setTimeout(() => {
          _scrollable.scrollTo({
            top: innerPostbox.current?.offsetTop - halfScrollable,
            behavior: 'smooth'
          })
        }, 500)
      } else {
        setTimeout(() => {
          const _el = scrollToEl as HTMLElement
          _scrollable.scrollTo({
            top: _el.offsetTop - halfScrollable,
            behavior: 'smooth'
          })
        }, 500)
      }
    }

    return () => {
      setTimeout(() => {
        setScrollToEl(null)
      }, 500)
    }
  }, [replyTo, showReplies, scrollToEl])

  useEffect(() => {
    if (!showReplies) setReplyTo(null)
  }, [showReplies])

  return (
    <div ref={masterPost} className="comments__post">
      <Post
        post={post}
        replyTo={replyTo}
        overflowLimit={overflowLimit}
        onClickReply={() => {
          setReplyTo(post)
          setShowReplies(true)
          setScrollToEl('postbox')
        }}
      />
      {showToggleRepliesButton &&
        post.count_replies !== undefined &&
        post.count_replies > 0 && (
        <button
          className={`comments__post__toggle-replies ${
            showReplies ? 'opened' : ''
          }`}
          onClick={() => {
            setScrollToEl(!showReplies ? 'masterPost' : null)
            setShowReplies((prev) => !prev)
          }}
        >
          {showReplies ? 'Hide' : 'Show'} replies
        </button>
      )}
      {(!showToggleRepliesButton || showReplies) && (
        <Replies
          context={post.context}
          master={post}
          replyTo={replyTo}
          innerPostbox={innerPostbox}
          overflowLimit={overflowLimit}
          onClickReply={(post) => {
            setReplyTo(post)
            setScrollToEl('postbox')
          }}
          onNewPost={(el: HTMLElement) => setScrollToEl(el)}
        />
      )}
    </div>
  )
}

export default CommentPost
