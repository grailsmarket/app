export const SEAPORT_ADDRESS = process.env.NEXT_PUBLIC_SEAPORT_ADDRESS || '0x0000000000000068F116a894984e2DB1123eB395' // Seaport 1.6
export const ENS_PUBLIC_RESOLVER_ADDRESS = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63'
export const ENS_REGISTRAR_ADDRESS =
  process.env.NEXT_PUBLIC_ENS_REGISTRAR || '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85'
export const ENS_REGISTRAR_CONTROLLER_ADDRESS =
  process.env.NEXT_PUBLIC_ENS_REGISTRAR_CONTROLLER || '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5'
export const ENS_NAME_WRAPPER_ADDRESS = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401'
export const BULK_RENEWAL_CONTRACT_ADDRESS = '0xa12159e5131b1eEf6B4857EEE3e1954744b5033A'

// ENS Holiday constants
export const ENS_HOLIDAY_REGISTRAR_ADDRESS = '0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547'
export const ENS_HOLIDAY_RENEWAL_ADDRESS = '0xf55575Bde5953ee4272d5CE7cdD924c74d8fA81A'
export const ENS_HOLIDAY_REFERRER_ADDRESS = '0x0000000000000000000000007E491cde0fBf08e51f54C4Fb6b9e24aFBD18966D'

export const EXCHANGE_CONTRACT_ADDRESS = '0x00000000F9490004C11Cef243f5400493c00Ad63'
export const ENS_PRICING_ORACLE_CONTRACT_ADDRESS = '0x0B7CbeE19E219050e38B419273229fd24590555a'

export const CONDUIT_CONTROLLER_ADDRESS = '0x00000000F9490004C11Cef243f5400493c00Ad63'
// TODO: Replace with actual deployed conduit address
export const MARKETPLACE_CONDUIT_ADDRESS =
  process.env.NEXT_PUBLIC_CONDUIT_ADDRESS || '0x73E9cD721a79C208E2F944910c27196307a2a05D' // Placeholder
// TODO: Replace with actual conduit key
export const MARKETPLACE_CONDUIT_KEY =
  process.env.NEXT_PUBLIC_CONDUIT_KEY || '0xC9C3A4337a1bba75D0860A1A81f7B990dc607334000000000000000000000000' // Placeholder

// OpenSea's conduit for reference/fallback
export const OPENSEA_CONDUIT_ADDRESS = '0x1E0049783F008A0085193E00003D00cd54003c71'
export const OPENSEA_CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000'
export const OPENSEA_FEE_RECIPIENT = '0x0000a26b00c1F0DF003000390027140000fAa719'
export const OPENSEA_FEE_BASIS_POINTS = 100 // 1% = 100 basis points

export const USE_CONDUIT = process.env.NEXT_PUBLIC_USE_CONDUIT !== 'false'

// {
//   "protocol": "seaport1.6",
//   "fulfillment_data": {
//     "transaction": {
//       "function": "fulfillAdvancedOrder(((address,address,(uint8,address,uint256,uint256,uint256)[],(uint8,address,uint256,uint256,uint256,address)[],uint8,uint256,uint256,bytes32,uint256,bytes32,uint256),uint120,uint120,bytes,bytes),(uint256,uint8,uint256,uint256,bytes32[])[],bytes32,address)",
//       "chain": 1,
//       "to": "0x0000000000000068f116a894984e2db1123eb395",
//       "value": "0",
//       "input_data": {
//         "advancedOrder": {
//           "parameters": {
//             "offerer": "0xa8b4756959e1192042fc2a8a103dfe2bddf128e8",
//             "zone": "0x000056f7000000ece9003ca63978907a00ffd100",
//             "offer": [
//               {
//                 "itemType": 1,
//                 "token": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//                 "identifierOrCriteria": "0",
//                 "startAmount": "100000000000000",
//                 "endAmount": "100000000000000"
//               }
//             ],
//             "consideration": [
//               {
//                 "itemType": 3,
//                 "token": "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
//                 "identifierOrCriteria": "23717299301369011679932139162423838595345710045429743491727476556272700438180",
//                 "startAmount": "1",
//                 "endAmount": "1",
//                 "recipient": "0xa8b4756959e1192042fc2a8a103dfe2bddf128e8"
//               },
//               {
//                 "itemType": 1,
//                 "token": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//                 "identifierOrCriteria": "0",
//                 "startAmount": "1000000000000",
//                 "endAmount": "1000000000000",
//                 "recipient": "0x0000a26b00c1f0df003000390027140000faa719"
//               }
//             ],
//             "orderType": 2,
//             "startTime": "1763222198",
//             "endTime": "1765814198",
//             "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
//             "salt": "27855337018906766782546881864045825683096516384821792734242723889051217920088",
//             "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//             "totalOriginalConsiderationItems": "2"
//           },
//           "numerator": 1,
//           "denominator": 1,
//           "signature": "0x658de6f60b8e04eae4cb684f6e8db2c9772dc7aeddf5add83a55708466ef0c34df84531b6cd4abe525ce682d8821e94550802ace94cf72dc6ca918d6a83a0202",
//           "extraData": "0x005b0f3dbdd49614476e4f5ff5db6fe13d41fcb516000000006918af4fa20b607ab18329f419792eca704a6477c30911fee02999328a328b3664a29d10737e6dc640be345f1cde179e43b3d1d2a9ad0c4190dcfbec4b1b981f73469b8e00346f8404769c6a3b14a396eb253d88a0f21f697879ad5c2b58024fd25ea736a4"
//         },
//         "criteriaResolvers": [],
//         "fulfillerConduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//         "recipient": "0x5b0f3dbdd49614476e4f5ff5db6fe13d41fcb516"
//       }
//     },
//     "orders": [
//       {
//         "parameters": {
//           "offerer": "0xa8b4756959e1192042fc2a8a103dfe2bddf128e8",
//           "offer": [
//             {
//               "itemType": 1,
//               "token": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//               "identifierOrCriteria": "0",
//               "startAmount": "100000000000000",
//               "endAmount": "100000000000000"
//             }
//           ],
//           "consideration": [
//             {
//               "itemType": 3,
//               "token": "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
//               "identifierOrCriteria": "23717299301369011679932139162423838595345710045429743491727476556272700438180",
//               "startAmount": "1",
//               "endAmount": "1",
//               "recipient": "0xa8b4756959e1192042fc2a8a103dfe2bddf128e8"
//             },
//             {
//               "itemType": 1,
//               "token": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//               "identifierOrCriteria": "0",
//               "startAmount": "1000000000000",
//               "endAmount": "1000000000000",
//               "recipient": "0x0000a26b00c1f0df003000390027140000faa719"
//             }
//           ],
//           "startTime": "1763222198",
//           "endTime": "1765814198",
//           "orderType": 2,
//           "zone": "0x000056f7000000ece9003ca63978907a00ffd100",
//           "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
//           "salt": "0x3d958fe200000000000000000000000000000000000000007a95abf065eb8058",
//           "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//           "totalOriginalConsiderationItems": 2,
//           "counter": 0
//         },
//         "signature": "0x658de6f60b8e04eae4cb684f6e8db2c9772dc7aeddf5add83a55708466ef0c34df84531b6cd4abe525ce682d8821e94550802ace94cf72dc6ca918d6a83a0202"
//       }
//     ]
//   }
// }
