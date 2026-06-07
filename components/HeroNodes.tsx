'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  colorType: 'cyan' | 'purple' | 'pink'
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgb')) return hex
  
  let cleanHex = hex.replace('#', '').trim()
  
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('')
  }
  
  if (cleanHex.length === 6) {
    const num = parseInt(cleanHex, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  return hex
}

export default function HeroNodes() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })
  const themeRef = useRef<{
    cyan: string
    purple: string
    pink: string
    isDark: boolean
  } | null>(null)
  const requestRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    // Setup initial theme colors mapping from CSS custom properties
    const updateThemeColors = () => {
      if (typeof window === 'undefined') return
      const style = getComputedStyle(document.documentElement)
      themeRef.current = {
        cyan: style.getPropertyValue('--cyan').trim() || '#2563eb',
        purple: style.getPropertyValue('--purple').trim() || '#7c3aed',
        pink: style.getPropertyValue('--pink').trim() || '#db2777',
        isDark: document.documentElement.getAttribute('data-theme') === 'dark',
      }
    }

    updateThemeColors()

    // Observe theme changes on HTML tag to update node/line colors dynamically
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          updateThemeColors()
        }
      }
    })
    mutationObserver.observe(document.documentElement, { attributes: true })

    // Track mouse coordinates relative to the hero section
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }

    parent.addEventListener('mousemove', handleMouseMove)
    parent.addEventListener('mouseleave', handleMouseLeave)

    let isIntersecting = true

    // Pause canvas drawing loops when hero is scrolled out of viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isIntersecting = entry.isIntersecting
          if (isIntersecting) {
            if (requestRef.current === null) {
              requestRef.current = requestAnimationFrame(loop)
            }
          } else {
            if (requestRef.current !== null) {
              cancelAnimationFrame(requestRef.current)
              requestRef.current = null
            }
          }
        }
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(parent)

    // Handle canvas dimensions responsive sizing with High-DPI support
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const entry = entries[0]
      const { width, height } = entry.contentRect

      const dpr = window.devicePixelRatio || 1
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.width = width * dpr
      canvas.height = height * dpr

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      // Responsive nodes density setup (fewer on mobile)
      const nodesCount = width < 768 ? 16 : 30
      const currentNodes = nodesRef.current

      if (currentNodes.length === 0) {
        const newNodes: Node[] = []
        const colorTypes: ('cyan' | 'purple' | 'pink')[] = ['cyan', 'purple', 'pink']
        for (let i = 0; i < nodesCount; i++) {
          const vx = (Math.random() - 0.5) * 0.35
          const vy = (Math.random() - 0.5) * 0.35
          newNodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.abs(vx) < 0.05 ? (vx < 0 ? -0.08 : 0.08) : vx,
            vy: Math.abs(vy) < 0.05 ? (vy < 0 ? -0.08 : 0.08) : vy,
            r: Math.random() * 1.5 + 1.2,
            colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
          })
        }
        nodesRef.current = newNodes
      } else {
        if (currentNodes.length !== nodesCount) {
          if (currentNodes.length < nodesCount) {
            const colorTypes: ('cyan' | 'purple' | 'pink')[] = ['cyan', 'purple', 'pink']
            for (let i = currentNodes.length; i < nodesCount; i++) {
              const vx = (Math.random() - 0.5) * 0.35
              const vy = (Math.random() - 0.5) * 0.35
              currentNodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.abs(vx) < 0.05 ? (vx < 0 ? -0.08 : 0.08) : vx,
                vy: Math.abs(vy) < 0.05 ? (vy < 0 ? -0.08 : 0.08) : vy,
                r: Math.random() * 1.5 + 1.2,
                colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
              })
            }
          } else {
            currentNodes.splice(nodesCount)
          }
        }
        // Clamp existing node positions within updated dimensions
        for (const node of currentNodes) {
          if (node.x > width) node.x = Math.random() * width
          if (node.y > height) node.y = Math.random() * height
        }
      }
    })
    resizeObserver.observe(parent)

    // Primary simulation and render loop
    const loop = () => {
      if (!isIntersecting) return

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        requestRef.current = requestAnimationFrame(loop)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      const theme = themeRef.current
      if (!theme) {
        requestRef.current = requestAnimationFrame(loop)
        return
      }

      const nodes = nodesRef.current
      const mouse = mouseRef.current

      // 1. Update positions
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        // Keep inside canvas bounds with soft bounces
        if (node.x < 0) {
          node.x = 0
          node.vx = Math.abs(node.vx)
        } else if (node.x > width) {
          node.x = width;
          node.vx = -Math.abs(node.vx)
        }

        if (node.y < 0) {
          node.y = 0;
          node.vy = Math.abs(node.vy)
        } else if (node.y > height) {
          node.y = height;
          node.vy = -Math.abs(node.vy)
        }

        // Subtly repel nodes away from mouse if cursor is active and nearby
        if (mouse.x !== null && mouse.y !== null) {
          const dx = node.x - mouse.x
          const dy = node.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const force = (140 - dist) / 140
            const angle = Math.atan2(dy, dx)
            // Gently shift position
            node.x += Math.cos(angle) * force * 0.5
            node.y += Math.sin(angle) * force * 0.5
          }
        }
      }

      // 2. Draw connections between nearby nodes
      ctx.lineWidth = 0.8
      const maxLineDist = 110
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j]
          const dx = nodeA.x - nodeB.x
          const dy = nodeA.y - nodeB.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxLineDist) {
            const opacity = (1 - dist / maxLineDist) * (theme.isDark ? 0.12 : 0.05)
            ctx.beginPath()
            ctx.moveTo(nodeA.x, nodeA.y)
            ctx.lineTo(nodeB.x, nodeB.y)

            const colorA = theme[nodeA.colorType]
            const colorB = theme[nodeB.colorType]
            const grad = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y)
            grad.addColorStop(0, hexToRgba(colorA, opacity))
            grad.addColorStop(1, hexToRgba(colorB, opacity))

            ctx.strokeStyle = grad
            ctx.stroke()
          }
        }
      }

      // 3. Draw connection lines to user cursor
      if (mouse.x !== null && mouse.y !== null) {
        const maxMouseDist = 140
        for (const node of nodes) {
          const dx = node.x - mouse.x
          const dy = node.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxMouseDist) {
            const opacity = (1 - dist / maxMouseDist) * (theme.isDark ? 0.16 : 0.06)
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(mouse.x, mouse.y)

            const nodeColor = theme[node.colorType]
            ctx.strokeStyle = hexToRgba(nodeColor, opacity)
            ctx.stroke()
          }
        }
      }

      // 4. Draw individual nodes with double-layer glowing circles
      for (const node of nodes) {
        const color = theme[node.colorType]

        // Outer ambient halo glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r * 2.8, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(color, theme.isDark ? 0.14 : 0.06)
        ctx.fill()

        // Inner solid core
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }

      requestRef.current = requestAnimationFrame(loop)
    }

    requestRef.current = requestAnimationFrame(loop)

    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      parent.removeEventListener('mousemove', handleMouseMove)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [mounted])

  if (!mounted) return null

  return <canvas ref={canvasRef} className="hero-canvas" />
}
