import { useOutletContext } from 'react-router-dom'
import type { StandaloneAppContext } from '../layout/StandaloneAppLayout'
import AppLanding from './AppLanding'

export default function StandaloneHome() {
  const appCtx = useOutletContext<StandaloneAppContext>()

  // AppLanding reads from useParams().id — we override by rendering with key
  // and using a wrapper that provides the creator ID
  return <AppLanding standaloneCreatorId={appCtx.creatorId} />
}
