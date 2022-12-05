import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import '@rainbow-me/rainbowkit/styles.css'

const { chains, provider } = configureChains(
  [chain.mainnet],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_KEY }),
    infuraProvider({ apiKey: import.meta.env.VITE_INFURA_KEY }),
    publicProvider()
  ]
)

const { connectors } = getDefaultWallets({
  appName: import.meta.env.VITE_APP_NAME,
  chains
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

import { Orbis } from '@orbisclub/orbis-sdk'
import { OrbisProvider } from './lib'
import './lib/styles/globals.scss'

const OrbisClient = new Orbis({
  PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY,
  PINATA_SECRET_API_KEY: import.meta.env.VITE_PINATA_API_SECRET
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <OrbisProvider
          orbis={OrbisClient}
          showPoweredByOrbis={true}
          showCerscanProof={false}
        >
          <App />
        </OrbisProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
)
