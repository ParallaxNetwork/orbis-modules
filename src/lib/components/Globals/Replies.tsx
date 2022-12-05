import { useState, useMemo, useRef, useEffect, LegacyRef } from 'react'
import { useOrbis } from '../../contexts/orbis'
import Post from './Post'
import Postbox from './Postbox'

const RepliesGroup = ({
  items,
  replies,
  replyTo = null,
  onClickReply
}: {
  items: IOrbisPost[]
  replies: Record<string, IOrbisPost[]>
  replyTo: IOrbisPost | null
  onClickReply: (value: IOrbisPost | null) => void
}) => {
  return (
    <>
      {items.map((item) => (
        <div key={item.stream_id} className="replies">
          <Post
            post={item}
            replyTo={replyTo}
            onClickReply={() => onClickReply(item)}
          />
          {replies[item.stream_id] !== undefined && (
            <RepliesGroup
              items={replies[item.stream_id]}
              replies={replies}
              replyTo={replyTo}
              onClickReply={onClickReply}
            />
          )}
        </div>
      ))}
    </>
  )
}

const Replies = ({
  context,
  master,
  innerPostbox,
  replyTo,
  onClickReply,
  onNewPost
}: {
  context: string | undefined
  master: IOrbisPost
  innerPostbox: LegacyRef<HTMLDivElement> | null
  replyTo: IOrbisPost | null
  onClickReply: (value: IOrbisPost | null) => void
  onNewPost: (el: HTMLElement) => void
}) => {
  const { orbis } = useOrbis()
  const mainGroup = useRef<any>(null)
  const [posts, setPosts] = useState<IOrbisPost[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // const [hasMore, setHasMore] = useState<boolean>(false)

  const repliesGroups = useMemo(() => {
    const grouped = posts.reduce((result, a) => {
      result[a.reply_to as keyof IOrbisPost] = [
        ...(result[a.reply_to as keyof IOrbisPost] || []),
        a
      ]
      return result
    }, {} as Record<string, IOrbisPost[]>)
    return grouped
  }, [posts])

  const getPosts = async () => {
    if (!orbis || !context || !master || isLoading) return

    setIsLoading(true)

    const { data, error } = await orbis.getPosts(
      { context, master: master.stream_id },
      currentPage
    )

    if (data) {
      data.reverse()
      setPosts([...posts, ...data])
      setCurrentPage((prev) => prev + 1)
      // setHasMore(data.length >= 50)
    }

    if (error) {
      console.error(error)
    }

    setIsLoading(false)
  }

  const callback = (newPost: IOrbisPost) => {
    const _posts = [...posts, newPost]
    setPosts(_posts)
    onClickReply(null)

    // Try scroll to newly created post
    if (newPost.stream_id.startsWith('new_post-')) {
      setTimeout(() => {
        const el: HTMLElement = mainGroup.current?.querySelector(
          `.${newPost.stream_id}`
        )
        onNewPost(el)
      }, 100)
    }
  }

  useEffect(() => {
    if (context && master) getPosts()
  }, [context, master])

  return (
    <div ref={mainGroup}>
      {repliesGroups[master.stream_id] !== undefined && (
        <RepliesGroup
          items={repliesGroups[master.stream_id]}
          replies={repliesGroups}
          replyTo={replyTo}
          onClickReply={onClickReply}
        />
      )}
      {replyTo && (
        <div ref={innerPostbox}>
          <Postbox
            context={context}
            replyTo={replyTo}
            placeholder="Reply this comment..."
            cancelReplyTo={() => onClickReply(null)}
            callback={callback}
          />
        </div>
      )}
    </div>
  )
}

export default Replies
