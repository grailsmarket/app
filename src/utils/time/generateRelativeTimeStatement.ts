const generateRelativeTimeStatement = (timestamp: number, short?: boolean) => {
  const difference = Date.now() / 1000 - timestamp

  for (let [maxDifference, timeFormat, scaleFactor] of [
    [60, 's', 1],
    [3600, short ? 'm' : ' min', 60],
    [86400, short ? 'h' : ' h', 3600],
    [2592000, short ? 'd' : ' day', 86400],
    [31104000, short ? 'mo' : ' month', 2592000],
    [Infinity, short ? 'y' : ' year', 31104000],
  ]) {
    if (difference < (maxDifference as number)) {
      const value = Math.floor(difference / (scaleFactor as number))

      return `${value}${timeFormat}${short ? '' : value > 1 && timeFormat !== 's' ? 's' : ''}${short ? '' : ' ago'}`
    }
  }
}

export default generateRelativeTimeStatement
