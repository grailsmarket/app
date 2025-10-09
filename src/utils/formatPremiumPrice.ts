export const formatRegisterPrice = (price: number) => {
  const million = Math.pow(10, 6)

  return price >= million
    ? `${Math.floor(price / million)}M`
    : price.toLocaleString(navigator.language, {
        maximumFractionDigits: price >= 1000 ? 0 : price >= 100 ? 1 : 2,
      })
}
