import { Play } from 'lucide-react'
import { GenerativeRangoli } from './GenerativeRangoli'

/**
 * Bunny Stream player when both the video id and BUNNY_LIBRARY_ID exist; otherwise a drawn "Video coming soon" card.
 * ponytail: plain Bunny iframe (free previews need no signed link); the paid lesson player adds signed URLs in part 2.
 */
export function CourseVideo({ videoId, title, soon, soonNote, seed }: { videoId?: string | null; title: string; soon: string; soonNote: string; seed: string }) {
  const library = process.env.BUNNY_LIBRARY_ID
  if (videoId && library) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-ui bg-charcoal shadow-frame">
        <iframe
          src={`https://iframe.mediadelivery.net/embed/${encodeURIComponent(library)}/${encodeURIComponent(videoId)}?preload=false`}
          title={title}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    )
  }
  return (
    <div role="img" aria-label={`${title}: ${soon}`} className="relative grid aspect-video place-items-center overflow-hidden rounded-ui bg-charcoal grain-dark text-center text-paper shadow-frame">
      <GenerativeRangoli seed={seed} tone="dark" className="absolute top-1/2 left-1/2 w-[70%] max-w-sm -translate-1/2 opacity-25" />
      <div className="relative grid justify-items-center gap-2 p-4">
        <span className="grid size-16 place-items-center rounded-full border-2 border-paper">
          <Play aria-hidden="true" className="size-8" />
        </span>
        <p className="font-heading text-h3">{soon}</p>
        <p className="text-paper/85">{soonNote}</p>
      </div>
    </div>
  )
}
