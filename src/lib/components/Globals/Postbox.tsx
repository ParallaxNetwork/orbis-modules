import { useState, useRef, useEffect, KeyboardEvent } from 'react'

import { useOrbis } from '../../contexts/orbis'
import {
  didToAddress,
  getUsername,
  getBadgeContent,
  highlightMentions,
  debounce
} from '../../utils'
import Avatar from './Avatar'

const Postbox = ({
  context,
  editPost,
  replyTo,
  placeholder = 'Share your post here...',
  enterToShare = true,
  popoverPosition = 'top',
  cancelReplyTo,
  cancelEdit,
  callback
}: {
  context: string | undefined
  editPost?: IOrbisPost
  replyTo?: IOrbisPost | null
  placeholder?: string
  enterToShare?: boolean
  popoverPosition?: 'top' | 'bottom'
  cancelReplyTo?: () => void | undefined
  cancelEdit?: (state: boolean) => void
  callback: (value: any) => void
}) => {
  const { orbis, profile, connectOrbis } = useOrbis()

  const postBoxArea = useRef<any>(null)

  const [focusOffset, setFocusOffset] = useState<number>(0)
  const [focusNode, setFocusNode] = useState<Node | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<IOrbisProfile[]>([])
  const [mentions, setMentions] = useState<IOrbisPostMention[]>([])

  const saveCaretPos = () => {
    const sel = document.getSelection()
    if (sel) {
      setFocusOffset(sel.focusOffset)
      setFocusNode(sel.focusNode)
    }
  }

  const restoreCaretPos = () => {
    if (!postBoxArea.current) return
    postBoxArea.current.focus()
    const sel = document.getSelection()
    if (sel) sel.collapse(focusNode, focusOffset)
  }

  const searchProfiles = debounce(async () => {
    setIsSearching(true)
    setSearchResults([])
    const { data, error } = await orbis.getProfilesByUsername(searchText)
    if (data) {
      setSearchResults(data)
    } else {
      console.log(error)
    }
    setIsSearching(false)
  }, 1000)

  const addMention = (selected: IOrbisProfile) => {
    // Restore cursor position
    restoreCaretPos()

    // Get username of selected profile
    const username = selected?.details?.profile?.username?.trim()

    // Check if username already mentioned
    const hasBeenMentioned = mentions?.find(
      (o: IOrbisProfile['details']['profile']) => username === o?.username
    )

    // Save selected to mentions
    if (!hasBeenMentioned) {
      setMentions([
        ...mentions,
        {
          username: '@' + username,
          did: selected.did
        }
      ])
    }

    // Add mention tag
    const htmlTag =
      '<span href="/profile/' +
      selected.did +
      '" class="text-lime-700" contenteditable="false" data-did="' +
      selected.did +
      '">@' +
      username +
      '</span><span> </span>'

    for (let i = 0; i < searchText.length + 1; i++) {
      document.execCommand('delete', false, '')
      if (i == searchText.length) {
        document.execCommand('insertHTML', false, htmlTag)
      }
    }

    setTimeout(() => {
      // Clear search text
      setSearchText('')

      // Focus back to postBoxArea
      postBoxArea.current.focus()

      postBoxArea.current.innerHTML.replace(/&nbsp;$/, ' ')
    }, 100)
  }

  const share = async () => {
    if (!orbis || !profile) return false

    const body = postBoxArea.current.innerText

    // Cleaning up mentions
    const _mentions = mentions.filter((o) => body.includes(o.username))

    if (editPost) {
      const newContent = { ...editPost.content, body, mentions: _mentions }
      if (callback) callback(newContent)

      await orbis.editPost(editPost.stream_id, newContent)
    } else {
      const content: IOrbisPostContent = {
        body,
        context,
        master: replyTo ? replyTo.master || replyTo.stream_id : null,
        reply_to: replyTo ? replyTo.stream_id : null,
        mentions: _mentions || []
      }

      const timestamp = Math.floor(Date.now() / 1000)

      const _callbackContent = {
        content,
        context,
        creator: profile.did,
        creator_details: {
          did: profile.did,
          profile: profile.details?.profile,
          metadata: profile.details?.metadata
        },
        stream_id: 'new_post-' + timestamp,
        timestamp,
        master: replyTo ? replyTo.master || replyTo.stream_id : null,
        reply_to: replyTo ? replyTo.stream_id : null,
        reply_to_creator_details: replyTo ? replyTo.creator_details : null,
        reply_to_details: replyTo ? replyTo.content : null,
        count_commits: 1,
        count_likes: 0,
        count_haha: 0,
        count_downvotes: 0,
        count_replies: 0,
        type: replyTo ? 'reply' : null
      }

      console.log(_callbackContent)

      if (callback) callback(_callbackContent)
      postBoxArea.current.innerText = ''

      const res = await orbis.createPost(content)

      if (res.status === 200) {
        _callbackContent.stream_id = res.doc
        if (callback) callback(_callbackContent)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!e.key) return

    if (enterToShare && e.key === 'Enter' && !e.shiftKey) {
      // Don't generate a new line
      e.preventDefault()
      share()
    }
  }

  useEffect(() => {
    if (!postBoxArea.current) return

    const body = postBoxArea.current.innerText
    if (!body) {
      setSearchText('')
      setIsSearching(false)
      setSearchResults([])
    }

    /**
     * Check characters before caret
     * to determine if user's trying
     * to mention other user
     */
    let _string = ''
    for (let i = focusOffset; i > 0; i--) {
      const lastChar = focusNode?.textContent?.substring(i - 1, i)?.trim()
      _string = lastChar + _string

      // If space found then it's false
      if (!lastChar) {
        setSearchText('')
        setIsSearching(false)
        setSearchResults([])
        return
      }

      // If @ found then it's true
      if (lastChar === '@') {
        setSearchText(_string.replace('@', ''))
        return
      }

      // Default to false
      setIsSearching(false)
      setSearchText('')
    }
  }, [focusOffset, focusNode])

  useEffect(() => {
    if (searchText) {
      searchProfiles()
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchText])

  useEffect(() => {
    if (replyTo) {
      postBoxArea.current.focus()
    }
  }, [replyTo])

  useEffect(() => {
    if (editPost) {
      // Highlight all mentions
      let { body } = editPost.content
      const { mentions: _mentions } = editPost.content
      if (_mentions?.length) {
        setMentions(_mentions)
        body = highlightMentions(editPost.content)
      }
      postBoxArea.current.innerHTML = body

      // Focus to postbox
      setTimeout(() => {
        // setFocusOffset(body.length - 1)
        // saveCaretPos()
        postBoxArea.current.focus()
        if (
          typeof window.getSelection != 'undefined' &&
          typeof document.createRange != 'undefined'
        ) {
          const range = document.createRange()
          range.selectNodeContents(postBoxArea.current)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      }, 100)
    }
  }, [editPost])

  if (!profile) {
    return (
      <button className="gradient-button" onClick={connectOrbis}>
        Connect
      </button>
    )
  }

  return (
    <div className="postbox">
      {searchText && (
        <div
          className={`mentions ${
            popoverPosition === 'top' ? 'mentions--top' : 'mentions--bottom'
          }`}
        >
          <div className="mentions__scrollable">
            {isSearching ? (
              <div className="mentions__loading">Loading...</div>
            ) : (
              searchResults.map((p: IOrbisProfile) => (
                <div
                  key={p.did}
                  className="mentions__account"
                  onClick={() => addMention(p)}
                >
                  <div className="mentions__account__avatar">
                    <Avatar details={p?.details} />
                  </div>
                  <div className="mentions__account__name">
                    <span>{getUsername(p?.details)}</span>
                    <span className="badge">{getBadgeContent(p?.details)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {replyTo && (
        <div className="replyto">
          <div className="replyto__details">
            Replying to{' '}
            <strong>
              {replyTo?.creator_details?.profile?.username ||
                replyTo?.creator_details?.metadata?.ensName ||
                didToAddress(replyTo?.creator_details?.did, true)}
            </strong>
            <br />
            {replyTo.content?.body}
          </div>
          {cancelReplyTo && (
            <button
              className="replyto__cancel"
              onClick={() => cancelReplyTo && cancelReplyTo()}
            >
              &times;
            </button>
          )}
        </div>
      )}

      <div className="postbox__wrapper">
        <div
          ref={postBoxArea}
          className="postbox__contenteditable"
          contentEditable={true}
          data-placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onKeyUp={saveCaretPos}
          onMouseUp={saveCaretPos}
        />

        {!enterToShare && !editPost && (
          <button className="postbox__share" onClick={share}>
            Share
          </button>
        )}
      </div>

      {editPost && (
        <div className="postbox__editmenu">
          <button onClick={() => cancelEdit && cancelEdit(false)}>
            Cancel
          </button>{' '}
          &bull; <button onClick={share}>Save</button>
        </div>
      )}
    </div>
  )
}

export default Postbox
