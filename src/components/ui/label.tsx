"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-xs font-medium text-[#3f3f46]", className)}
      {...props}
    />
  )
}

export { Label }
