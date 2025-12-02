export const ENS_HOLIDAY_RENEWAL_ABI = [
  {
    inputs: [
      { internalType: 'contract ENS', name: 'ens', type: 'address' },
      {
        internalType: 'contract IWrappedEthRegistrarController',
        name: '_wrappedEthRegistrarController',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'label', type: 'string' },
      { indexed: true, internalType: 'bytes32', name: 'labelHash', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'cost', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'duration', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'referrer', type: 'bytes32' },
    ],
    name: 'RenewalReferred',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'string[]', name: 'labels', type: 'string[]' },
      { internalType: 'uint256[]', name: 'durations', type: 'uint256[]' },
      { internalType: 'bytes32', name: 'referrer', type: 'bytes32' },
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
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'bytes32', name: 'referrer', type: 'bytes32' },
    ],
    name: 'renew',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
]
