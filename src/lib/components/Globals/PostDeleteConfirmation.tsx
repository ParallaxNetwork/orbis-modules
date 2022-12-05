import * as AlertDialog from '@radix-ui/react-alert-dialog'

const PostDeleteConfirmation = ({
  open,
  setOpen,
  confirm
}: {
  open: boolean
  setOpen: (state: boolean) => void
  confirm: () => Promise<void>
}) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="post__deleteconfirmation__overlay" />
        <AlertDialog.Content className="post__deleteconfirmation__content">
          <AlertDialog.Title className="post__deleteconfirmation__title">
            Are you sure you want to delete this post?
          </AlertDialog.Title>
          <AlertDialog.Description className="post__deleteconfirmation__description">
            If you ask for deletion your post might be removed from the Ceramic
            nodes hosting it.
          </AlertDialog.Description>
          <div className="post__deleteconfirmation__actions">
            <AlertDialog.Cancel asChild>
              <button className="cancel">Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button className="delete" onClick={confirm}>Delete</button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default PostDeleteConfirmation
