import { Composition } from 'remotion'
import { DevToolsTeaser } from './DevToolsTeaser'

const FPS = 30
const DURATION_IN_SECONDS = 12

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="devtools-teaser"
      component={DevToolsTeaser}
      durationInFrames={FPS * DURATION_IN_SECONDS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  )
}
