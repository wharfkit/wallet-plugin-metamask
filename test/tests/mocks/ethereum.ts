/// <reference path="../../../global.d.ts" />

import {MetaMaskInpageProvider} from '@metamask/providers'

class MockMetaMaskInpageProvider implements Partial<MetaMaskInpageProvider> {
    request(args: {method: string; params?: any}) {
        switch (args.method) {
            case 'wallet_getSnaps':
                return Promise.resolve({})
            case 'wallet_requestSnaps':
                return Promise.resolve({
                    'local:http://localhost:8080': {
                        id: 'local:http://localhost:8080',
                        version: '1.0.0',
                    },
                })
            case 'wallet_invokeSnap':
                if (args.params.request.method === 'antelope_getPublicKey') {
                    return Promise.resolve(
                        'PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5BoDq63'
                    )
                }
                if (args.params.request.method === 'antelope_signTransaction') {
                    return Promise.resolve(
                        'SIG_K1_KfCdjsrTnx5cBpbA5cUdHZAsRYsnC9uKzuS1shFeqfMCfdZwX4PBm9pfHwGRT6ffz3eavhtkyNci5GoFozQAx8P8PBnDmj'
                    )
                }
                return Promise.resolve(null)
            case 'web3_clientVersion':
                return Promise.resolve(['MetaMask/v10.8.1'])
            default:
                return Promise.resolve(null)
        }
    }
}

const mockProvider = new MockMetaMaskInpageProvider()

export function setupEthereumMock() {
    global.window = global.window || {}
    global.window.ethereum = mockProvider as any
}
