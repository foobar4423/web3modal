import type { ConfigCtrlState } from '@web3modal/core'
import { ClientCtrl, ConfigCtrl, ModalCtrl, OptionsCtrl } from '@web3modal/core'
import type { EthereumClient } from '@web3modal/ethereum'

/**
 * Types
 */
type Web3ModalConfig = Omit<ConfigCtrlState, 'enableStandaloneMode' | 'standaloneChains'>

/**
 * Client
 */
export class Web3Modal {
  public constructor(config: Web3ModalConfig, client: EthereumClient) {
    ClientCtrl.setEthereumClient(client)
    ConfigCtrl.setConfig(config)
    this.initUi()
  }

  private async initUi() {
    if (typeof window !== 'undefined') {
      await import('@web3modal/ui')
      const modal = document.createElement('w3m-modal')
      document.body.insertAdjacentElement('beforeend', modal)
    }
  }

  public openModal = ModalCtrl.open

  public closeModal = ModalCtrl.close

  public subscribeModal = ModalCtrl.subscribe

  public setTheme = ConfigCtrl.setThemeConfig

  public setSelectedChain = OptionsCtrl.setSelectedChain

  public getSelectedChain = OptionsCtrl.setSelectedChain

  public subscribeSelectedChain = OptionsCtrl.subscribe
}
