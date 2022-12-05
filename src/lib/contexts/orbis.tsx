import {
  useContext,
  createContext,
  useState,
  ReactNode,
  ReactElement
} from 'react'
import {
  IconHaha,
  IconDownvote,
  IconHeartFill,
  IconHeartOutline,
  IconComment,
  IconReplyto
} from '../components/Icons'
import { sleep } from '../utils'

interface IOrbisContext {
  orbis: IOrbis
  icons: IOrbisIcons
  profile: IOrbisProfile | null
  profileUrl: string
  hasLit: boolean
  showPoweredByOrbis: boolean
  showCerscanProof: boolean
  connectOrbis: (provider: any) => Promise<void>
  connectLit: (provider: any) => Promise<{
    status?: number
    error?: any
    result?: string
  }>
  checkOrbisConnection: (provider: any, autoConnect?: boolean) => Promise<void>
  disconnectOrbis: () => void
}

interface IOrbisIcons {
  like?: ReactElement
  likeActive?: ReactElement
  haha?: ReactElement
  hahaActive?: ReactElement
  downvote?: ReactElement
  downvoteActive?: ReactElement
  replyto?: ReactElement
  replytoActive?: ReactElement
  comment?: ReactElement
}

const defaultIcons = {
  like: <IconHeartOutline />,
  likeActive: <IconHeartFill />,
  haha: <IconHaha />,
  hahaActive: <IconHaha />,
  downvote: <IconDownvote />,
  downvoteActive: <IconDownvote />,
  replyto: <IconReplyto />,
  replytoActive: <IconReplyto />,
  comment: <IconComment />
}

const OrbisContext = createContext({} as IOrbisContext)

const OrbisProvider = ({
  children,
  orbis,
  customIcons = null,
  profileUrl = 'https://app.orbis.club/profile/',
  showPoweredByOrbis = false,
  showCerscanProof = false
}: {
  children?: ReactNode
  orbis: IOrbis
  customIcons?: IOrbisIcons | null
  profileUrl?: string
  showPoweredByOrbis?: boolean
  showCerscanProof?: boolean
}): ReactElement => {
  const icons: IOrbisIcons = customIcons || defaultIcons
  const [profile, setProfile] = useState<IOrbisProfile | null>(null)
  const [hasLit, setHasLit] = useState(false)

  const connectOrbis: IOrbisContext['connectOrbis'] = async (provider) => {
    console.log('connecting', provider)
    const res = await orbis.connect_v2({
      provider,
      chain: 'ethereum'
    })

    if (res.status !== 200) {
      await sleep(2000)
      await connectOrbis(provider)
    } else {
      const { data } = await orbis.getProfile(res.did)
      setProfile(data)
    }
  }

  const disconnectOrbis: IOrbisContext['disconnectOrbis'] = () => {
    const res = orbis.logout()

    if (res.status === 200) {
      setProfile(null)
    }
  }

  const connectLit: IOrbisContext['connectLit'] = async (provider) => {
    const res = await orbis.connectLit(provider)
    setHasLit(res.status === 200)
    return res
  }

  const checkOrbisConnection: IOrbisContext['checkOrbisConnection'] = async (
    provider,
    autoConnect = false
  ) => {
    const res = await orbis.isConnected()

    if (res.status === 200) {
      const { data } = await orbis.getProfile(res.did)
      setHasLit(res?.details?.hasLit)
      setProfile(data)
    } else if (autoConnect) {
      await connectOrbis(provider)
    }
  }

  return (
    <OrbisContext.Provider
      value={{
        orbis,
        icons,
        profile,
        profileUrl,
        hasLit,
        showPoweredByOrbis,
        showCerscanProof,
        connectOrbis,
        connectLit,
        checkOrbisConnection,
        disconnectOrbis
      }}
    >
      {children}
    </OrbisContext.Provider>
  )
}

const useOrbis = () => {
  return useContext(OrbisContext)
}

export { OrbisProvider, useOrbis }
