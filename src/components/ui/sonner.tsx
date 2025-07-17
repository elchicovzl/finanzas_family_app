"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          opacity: '1',
        },
        className: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        descriptionClassName: 'group-[.toast]:text-muted-foreground group-[.toast]:opacity-90',
      }}
      style={{
        '--normal-bg': 'hsl(var(--background))',
        '--normal-text': 'hsl(var(--foreground))',
        '--normal-border': 'hsl(var(--border))',
        '--success-bg': 'hsl(var(--background))',
        '--success-text': 'hsl(var(--foreground))',
        '--success-border': 'hsl(var(--border))',
        '--error-bg': 'hsl(var(--background))',
        '--error-text': 'hsl(var(--foreground))',
        '--error-border': 'hsl(var(--border))',
        '--info-bg': 'hsl(var(--background))',
        '--info-text': 'hsl(var(--foreground))',
        '--info-border': 'hsl(var(--border))',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
