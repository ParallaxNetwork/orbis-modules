const Loadmore = ({
  onClick,
  text = 'Load older posts'
}: {
  onClick: () => Promise<void>
  text?: string
}) => {
  return <button className="gradient-button" onClick={onClick}>{text}</button>
}

export default Loadmore
