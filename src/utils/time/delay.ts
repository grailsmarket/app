export const delay = async (time: number) => {
  await new Promise((res) => setTimeout(res, time))
}
