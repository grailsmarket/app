import { API_URL } from '@/constants/api'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

export const getCategoryDetails = (category: string) => {
  const categoryImage = {
    avatar: `${API_URL}/clubs/${category}/avatar`,
    header: `${API_URL}/clubs/${category}/header`,
  }

  const categoryName = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
  return {
    name: categoryName,
    avatar: categoryImage.avatar,
    header: categoryImage.header,
  }
}
