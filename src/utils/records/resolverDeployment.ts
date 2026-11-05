// Keep the registration default (version 0) separate from additional resolver instances.
export const newResolverVersion = () => {
  const words = crypto.getRandomValues(new Uint32Array(2))
  return (words[0] & 0x1fffff) * 0x100000000 + words[1] || 1
}
