import { CATEGORY_IMAGES } from '@/app/categories/[category]/components/categoryDetails'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { DEFAULT_FALLBACK_AVATAR, DEFAULT_FALLBACK_HEADER } from 'ethereum-identity-kit'

export const getCategoryDetails = (category: string) => {
  const categoryImage = CATEGORY_IMAGES[category as keyof typeof CATEGORY_IMAGES] || {
    avatar: DEFAULT_FALLBACK_AVATAR,
    header: DEFAULT_FALLBACK_HEADER,
  }

  const categoryName = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
  return {
    name: categoryName,
    avatar: categoryImage.avatar,
    header: categoryImage.header,
  }
}
