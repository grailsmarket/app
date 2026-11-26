import { tsParticles } from '@tsparticles/engine'
import { loadBasic } from '@tsparticles/basic'

export type SnowProfile = 'light' | 'standard'

const profiles = {
  light: { flakes: 60, fps: 36 },
  standard: { flakes: 100, fps: 45 },
}

export const startSnowfall = async (element: HTMLDivElement, profile: SnowProfile) => {
  if (!tsParticles.pluginManager.initialized) {
    await tsParticles.pluginManager.register(loadBasic)
  }

  const { flakes, fps } = profiles[profile]

  return tsParticles.load({
    element,
    options: {
      fullScreen: false,
      detectRetina: false,
      hdr: false,
      fpsLimit: fps,
      pauseOnBlur: true,
      particles: {
        number: { value: flakes },
        shape: { type: 'circle' },
        paint: { fill: { color: { value: '#edf6ff' } } },
        opacity: { value: { min: 0.25, max: 0.65 } },
        size: { value: { min: 1, max: 2.4 } },
        move: { enable: true, direction: 'bottom', angle: 22, speed: { min: 0.55, max: 1.3 } },
      },
      // add interactivity & repulse plugins to enable interactivity
      // interactivity: {
      //   detectsOn: 'window',
      //   events: { onHover: { enable: window.matchMedia('(any-hover: hover)').matches, mode: 'repulse' } },
      //   modes: { repulse: { distance: 100, factor: 40, speed: 0.8 } },
      // },
    },
  })
}

const allowedPaths = ['/', '/name', '/settings']

export const snowThemeProfile = (pathname: string) => {
  // const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const smallScreen = window.innerWidth < 768
  const validThemePath = allowedPaths.find((path) => {
    if (path === '/name') {
      return pathname.includes('.eth')
    }

    return path.includes(pathname)
  })
  const isDecember = new Date().getMonth() === 11

  if (!validThemePath || !isDecember) return null
  return smallScreen ? 'light' : 'standard'
}
