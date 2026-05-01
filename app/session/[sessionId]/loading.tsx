import { PageLoader } from '@/components/ui/PageLoader'

export default function SessionLoading() {
  return (
    <PageLoader
      tone="dark"
      title="Preparing your session..."
      detail="We are checking access and getting the live room ready."
    />
  )
}
