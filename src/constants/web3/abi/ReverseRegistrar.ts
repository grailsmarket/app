import { parseAbi } from 'viem'

// https://docs.ens.domains/registry/reverse/
export const REVERSE_REGISTRAR_ABI = parseAbi(['function setName(string name) returns (bytes32)'])
