export const ENS_HOLIDAY_RENEWAL_ABI = [
  {
    inputs: [
      { internalType: 'contract ENS', name: 'ens', type: 'address' },
      {
        internalType: 'contract IWrappedEthRegistrarController',
        name: '_wrappedEthRegistrarController',
        type: 'address',
      },
      { internalType: 'contract IRegistrarRenewalWithReferral', name: '_bulkRenewalWithReferral', type: 'address' },
      { internalType: 'bytes32', name: '_referrer', type: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'string[]', name: 'labels', type: 'string[]' },
      { internalType: 'uint256[]', name: 'durations', type: 'uint256[]' },
    ],
    name: 'bulkRenew',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string[]', name: 'labels', type: 'string[]' },
      { internalType: 'uint256[]', name: 'durations', type: 'uint256[]' },
    ],
    name: 'bulkRentPrice',
    outputs: [{ internalType: 'uint256', name: 'total', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
]
