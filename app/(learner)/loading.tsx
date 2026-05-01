import { PageLoader } from '@/components/ui/PageLoader'

export default function LearnerLoading() {
  return (
    <PageLoader
      tone="light"
      title="Loading your workspace..."
      detail="Your learner dashboard is on the way."
    />
  )
}
