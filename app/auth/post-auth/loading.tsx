import { PageLoader } from '@/components/ui/PageLoader'

export default function PostAuthLoading() {
  return (
    <PageLoader
      tone="light"
      title="Finishing your sign-in..."
      detail="We are syncing your account and choosing the right next step."
    />
  )
}
