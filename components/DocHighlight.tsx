'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DocHighlight() {
  const searchParams = useSearchParams()
  const highlight = searchParams.get('highlight')

  useEffect(() => {
    if (!highlight || !highlight.trim()) return

    const query = highlight.trim().toLowerCase()
    const article = document.querySelector('article.mdx')
    if (!article) return

    // TreeWalker to traverse text nodes safely
    const walker = document.createTreeWalker(
      article,
      NodeFilter.SHOW_TEXT,
      null
    )

    const nodesToReplace: { node: Text; parent: Node; newNodes: Node[] }[] = []
    let currentNode = walker.nextNode()

    while (currentNode) {
      const textNode = currentNode as Text
      const text = textNode.nodeValue || ''
      const lowerText = text.toLowerCase()
      
      if (lowerText.includes(query)) {
        const parent = textNode.parentNode
        if (parent && parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE' && parent.nodeName !== 'MARK') {
          const newNodes: Node[] = []
          let lastIndex = 0
          let index = lowerText.indexOf(query)

          while (index !== -1) {
            // Text before highlight
            if (index > lastIndex) {
              newNodes.push(document.createTextNode(text.slice(lastIndex, index)))
            }

            // Highlight node (<mark class="doc-highlight">)
            const matchText = text.slice(index, index + query.length)
            const mark = document.createElement('mark')
            mark.className = 'doc-highlight'
            mark.textContent = matchText
            newNodes.push(mark)

            lastIndex = index + query.length
            index = lowerText.indexOf(query, lastIndex)
          }

          if (lastIndex < text.length) {
            newNodes.push(document.createTextNode(text.slice(lastIndex)))
          }

          nodesToReplace.push({
            node: textNode,
            parent,
            newNodes
          })
        }
      }
      currentNode = walker.nextNode()
    }

    // Apply replacements
    nodesToReplace.forEach(({ node, parent, newNodes }) => {
      newNodes.forEach(newNode => {
        parent.insertBefore(newNode, node)
      })
      parent.removeChild(node)
    })

    // Scroll to the first highlighted element
    setTimeout(() => {
      const firstHighlight = article.querySelector('mark.doc-highlight')
      if (firstHighlight) {
        firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a temporary animation class for pulsing
        firstHighlight.classList.add('pulse-highlight')
        setTimeout(() => {
          firstHighlight.classList.remove('pulse-highlight')
        }, 2000)
      }
    }, 300)

  }, [highlight])

  return null
}
