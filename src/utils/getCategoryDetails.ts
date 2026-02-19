import { API_URL } from '@/constants/api'

export const getCategoryDetails = (category: string) => {
  const categoryImage = {
    avatar: `${API_URL}/clubs/${category}/avatar`,
    header: `${API_URL}/clubs/${category}/header`,
  }

  return {
    avatar: categoryImage.avatar,
    header: categoryImage.header,
  }
}
