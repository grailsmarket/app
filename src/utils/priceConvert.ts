import { parseEther } from 'viem'

export const ethNumberToWei = (value: number | null) => {
  if (value === null) return undefined

  try {
    return parseEther(String(value)).toString()
  } catch {
    return undefined
  }
}
