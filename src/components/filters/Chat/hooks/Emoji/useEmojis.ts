import { fetchEmojis } from 'emojibase'
import { useQuery } from '@tanstack/react-query'
import { navItems } from '@/app/marketplace/hooks/usePanelControls'

const getEmojis = async () => {
  const data = await fetchEmojis('en', { compact: true })
  return data.filter((el) => el.group !== undefined && el.group !== 2)
}

export const useEmojis = (selectedNavItem: (typeof navItems)[0]) => {
  const { data: emojiList } = useQuery({
    queryKey: ['getEmojis'],
    queryFn: getEmojis,
    enabled: selectedNavItem.value === 'chat',
    staleTime: Infinity,
  })

  return { emojiList }
}
