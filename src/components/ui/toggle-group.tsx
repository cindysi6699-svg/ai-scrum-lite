"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "@/lib/utils"

type ToggleGroupContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null)

function ToggleGroup({
  className,
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof ToggleGroupPrimitive>, "value" | "onValueChange"> & {
  value?: string
  onValueChange?: (value: string) => void
}) {
  const currentValue = value ?? ""

  return (
    <ToggleGroupContext.Provider
      value={{
        value: currentValue,
        onValueChange: onValueChange ?? (() => {}),
      }}
    >
      <ToggleGroupPrimitive
        data-slot="toggle-group"
        className={cn("flex items-center gap-1.5", className)}
        value={currentValue ? [currentValue] : []}
        onValueChange={(nextValue) => {
          const selected = nextValue[0]

          if (selected) {
            onValueChange?.(selected)
          }
        }}
        {...props}
      />
    </ToggleGroupContext.Provider>
  )
}

function ToggleGroupItem({
  className,
  value,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & {
  value: string
}) {
  const context = React.useContext(ToggleGroupContext)
  const selected = context?.value === value

  return (
    <button
      data-slot="toggle-group-item"
      data-state={selected ? "on" : "off"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-[#e4e4e7] bg-white px-3 py-1.5 text-xs text-[#3f3f46] outline-none transition hover:bg-[#fafafa] data-[state=on]:border-[#4f7cff] data-[state=on]:bg-[#4f7cff] data-[state=on]:text-white",
        className
      )}
      type={type}
      onClick={(event) => {
        props.onClick?.(event)

        if (!event.defaultPrevented) {
          context?.onValueChange(value)
        }
      }}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
