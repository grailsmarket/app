import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { fetchCategories } from '@/api/domains/fetchCategories'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

export const CATEGORY_IMAGES = {
  prepunks: {
    avatar: 'https://grails.app/clubs/prepunks/avatar.jpg',
    header: 'https://grails.app/clubs/prepunks/header.jpeg',
  },
  '10k': {
    avatar: 'https://grails.app/clubs/10k/avatar.jpg',
    header: 'https://grails.app/clubs/10k/header.jpeg',
  },
  pokemon: {
    avatar: 'https://grails.app/clubs/pokemon/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon/header.jpeg',
  },
  '1kforenames': {
    avatar: 'https://grails.app/clubs/1kforenames/avatar.jpg',
    header: 'https://grails.app/clubs/1kforenames/header.png',
  },
  '1ksurnames': {
    avatar: 'https://grails.app/clubs/1ksurnames/avatar.jpg',
    header: 'https://grails.app/clubs/1ksurnames/header.png',
  },
  '999': {
    avatar: 'https://grails.app/clubs/999/avatar.jpg',
    header: 'https://grails.app/clubs/999/header.jpeg',
  },
}

export async function GET(req: NextRequest) {
  const category = req.url.split('category=')[1] || ''

  const getResponse = async () => {
    try {
      const response = await fetchCategories()
      const categoryData = response.find((c) => c.name === category)
      return categoryData
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const categoryData = await getResponse()

  const categoryImage = CATEGORY_IMAGES[categoryData?.name as keyof typeof CATEGORY_IMAGES]
  const categoryName = CATEGORY_LABELS[categoryData?.name as keyof typeof CATEGORY_LABELS]
  const categoryDescription = categoryData?.description
  const categoryImageUrl = categoryImage.header
  const categoryAvatarUrl = categoryImage.avatar
  console.log(categoryImageUrl, categoryAvatarUrl)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          gap: 58,
          color: '#f4f4f4',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#222222',
          textAlign: 'center',
          fontWeight: 700,
          fontFamily: 'Inter',
        }}
      >
        <img
          alt='header'
          width='800'
          height='418'
          src={categoryImageUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 4,
            margin: 0,
            opacity: 0.2,
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div
          style={{
            display: 'flex',
            width: 'auto',
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'flex-start',
            borderRadius: 4,
            gap: 16,
            maxWidth: 700,
            margin: '0 auto',
            boxShadow: '2px 2px 7px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <img
            alt='avatar'
            width='120'
            height='120'
            src={categoryAvatarUrl}
            style={{
              borderRadius: 60,
              marginTop: 12,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <p
              style={{
                whiteSpace: 'nowrap',
                fontSize: 64,
                fontWeight: 700,
                margin: 0,
                padding: 0,
                textShadow: '1px 0 1px #ffffff',
                paddingBottom: 8,
              }}
            >
              {categoryName}
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 400,
                margin: 0,
                padding: 0,
                maxWidth: 540,
                textAlign: 'left',
                color: '#cccccc',
                textShadow: '1px 0 1px #cccccc',
              }}
            >
              {categoryDescription}
            </p>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <img alt='avatar' width='190' height='60' src='https://grails.app/your-ens-market-logo.png' />
        </div>
      </div>
    ),
    {
      width: 800,
      height: 418,
    }
  )
}
