import makeBlockie from 'ethereum-blockies-base64'
import { didToAddress } from '../../utils'

const Avatar = ({
  details
}: {
  details: IOrbisProfile['details'] | undefined
}) => {
  const _address = didToAddress(details?.did) || ''
  return (
    <div className="avatar">
      <img
        src={details?.profile?.pfp || makeBlockie(_address)}
        className="w-full h-full object-cover object-center"
      />
    </div>
  )
}

export default Avatar
