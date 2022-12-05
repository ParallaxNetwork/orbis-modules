# Orbis React Modules

> Decentralized social modules created with the Orbis SDK

## Live Demo

You can see the live demo [here](https://orbis-modules.vercel.app/)

## Install

Coming soon

## Usage

You need to import `OrbisProvider` somewhere on your React app. This is an example on main React app file:

```tsx
...
import App from './App'
import { Orbis } from '@orbisclub/orbis-sdk'
import { OrbisProvider } from 'orbis-react-modules'

// This options are optional
const OrbisOptions = {
  PINATA_GATEWAY: process.env.pinata_gateway,
  PINATA_API_KEY: process.env.MY_PINATA_API_KEY,
  PINATA_SECRET_API_KEY: process.env.MY_PINATA_API_SECRET
}

// Create new Orbis object
const OrbisClient = new Orbis(OrbisOptions)
...

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <OrbisProvider
      orbis={OrbisClient}
      showPoweredByOrbis={true} // Show or hide Powered By Orbis tag on footer
      showCerscanProof={false} // Show or hide Cerscan link button
     >
      <App />
    </OrbisProvider>
  </React.StrictMode>
)
```

After that you can import `useOrbis` and `Comments` module anywhere on your React app.

```tsx
...
import { useOrbis, Comments } from 'orbis-react-modules'

export default function App() {
  // Orbis context full list
  const {
    orbis,
    icons,
    profile,
    profileUrl,
    hasLit,
    showPoweredByOrbis,
    connectOrbis,
    connectLit,
    checkOrbisConnection,
    disconnectOrbis
  } = useOrbis()
  
  // Set a context in which the post is being shared.
  // Can be a random string or a group / channel id
  const context = 'someContextHere';
  
  return (
    <Comments
      context={context}
      postboxPlaceholder="Share your comment here..."
    />
  )
}
```

## Connecting to Orbis

Your app will need to set a wallet provider before connecting to Orbis. Here is an example using [wagmi](https://github.com/wagmi-dev/wagmi):

```tsx
...
import React, { useEffect } from 'react'
import { useAccount, useSigner } from 'wagmi'

export default function App() {
  // wagmi
  const { data: signer } = useSigner()
  const { isConnected, isDisconnected } = useAccount()
  
  // orbis
  const { checkOrbisConnection, disconnectOrbis } = useOrbis()
  
  // Connect Orbis when wagmi has data of signer
  useEffect(() => {
    if (isConnected && signer) {
      checkOrbisConnection(signer?.provider?.provider, true)
    }
  }, [isConnected, signer])

  // Disconnect Orbis when wagmi is disconnected
  useEffect(() => {
    if (isDisconnected) {
      console.log(isDisconnected)
      disconnectOrbis()
    }
  }, [isDisconnected])
}
```

## Dark Mode

By default `orbis-modules` will use light mode. You can set `dark` class on the parent of `Comments` module to use dark mode like this:

```tsx
...
<div className="dark">
  <Comments context={context} />
</div>
...
```

You can also make it dynamic by using localStorage to add/remove `dark` class from `<html></html>` like this:

```tsx
...

export default function App() {
  // theme using useLocalStorage hook
  const [theme, setTheme] = useLocalStorage('theme', 'dark')
  
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
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="">System</option>
      </select>
    </div>
  )
}
```

## Custom Styling

Coming soon
