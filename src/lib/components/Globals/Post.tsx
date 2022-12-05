import { useState, useEffect, useRef, useMemo } from 'react'
import { useOrbis } from '../../contexts/orbis'
import {
  getUsername,
  getBadgeContent,
  formatMessage,
  formatDate
} from '../../utils'
import { useInterval } from '../../hooks'
import Avatar from './Avatar'
import Postbox from './Postbox'
import PostActions from './PostActions'
import PostDeleteConfirmation from './PostDeleteConfirmation'
import { IconEllipsis, IconCerscan } from '../Icons'

type Reactions = Pick<
  IOrbisPost,
  'count_likes' | 'count_downvotes' | 'count_haha'
>

const Post = ({
  post,
  replyTo = null,
  overflowLimit = 0,
  onClickReply
}: {
  post: IOrbisPost
  replyTo: IOrbisPost | null
  overflowLimit?: number
  onClickReply?: (value: IOrbisPost) => void
}) => {
  const postItem = useRef<any>()
  const { orbis, profile, icons, profileUrl } = useOrbis()
  const [reacted, setReacted] = useState<string | null>(null)
  const [postClone, setPostClone] = useState<IOrbisPost>({ ...post })
  const [hideOverflow, setHideOverflow] = useState<boolean>(
    overflowLimit > 0 ? postClone.content.body.length >= overflowLimit : false
  )
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isDeleted, setIsDeleted] = useState<number>(0)
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false)
  const [postDate, setPostDate] = useState<string | null>(null)

  const getReaction = async () => {
    if (!orbis || !profile) return
    const { data } = await orbis.getReaction(postClone.stream_id, profile.did)
    if (data) setReacted(data.type)
  }

  const getPost = async (): Promise<void> => {
    const { data, error } = await orbis.getPost(post.stream_id)

    if (error) {
      console.error(error)
    }

    if (data) {
      setPostClone(data)
    }
  }

  const reacting = async (type: string) => {
    // Quick return if already reacted
    if (type === reacted) return

    // Optimistically increase reaction count
    setReacted(type)
    const keys = {
      like: 'count_likes' as keyof Reactions,
      haha: 'count_haha' as keyof Reactions,
      downvote: 'count_downvotes' as keyof Reactions
    }
    const _post: IOrbisPost = { ...postClone }
    // Decrease previous reaction
    if (reacted) {
      _post[keys[reacted as keyof typeof keys]] -= 1
    }
    // Increase previous reaction
    _post[keys[type as keyof typeof keys]] += 1
    setPostClone({ ..._post })
    const res = await orbis.react(postClone.stream_id, type)
    // Revert back if failed
    if (res.status !== 200) {
      setPostClone({ ...postClone })
    }
  }

  const handleAction = (action: 'edit' | 'delete') => {
    if (action === 'edit') setIsEditing(true)
    else if (action === 'delete') {
      setShowDeleteConfirmation(true)
    }
  }

  const handleEdited = (content: IOrbisPostContent) => {
    setPostClone({
      ...postClone,
      content,
      count_commits: postClone.count_commits + 1
    })
    setIsEditing(false)
  }

  const handleDeletePost = async () => {
    console.log(`deleting ${postClone.stream_id}`)
    setIsDeleted(1)
    await orbis.deletePost(postClone.stream_id)
    setIsDeleted(2)
  }

  const additionalClasses = useMemo(() => {
    const classes = [postClone.stream_id]
    if (postClone.stream_id.startsWith('new_post-') || isDeleted == 1)
      classes.push('post--pulse')
    if (isDeleted == 2) classes.push('post--deleted')
    return classes.join(' ')
  }, [postClone, isDeleted])

  useInterval(() => {
    if (postClone) {
      const _date = formatDate(postClone.timestamp)
      setPostDate(_date)
    }
  }, !postClone ? null : 60000)

  useEffect(() => {
    if (post) getPost()
  }, [post])

  useEffect(() => {
    if (postClone && profile) {
      getReaction()
    }
  }, [postClone, profile])

  return (
    <div ref={postItem} className={`post ${additionalClasses}`}>
      <div className="post__side">
        <div className="post__avatar">
          <Avatar details={postClone?.creator_details} />
        </div>
      </div>
      <div className="post__content">
        <div className="post__info">
          <a
            href={`${profileUrl}${postClone.creator_details?.did}`}
            target="_blank"
            rel="noreferrer"
          >
            {getUsername(postClone.creator_details)}
          </a>
          <span className="badge">
            {getBadgeContent(postClone.creator_details)}
          </span>
          <span className="post__time">
            &bull; {postDate || formatDate(postClone.timestamp)}
          </span>
        </div>
        <div className="post__body content">
          {isDeleted == 2 ? (
            'This post is deleted'
          ) : isEditing ? (
            <Postbox
              context={postClone.context}
              editPost={postClone}
              cancelEdit={(state) => setIsEditing(state)}
              callback={handleEdited}
              enterToShare={false}
            />
          ) : (
            <>
              {formatMessage(
                postClone.content,
                hideOverflow,
                overflowLimit,
                profileUrl
              )}
            </>
          )}
          {postClone.count_commits > 1 && isDeleted != 2 && (
            <span className="post__edited">(edited)</span>
          )}
        </div>
        {postClone?.indexing_metadata?.urlMetadata && (
          <div className="post__metadata">
            {postClone?.indexing_metadata?.urlMetadata?.image && (
              <a
                href={postClone?.indexing_metadata?.urlMetadata?.url}
                className="post__metadata__image"
                target="_blank"
                rel="noreferrer"
              >
                <img src={postClone?.indexing_metadata?.urlMetadata?.image} />
              </a>
            )}
            <div className="post__metadata__content">
              <small>{postClone?.indexing_metadata?.urlMetadata?.source}</small>
              <h1>
                <a
                  href={postClone?.indexing_metadata?.urlMetadata?.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {postClone?.indexing_metadata?.urlMetadata?.title}
                </a>
              </h1>
              <p>{postClone?.indexing_metadata?.urlMetadata?.description}</p>
            </div>
          </div>
        )}
        {hideOverflow && (
          <button
            className="gradient-button"
            onClick={() => setHideOverflow(false)}
          >
            View more
          </button>
        )}
        {isDeleted != 2 && (
          <div className="post__menu">
            <div className="post__reactions">
              <button
                className={`${
                  replyTo?.stream_id === postClone.stream_id ? 'active' : ''
                }`}
                onClick={() => onClickReply && onClickReply(postClone)}
                title="Reply"
              >
                <span className="icon">{icons.replyto}</span>
              </button>
              <button
                className={reacted === 'like' ? 'active' : ''}
                onClick={() => reacting('like')}
                disabled={reacted === 'like'}
                title="Like"
              >
                <span className="icon">
                  {reacted === 'like' ? icons.likeActive : icons.like}
                </span>
                <span>{postClone.count_likes}</span>
              </button>
              <button
                className={reacted === 'haha' ? 'active' : ''}
                onClick={() => reacting('haha')}
                disabled={reacted === 'haha'}
                title="HAHA"
              >
                <span className="icon">
                  {reacted === 'haha' ? icons.hahaActive : icons.haha}
                </span>
                <span>{postClone.count_haha}</span>
              </button>
              <button
                className={reacted === 'downvote' ? 'active' : ''}
                onClick={() => reacting('downvote')}
                disabled={reacted === 'downvote'}
                title="Downvote"
              >
                <span className="icon">
                  {reacted === 'downvote'
                    ? icons.downvoteActive
                    : icons.downvote}
                </span>
                <span>{postClone.count_downvotes}</span>
              </button>
            </div>
            {postClone.stream_id !== 'new_post' && (
              <div className="post__actions">
                {post?.creator_details?.did === profile?.did && (
                  <PostActions onAction={handleAction}>
                    <button>
                      <span className="icon">
                        <IconEllipsis />
                      </span>
                    </button>
                  </PostActions>
                )}
                <a
                  href={`https://cerscan.com/mainnet/stream/${postClone.stream_id}`}
                  className="cerscan-proof"
                  target="_blank"
                  rel="noreferrer"
                  title="View on Cerscan"
                >
                  <span className="icon">
                    <IconCerscan />
                  </span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <PostDeleteConfirmation
        open={showDeleteConfirmation}
        setOpen={setShowDeleteConfirmation}
        confirm={handleDeletePost}
      />
    </div>
  )
}

export default Post
