import { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const PostActions = ({
  children,
  onAction
}: {
  children: ReactNode
  onAction: (action: 'edit' | 'delete') => void
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="post__popover"
          side="top"
          sideOffset={5}
        >
          <DropdownMenu.Item className="edit" onSelect={() => onAction('edit')}>
            Edit Post
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="delete"
            onSelect={() => onAction('delete')}
          >
            Delete Post
          </DropdownMenu.Item>
          <DropdownMenu.Arrow className="post__popover__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default PostActions
