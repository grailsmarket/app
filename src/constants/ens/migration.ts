export const MIGRATION_DATA = [
  {
    type: 'tuple',
    components: [
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'subregistry', type: 'address' },
      { name: 'resolver', type: 'address' },
    ],
  },
] as const
