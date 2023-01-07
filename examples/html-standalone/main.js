import { SignClient } from '@walletconnect/sign-client'
import { Web3Modal } from '@web3modal/standalone'

// 0. Define ui elements
const connectButton = document.getElementById('connect-button')
const getWalletsButton = document.getElementById('getWallets-button')
getWalletsButton.disabled = true
const getNFTsButton = document.getElementById('getNFTs-button')
getNFTsButton.disabled = true
const walletIdsSelect = document.getElementById('walletIds-select')
walletIdsSelect.disabled = true
const resultOutput = document.getElementById('result-output')

function output(result) {
  resultOutput.innerText = JSON.stringify(result, null, '    ')
}

// 1. Define constants
const projectId = '055e23cc494b99b68603d1225080660f'
const namespaces = {
  chia: {
    /*
     * NG: chains: ['chia:testnet', 'chia:mainnet']
     *
     * The following error message is displayed in the Chia reference client (Developer Tools => Console).
     * 'Non conforming namespaces. update() namespaces accounts don't satisfy requiredNamespaces chains for chia'
     *
     * The client returns only the main net, so the number of chains does not match and an error occurs.
     *
     * https://github.com/WalletConnect/walletconnect-monorepo/blob/2de7f690173a75665151d6a5ef76967748cff3ad/packages/utils/src/validators.ts#L450
     *   https://github.com/WalletConnect/walletconnect-monorepo/blob/873f23556863f0467e4ea177541b82edee78066a/packages/utils/src/namespaces.ts#L3
     *   https://github.com/WalletConnect/walletconnect-monorepo/blob/873f23556863f0467e4ea177541b82edee78066a/packages/utils/src/misc.ts#L165
     * https://github.com/WalletConnect/walletconnect-monorepo/blob/873f23556863f0467e4ea177541b82edee78066a/packages/sign-client/src/controllers/engine.ts#L867
     * https://github.com/WalletConnect/walletconnect-monorepo/blob/873f23556863f0467e4ea177541b82edee78066a/packages/sign-client/src/controllers/engine.ts#L147
     */
    chains: ['chia:mainnet'],
    methods: ['getWallets', 'getNFTs'].map(command => `chia_${command}`),
    events: []
  }
}

// 3. Create modal client
export const web3Modal = new Web3Modal({ projectId, standaloneChains: namespaces.chia.chains })
export let signClient = undefined

// 4. Initialise clients
async function initialize() {
  try {
    connectButton.disabled = true
    signClient = await SignClient.init({ projectId })
    connectButton.disabled = false
    connectButton.innerText = 'Connect Wallet'
  } catch (err) {
    console.error(err)
  }
}

initialize()

let session = undefined
let requestId = 1

// 5. Create connection handler
connectButton.addEventListener('click', async () => {
  try {
    if (signClient) {
      const { uri, approval } = await signClient.connect({ requiredNamespaces: namespaces })
      if (uri) {
        web3Modal.openModal({ uri })
        session = await approval()
        console.log(session)
        output(session)
        getWalletsButton.disabled = false
        getWalletsButton.innerText = 'Get Wallets'
        web3Modal.closeModal()
      }
    }
  } catch (err) {
    console.error(err)
  }
})

getWalletsButton.addEventListener('click', async () => {
  try {
    if (session) {
      const [network, instance, fingerprint] = session.namespaces.chia.accounts[0].split(':')
      requestId += 1
      const result = await signClient.request({
        topic: session.topic,
        chainId: `${network}:${instance}`,
        request: {
          id: requestId,
          jsonrpc: '2.0',
          method: 'chia_getWallets',
          params: {
            fingerprint
          }
        }
      })
      console.log(result)
      output(result)
      getNFTsButton.disabled = false
      getNFTsButton.innerText = 'Get NFTs'
      walletIdsSelect.disabled = false
      // WalletType: https://github.com/Chia-Network/chia-blockchain-gui/blob/main/packages/api/src/constants/WalletType.ts
      const nftWallets = result.data.filter(e => e.type === 10)
      nftWallets.forEach(e => {
        const opt = document.createElement('option')
        opt.value = e.id
        opt.text = `ID: ${e.id} DID: ${e.meta.did}`
        walletIdsSelect.add(opt)
      })
    }
  } catch (err) {
    console.error(err)
  }
})

getNFTsButton.addEventListener('click', async () => {
  try {
    if (session) {
      const walletIds = Array.from(walletIdsSelect.selectedOptions)
        .filter(e => e.value !== '')
        .map(e => parseInt(e.value, 10))
      if (walletIds.length === 0) {
        // eslint-disable-next-line no-alert
        alert('Please select NFT Wallet ID')

        return
      }
      const [network, instance, fingerprint] = session.namespaces.chia.accounts[0].split(':')
      requestId += 1
      const result = await signClient.request({
        topic: session.topic,
        chainId: `${network}:${instance}`,
        request: {
          id: requestId,
          jsonrpc: '2.0',
          method: 'chia_getNFTs',
          params: {
            fingerprint,
            walletIds
          }
        }
      })
      console.log(result)
      output(result)
    }
  } catch (err) {
    console.error(err)
  }
})
