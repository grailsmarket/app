export const STANDARD_RENT_PRICE_ORACLE_ABI = [
  {
    inputs: [],
    name: 'getBaseRates',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDiscountPoints',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'duration', type: 'uint64' },
          { name: 'numer', type: 'uint128' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DISCOUNT_DENOMINATOR',
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'paymentToken', type: 'address' }],
    name: 'getPaymentTokenRatio',
    outputs: [
      { name: 'numer', type: 'uint128' },
      { name: 'denom', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
