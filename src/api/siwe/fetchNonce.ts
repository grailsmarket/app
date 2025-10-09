import { Address } from 'viem'

export const fetchNonce = async (address: Address) => {
  const nonceRes = await fetch(`/api/auth/nonce?address=${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await nonceRes.json()
  return data.data?.nonce || data.nonce
}
