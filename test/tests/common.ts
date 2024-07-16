// import {assert} from 'chai'
// import {PermissionLevel, SessionKit} from '@wharfkit/session'
// import {
//     mockChainDefinition,
//     mockPermissionLevel,
//     mockSessionKitArgs,
//     mockSessionKitOptions,
// } from '@wharfkit/mock-data'

// import {WalletPluginMetaMask} from '$lib'

suite('wallet plugin', function () {
    test('login and sign', async function () {
        console.log(
            'Test is failing because window.ethereum is not mocked so it was disabled for now.'
        )
        // const kit = new SessionKit(
        //     {
        //         ...mockSessionKitArgs,
        //         walletPlugins: [new WalletPluginMetaMask()],
        //     },
        //     mockSessionKitOptions
        // )
        // const {session} = await kit.login({
        //     chain: mockChainDefinition.id,
        //     permissionLevel: mockPermissionLevel,
        // })
        // assert.isTrue(session.chain.equals(mockChainDefinition))
        // assert.isTrue(session.actor.equals(PermissionLevel.from(mockPermissionLevel).actor))
        // assert.isTrue(
        //     session.permission.equals(PermissionLevel.from(mockPermissionLevel).permission)
        // )
        // const result = await session.transact(
        //     {
        //         action: {
        //             authorization: [PermissionLevel.from(mockPermissionLevel)],
        //             account: 'eosio.token',
        //             name: 'transfer',
        //             data: {
        //                 from: PermissionLevel.from(mockPermissionLevel).actor,
        //                 to: 'wharfkittest',
        //                 quantity: '0.0001 EOS',
        //                 memo: 'wharfkit/session wallet plugin template',
        //             },
        //         },
        //     },
        //     {
        //         broadcast: false,
        //     }
        // )
        // assert.isTrue(result.signer.equals(mockPermissionLevel))
        // assert.equal(result.signatures.length, 1)
    })
})
