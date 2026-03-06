"use client"

import { cn } from "@/lib/utils"

interface FlipCardProps {
  imageSrc: string
  imageAlt: string
  title: string
  description?: string
  className?: string
}

export function FlipCard({ imageSrc, imageAlt, title, description, className }: FlipCardProps) {
  return (
    <div className={cn("group h-80 w-64 [perspective:1000px]", className)}>
      <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front face */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="h-full w-full border border-border bg-card p-2 shadow-lg">
            <img src={imageSrc || "/placeholder.svg"} alt={imageAlt} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Back face */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full w-full flex-col items-center justify-center border border-border bg-secondary p-6 text-center shadow-lg">
            <h3 className="mb-3 text-lg font-semibold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
