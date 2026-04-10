export const GrailsSubscriptionAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'tierId', type: 'uint256' },
      { internalType: 'uint256', name: 'durationDays', type: 'uint256' },
    ],
    name: 'getPrice',
    outputs: [{ internalType: 'uint256', name: 'cost', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'subscriber', type: 'address' }],
    name: 'getSubscription',
    outputs: [
      { internalType: 'uint256', name: 'tierId', type: 'uint256' },
      { internalType: 'uint256', name: 'expiry', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'subscriber', type: 'address' },
      { internalType: 'uint256', name: 'newTierId', type: 'uint256' },
    ],
    name: 'previewUpgrade',
    outputs: [
      { internalType: 'uint256', name: 'newExpiry', type: 'uint256' },
      { internalType: 'uint256', name: 'convertedSeconds', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tierId', type: 'uint256' },
      { internalType: 'uint256', name: 'durationDays', type: 'uint256' },
    ],
    name: 'subscribe',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newTierId', type: 'uint256' },
      { internalType: 'uint256', name: 'extraDays', type: 'uint256' },
    ],
    name: 'upgrade',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
]
