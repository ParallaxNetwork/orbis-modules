import { useState, useEffect } from 'react'
import { useOrbis, Comments } from './lib'
import { useAccount, useSigner } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useLocalStorage } from './lib/hooks'

function App() {
  // wagmi
  const { data: signer } = useSigner()
  const { isConnected, isDisconnected } = useAccount()

  // orbis
  const { checkOrbisConnection, disconnectOrbis } = useOrbis()

  // theme
  const [theme, setTheme] = useLocalStorage('theme', 'dark')

  // context
  const [context, setContext] = useState(
    'kjzl6cwe1jw145gun3sei0a4puw586yxa614le1tfh434y7quv2wsm0ivhbge7x'
  )

  useEffect(() => {
    if (isConnected && signer) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      checkOrbisConnection(signer?.provider?.provider, true)
    }
  }, [isConnected, signer])

  useEffect(() => {
    if (isDisconnected) {
      console.log(isDisconnected)
      disconnectOrbis()
    }
  }, [isDisconnected])

  useEffect(() => {
    if (
      theme === 'dark' ||
      (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="w-full min-h-screen bg-white dark:bg-neutral-900">
      <div className="w-full max-w-xl mx-auto">
        <div className="flex gap-2 justify-end py-4 border-b">
          <select
            className="rounded-xl py-1 px-2 font-bold shadow-md"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="">System</option>
          </select>
          <ConnectButton showBalance={false} />
        </div>
        <div className="my-4">
          <input
            type="text"
            className="relative text-sm w-full py-2 px-3 grow max-h-[7rem] overflow-auto break-words whitespace-pre-wrap text-[var(--orbis-text-color)] bg-[var(--orbis-bg-color)] border rounded-md border-[var(--orbis-border-color-muted)] focus:border-[var(--orbis-border-color)] focus:outline-none focus:ring-0 before:pointer-events-none before:text-[var(--orbis-text-color-muted)] empty:before:content-[attr(data-placeholder)]"
            defaultValue={context}
            placeholder="Enter context id"
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        <div className="my-4 h-[84vh] rounded-md py-3 border-2 border-dashed border-neutral-700 dark:border-neutral-700">
          <Comments
            context={context}
            algorithm="all-context-master-posts"
            postboxPlaceholder="Share your comment here..."
            overflowLimit={0}
          />
        </div>
      </div>
    </div>
  )
}

export default App
