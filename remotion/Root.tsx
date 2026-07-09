import { Composition } from 'remotion'
import { DevToolsTeaser } from './DevToolsTeaser'
import { TailwindTokensTeaser } from './TailwindTokensTeaser'
import { IntuitivTeaser } from './IntuitivTeaser'

const FPS = 30

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="devtools-teaser"
        component={DevToolsTeaser}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="tailwind-tokens-teaser"
        component={TailwindTokensTeaser}
        durationInFrames={480}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="intuitiv-teaser"
        component={IntuitivTeaser}
        durationInFrames={450}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  )
}
