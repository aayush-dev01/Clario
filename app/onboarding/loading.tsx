import { PageLoader } from '@/components/ui/PageLoader'

export default function OnboardingLoading() {
  return (
    <PageLoader
      tone="light"
      title="Preparing onboarding..."
      detail="We are getting your setup flow ready."
    />
  )
}
