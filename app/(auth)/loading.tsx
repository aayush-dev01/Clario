import { PageLoader } from '@/components/ui/PageLoader'

export default function AuthLoading() {
  return (
    <PageLoader
      tone="light"
      title="Preparing authentication..."
      detail="We are loading the secure sign-in experience."
    />
  )
}
