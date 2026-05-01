import { PageLoader } from '@/components/ui/PageLoader'

export default function TeacherLoading() {
  return (
    <PageLoader
      tone="light"
      title="Loading your teaching space..."
      detail="We are preparing your teacher tools and schedule."
    />
  )
}
