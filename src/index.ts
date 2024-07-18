import {
    AbstractWalletPlugin,
    cancelable,
    Cancelable,
    Checksum256,
    Checksum256Type,
    LoginContext,
    PermissionLevel,
    PublicKey,
    ResolvedSigningRequest,
    Signature,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'
import {checkIsFlask, getSnapsProvider, InvokeSnapParams, Snap} from './metamask'
import {MetaMaskInpageProvider, RequestArguments} from '@metamask/providers'
import {AccountCreator} from '@greymass/create-account'

export type Request = (params: RequestArguments) => Promise<unknown | null>
export type GetSnapsResponse = Record<string, Snap>

interface AccountFound {
    actor: string
    permission: string
}

const defaultSnapOrigin = 'local:http://localhost:8080'
// const defaultSnapOrigin = 'npm:@greymass/test-snap'

export class WalletPluginMetaMask extends AbstractWalletPlugin implements WalletPlugin {
    public id = 'wallet-plugin-metamask'
    readonly config: WalletPluginConfig = {
        requiresChainSelect: true,
        requiresPermissionSelect: false,
    }
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'MetaMask',
        description: '',
        logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iMCAwIDIwNC44IDE5Mi40IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyMDQuOCAxOTIuNDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtkaXNwbGF5Om5vbmU7fQoJLnN0MXtmaWxsOiNGNTg0MUY7fQoJLnN0MntmaWxsOiNFMjc2MjU7fQoJLnN0M3tmaWxsOiNEN0MxQjM7fQoJLnN0NHtmaWxsOiMyRjM0M0I7fQoJLnN0NXtmaWxsOiNDQzYyMjg7fQoJLnN0NntmaWxsOiNDMEFEOUU7fQoJLnN0N3tmaWxsOiM3NjNFMUE7fQo8L3N0eWxlPgo8ZyBpZD0iYmdfeDI4X2RvX25vdF9leHBvcnRfeDI5XyIgY2xhc3M9InN0MCI+CjwvZz4KPGcgaWQ9Ik1NX0hlYWRfYmFja2dyb3VuZF9feDI4X0RvX25vdF9lZGl0X3gyOV8iPgoJPGc+CgkJPHBhdGggY2xhc3M9InN0MSIgZD0iTTE2Ny40LDk2LjFsNi45LTguMWwtMy0yLjJsNC44LTQuNGwtMy43LTIuOGw0LjgtMy42bC0zLjEtMi40bDUtMjQuNGwtNy42LTIyLjYgTTE3MS41LDI1LjZsLTQ4LjgsMTguMWwwLDAKCQkJbDAsMEg4MmwwLDBMMzMuMiwyNS42bDAuMywwLjJsLTAuMy0wLjJsLTcuNiwyMi42bDUuMSwyNC40TDI3LjUsNzVsNC45LDMuNmwtMy43LDIuOGw0LjgsNC40bC0zLDIuMmw2LjksOC4xbC0xMC41LDMyLjRoMGwwLDAKCQkJbDkuNywzMy4xbDM0LjEtOS40bDAtMC4xbDAsMC4xbDAsMGwwLDBsMCwwdjBsMCwwbDAsMGwwLDBsNi42LDUuNGwxMy41LDkuMmgyMy4xbDEzLjUtOS4ybDYuNi01LjRsMCwwdjBsMCwwbDAsMGwzNC4yLDkuNAoJCQlsOS44LTMzLjFsMCwwaDBsLTEwLjYtMzIuNCBNNzAuNywxNTIuMUw3MC43LDE1Mi4xTDcwLjcsMTUyLjEiLz4KCTwvZz4KPC9nPgo8ZyBpZD0iTG9nb3MiPgoJPGc+CgkJPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSIxNzEuNSwyNS42IDExMS42LDY5LjcgMTIyLjcsNDMuNyAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMzMuMiwyNS42IDkyLjYsNzAuMSA4Miw0My43IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSIxNTAsMTI3LjkgMTM0LDE1Mi4xIDE2OC4yLDE2MS41IDE3OCwxMjguNCAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iMjYuOSwxMjguNCAzNi42LDE2MS41IDcwLjcsMTUyLjEgNTQuOCwxMjcuOSAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iNjguOSw4Ni45IDU5LjQsMTAxLjIgOTMuMiwxMDIuNyA5Mi4xLDY2LjUgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3QyIiBwb2ludHM9IjEzNS45LDg2LjkgMTEyLjMsNjYuMSAxMTEuNiwxMDIuNyAxNDUuNCwxMDEuMiAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iNzAuNywxNTIuMSA5MS4yLDE0Mi4zIDczLjUsMTI4LjcgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3QyIiBwb2ludHM9IjExMy42LDE0Mi4zIDEzNCwxNTIuMSAxMzEuMiwxMjguNyAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDMiIHBvaW50cz0iMTM0LDE1Mi4xIDExMy42LDE0Mi4zIDExNS4zLDE1NS41IDExNS4xLDE2MS4xIAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MyIgcG9pbnRzPSI3MC43LDE1Mi4xIDg5LjcsMTYxLjEgODkuNiwxNTUuNSA5MS4yLDE0Mi4zIAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSI5MCwxMTkuOSA3My4xLDExNSA4NS4xLDEwOS41IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMTQuNywxMTkuOSAxMTkuNywxMDkuNSAxMzEuNywxMTUgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjcwLjcsMTUyLjEgNzMuNywxMjcuOSA1NC44LDEyOC40IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0NSIgcG9pbnRzPSIxMzEuMSwxMjcuOSAxMzQsMTUyLjEgMTUwLDEyOC40IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0NSIgcG9pbnRzPSIxNDUuNCwxMDEuMiAxMTEuNiwxMDIuNyAxMTQuNywxMTkuOSAxMTkuNywxMDkuNSAxMzEuNywxMTUgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3Q1IiBwb2ludHM9IjczLjEsMTE1IDg1LjEsMTA5LjUgOTAsMTE5LjkgOTMuMiwxMDIuNyA1OS40LDEwMS4yIAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSI1OS40LDEwMS4yIDczLjUsMTI4LjcgNzMuMSwxMTUgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3QyIiBwb2ludHM9IjEzMS43LDExNSAxMzEuMiwxMjguNyAxNDUuNCwxMDEuMiAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iOTMuMiwxMDIuNyA5MCwxMTkuOSA5NCwxNDAuMyA5NC45LDExMy41IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSIxMTEuNiwxMDIuNyAxMDkuOSwxMTMuNCAxMTAuNywxNDAuMyAxMTQuNywxMTkuOSAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTE0LjcsMTE5LjkgMTEwLjcsMTQwLjMgMTEzLjYsMTQyLjMgMTMxLjIsMTI4LjcgMTMxLjcsMTE1IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI3My4xLDExNSA3My41LDEyOC43IDkxLjIsMTQyLjMgOTQsMTQwLjMgOTAsMTE5LjkgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3Q2IiBwb2ludHM9IjExNS4xLDE2MS4xIDExNS4zLDE1NS41IDExMy43LDE1NC4yIDkxLDE1NC4yIDg5LjYsMTU1LjUgODkuNywxNjEuMSA3MC43LDE1Mi4xIDc3LjMsMTU3LjUgCgkJCTkwLjgsMTY2LjggMTEzLjksMTY2LjggMTI3LjQsMTU3LjUgMTM0LDE1Mi4xIAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0NCIgcG9pbnRzPSIxMTMuNiwxNDIuMyAxMTAuNywxNDAuMyA5NCwxNDAuMyA5MS4yLDE0Mi4zIDg5LjYsMTU1LjUgOTEsMTU0LjIgMTEzLjcsMTU0LjIgMTE1LjMsMTU1LjUgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3Q3IiBwb2ludHM9IjE3NC4xLDcyLjYgMTc5LjEsNDguMiAxNzEuNSwyNS42IDExMy42LDY4LjIgMTM1LjksODYuOSAxNjcuNCw5Ni4xIDE3NC4zLDg4IDE3MS4zLDg1LjggMTc2LjEsODEuNSAKCQkJMTcyLjQsNzguNiAxNzcuMiw3NSAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDciIHBvaW50cz0iMjUuNiw0OC4yIDMwLjcsNzIuNiAyNy41LDc1IDMyLjMsNzguNyAyOC42LDgxLjUgMzMuNCw4NS44IDMwLjQsODggMzcuNCw5Ni4xIDY4LjksODYuOSA5MS4yLDY4LjIgCgkJCTMzLjIsMjUuNiAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTY3LjQsOTYuMSAxMzUuOSw4Ni45IDE0NS40LDEwMS4yIDEzMS4yLDEyOC43IDE1MCwxMjguNCAxNzgsMTI4LjQgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjY4LjksODYuOSAzNy40LDk2LjEgMjYuOSwxMjguNCA1NC44LDEyOC40IDczLjUsMTI4LjcgNTkuNCwxMDEuMiAJCSIvPgoJCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTExLjYsMTAyLjcgMTEzLjYsNjguMiAxMjIuNyw0My43IDgyLDQzLjcgOTEuMiw2OC4yIDkzLjIsMTAyLjcgOTQsMTEzLjUgOTQsMTQwLjMgMTEwLjcsMTQwLjMgCgkJCTExMC44LDExMy41IAkJIi8+Cgk8L2c+CjwvZz4KPC9zdmc+',
        homepage: '',
        download: '',
    })

    login(context: LoginContext): Cancelable<WalletPluginLoginResponse> {
        const promise = this.metamaskLogin(context)
        return cancelable(promise, (canceled) => {
            throw canceled
        })
    }

    async getPermissionLevel(context: LoginContext, chain: Checksum256): Promise<PermissionLevel> {
        if (context.permissionLevel) {
            return context.permissionLevel
        }

        const publicKey = await this.retrievePublicKey(chain)

        const response = await fetch(`https://eosio.greymass.com/lookup/${publicKey}`)
        const accounts = await response.json()

        console.log({accounts})

        if (!context.ui) {
            throw new Error('UI not found')
        }

        return new Promise((resolve) => {
            function createAccount() {
                console.log('Create Account')
                console.log({
                    supportedChains: context.chains.map((chain) => chain.id),
                    creationServiceUrl: `https://adding-login-through-apple.account-creation-portal.pages.dev/buy?owner_key=${publicKey}&active_key=${publicKey}`,
                    scope: context.appName || 'Antelope App',
                })
                const accountCreator = new AccountCreator({
                    supportedChains: context.chains.map((chain) => chain.id),
                    creationServiceUrl: `https://adding-login-through-apple.account-creation-portal.pages.dev/buy?owner_key=${publicKey}&active_key=${publicKey}`,
                    scope: context.appName || 'Antelope App',
                })
                accountCreator.createAccount().then((accountCreationResponse) => {
                    console.log({accountCreationResponse})
                    if ('sa' in accountCreationResponse) {
                        resolve(
                            PermissionLevel.from({
                                actor: accountCreationResponse.sa,
                                permission: accountCreationResponse.sp,
                            })
                        )
                    } else {
                        throw new Error(accountCreationResponse.error || 'Account creation failed')
                    }
                })
            }
            context.ui.prompt({
                title: accounts.length ? 'Select an account' : 'No accounts found',
                body: '',
                elements: [
                    ...accounts.map((accountFound: AccountFound) => ({
                        type: 'button',
                        label: `${accountFound.actor}@${accountFound.permission}`,
                        data: {
                            label: `${accountFound.actor}@${accountFound.permission}`,
                            onclick: () => {
                                resolve(
                                    PermissionLevel.from({
                                        actor: accountFound.actor,
                                        permission: accountFound.permission,
                                    })
                                )
                            },
                        },
                    })),
                    {
                        type: 'button',
                        label: 'Create Account',
                        data: {
                            label: 'Create Account',
                            onClick: createAccount,
                        },
                    },
                ],
            })
        })
    }

    async metamaskLogin(context: LoginContext): Promise<WalletPluginLoginResponse> {
        await this.initialize()
        if (!this.provider) {
            throw new Error('Metamask not found')
        }

        let chain: Checksum256
        if (context.chain) {
            chain = context.chain.id
        } else {
            chain = context.chains[0].id
        }

        const permissionLevel = await this.getPermissionLevel(context, chain)

        return {
            chain,
            permissionLevel,
        }
    }

    sign(resolved: ResolvedSigningRequest): Cancelable<WalletPluginSignResponse> {
        const promise = this.metamaskSign(resolved)
        return cancelable(promise, (canceled) => {
            throw canceled
        })
    }

    async metamaskSign(resolved: ResolvedSigningRequest): Promise<WalletPluginSignResponse> {
        await this.initialize()
        const result = (await this.invokeSnap({
            method: 'antelope_signTransaction',
            params: {
                chainId: String(resolved.chainId),
                transaction: JSON.stringify(resolved.transaction),
            },
        })) as string
        if (!result) {
            throw new Error('No result returned')
        }
        return {
            signatures: [Signature.from(result)],
        }
    }

    async retrievePublicKey(chainId: Checksum256Type): Promise<PublicKey> {
        await this.initialize()
        if (!this.provider) {
            throw new Error('Metamask not found')
        }
        const result = (await this.invokeSnap({
            method: 'antelope_getPublicKey',
            params: {chainId: String(chainId)},
        })) as string
        return PublicKey.from(result)
    }

    public installedSnap: Snap | null = null
    public provider: MetaMaskInpageProvider | null = null
    public isFlask = false

    async request({method, params}) {
        if (!this.provider) {
            throw new Error('Snap provider not found')
        }
        const data =
            (await this.provider.request({
                method,
                params,
            } as RequestArguments)) ?? null
        return data
    }

    async initialize() {
        if (!this.provider) {
            this.provider = await getSnapsProvider()
        }
        if (this.provider && !this.installedSnap) {
            this.isFlask = await checkIsFlask(this.provider)
            await this.setSnap()
            if (!this.installedSnap) {
                await this.requestSnap()
                if (this.installedSnap) {
                    await this.initialize()
                }
            }
        }
    }

    async setSnap() {
        const snaps = (await this.request({
            method: 'wallet_getSnaps',
            params: {},
        })) as GetSnapsResponse
        this.installedSnap = snaps[defaultSnapOrigin] ?? null
    }

    async requestSnap(id?: string, version?: string) {
        const snapId = id || defaultSnapOrigin
        const snaps = (await this.request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: version ? {version} : {},
            },
        })) as Record<string, Snap>
        this.installedSnap = snaps?.[snapId] ?? null
    }

    async invokeSnap({method, params}: InvokeSnapParams, id?: string) {
        const snapId = id || defaultSnapOrigin
        return this.request({
            method: 'wallet_invokeSnap',
            params: {snapId, request: {method, params}},
        })
    }
}
