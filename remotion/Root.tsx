import { Composition } from 'remotion'
import { DevToolsTeaser } from './DevToolsTeaser'
import { TailwindTokensTeaser } from './TailwindTokensTeaser'
import { IntuitivTeaser } from './IntuitivTeaser'
import { ScreenshotsTeaser } from './ScreenshotsTeaser'
import { TokensInfrastrukturTeaser } from './TokensInfrastrukturTeaser'

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
      <Composition
        id="screenshots-teaser"
        component={ScreenshotsTeaser}
        durationInFrames={465}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="tokens-infrastruktur-teaser"
        component={TokensInfrastrukturTeaser}
        durationInFrames={600}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  )
}
