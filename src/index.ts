import {
    AbstractWalletPlugin,
    Checksum256,
    LoginContext,
    PermissionLevel,
    ResolvedSigningRequest,
    Signature,
    TransactContext,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'

export class WalletPluginTEMPLATE extends AbstractWalletPlugin implements WalletPlugin {
    /**
     * The logic configuration for the wallet plugin.
     */
    readonly config: WalletPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: true,

        // Should the user interface display a permission selector?
        requiresPermissionSelect: false,

        // Optionally specify if this plugin only works with specific blockchains.
        // supportedChains: ['73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d']
    }
    /**
     * The metadata for the wallet plugin to be displayed in the user interface.
     */
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'Wallet Plugin Template',
        description: 'A template that can be used to build wallet plugins!',
        logo: 'base_64_encoded_image',
        homepage: 'https://someplace.com',
        download: 'https://someplace.com/download',
    })
    /**
     * A unique string identifier for this wallet plugin.
     *
     * It's recommended this is all lower case, no spaces, and only URL-friendly special characters (dashes, underscores, etc)
     */
    get id(): string {
        return 'wallet-plugin-template'
    }
    /**
     * Performs the wallet logic required to login and return the chain and permission level to use.
     *
     * @param options WalletPluginLoginOptions
     * @returns Promise<WalletPluginLoginResponse>
     */
    // TODO: Remove these eslint rule modifiers when you are implementing this method.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    async login(context: LoginContext): Promise<WalletPluginLoginResponse> {
        // Example response...
        return {
            chain: Checksum256.from(
                '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d'
            ),
            permissionLevel: PermissionLevel.from('wharfkit1111@test'),
        }
    }
    /**
     * Performs the wallet logic required to sign a transaction and return the signature.
     *
     * @param chain ChainDefinition
     * @param resolved ResolvedSigningRequest
     * @returns Promise<Signature>
     */
    // TODO: Remove these eslint rule modifiers when you are implementing this method.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    async sign(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {
        // Example response...
        return {
            signatures: [
                Signature.from(
                    'SIG_K1_KfqBXGdSRnVgZbAXyL9hEYbAvrZjcaxUCenD7Z3aX6yzf6MEyc4Cy3ywToD4j3SKkzSg7L1uvRUirEPHwAwrbg5c9z27Z3'
                ),
            ],
        }
    }
}
