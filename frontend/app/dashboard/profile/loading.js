import { LoadingAnimation } from "@/components/ui/loading-animation"

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <LoadingAnimation />
    </div>
  )
}
