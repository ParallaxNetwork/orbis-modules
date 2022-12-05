import { useState, useRef, useEffect } from 'react'
import { useInterval } from '../../hooks'
import { useOrbis } from '../../contexts/orbis'
import CommentPost from './CommentPost'
import Postbox from '../Globals/Postbox'
import Loadmore from '../Globals/Loadmore'
import Loading from '../Globals/Loading'
import PoweredByOrbis from '../Globals/PoweredByOrbis'

const Comments = ({
  context,
  algorithm = 'all-context-master-posts',
  postboxPlaceholder = 'Share your comment here',
  overflowLimit = 0,
  showToggleRepliesButton = false
}: {
  context: string
  algorithm?: keyof typeof IOrbisGetPostsAlgorithm | null
  postboxPlaceholder?: string
  overflowLimit?: number
  showToggleRepliesButton?: boolean
}) => {
  const comments = useRef<any>()
  const { orbis, showPoweredByOrbis } = useOrbis()

  const [currentPage, setCurrentPage] = useState<number>(0)
  const [posts, setPosts] = useState<IOrbisPost[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [unreads, setUnreads] = useState<number>(0)
  const [pausePool, setPausePool] = useState<boolean>(false)

  const getComments: (options?: {
    polling?: boolean
    reset?: boolean
  }) => Promise<void> = async (options) => {
    if (!orbis || !context || isLoading) return

    const _posts = options?.reset ? [] : [...posts]

    if (!options?.polling) {
      setPausePool(true)
      setIsLoading(true)
    }

    const { data, error } = await orbis.getPosts(
      { context, algorithm },
      options?.polling || options?.reset ? 0 : currentPage
    )

    if (data) {
      if (!options?.polling) {
        setPosts([..._posts, ...data])
        const nextPage = options?.reset ? 1 : currentPage + 1
        setCurrentPage(nextPage)
        setHasMore(data.length >= 50)
        setPausePool(false)
        setIsLoading(false)
      } else {
        const unique = data.filter(
          (a) => !_posts.some((b) => a.stream_id === b.stream_id)
        )
        if (unique.length > 0) {
          setPosts([...unique, ..._posts])
          setUnreads((prev) => prev + unique.length)
        }
      }
    }

    if (error) {
      console.error(error)
    }
  }

  const callback = (newPost: IOrbisPost) => {
    const _posts = [newPost, ...posts]
    setPosts(_posts)
  }

  useInterval(
    () => {
      getComments({ polling: true })
    },
    !pausePool ? 10000 : null
  )

  useEffect(() => {
    if (context) {
      setCurrentPage(0)
      setTimeout(() => {
        getComments({ reset: true })
      }, 100)
    }
  }, [context])

  return (
    <div ref={comments} className="comments">
      <div className="comments__postbox">
        <Postbox
          context={context}
          placeholder={postboxPlaceholder}
          popoverPosition="bottom"
          callback={callback}
          enterToShare={false}
        />
      </div>
      <div className="comments__posts">
        {posts.map((post) => (
          <CommentPost
            key={post.stream_id}
            post={post}
            overflowLimit={overflowLimit}
            showToggleRepliesButton={showToggleRepliesButton}
          />
        ))}
        {hasMore && !isLoading && <Loadmore onClick={() => getComments()} />}
        {isLoading && <Loading />}
        {unreads > 0 && (
          <div>
            {unreads} New {unreads > 1 ? 'Messages' : 'Message'}
          </div>
        )}
      </div>
      {showPoweredByOrbis && <PoweredByOrbis />}
    </div>
  )
}

export default Comments
