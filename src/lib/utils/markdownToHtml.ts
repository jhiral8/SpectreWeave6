/**
 * Simple markdown to HTML converter for framework templates
 * Handles basic markdown syntax that TipTap can render
 */

export function markdownToHtml(markdown: string): string {
  let html = markdown

  // Convert headers (# ## ### ####)
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
  html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>')

  // Convert blockquotes (> text)
  html = html.replace(/^> (.*$)/gm, '<blockquote><p>$1</p></blockquote>')

  // Convert horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr>')

  // Convert bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // Convert italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')

  // Convert code blocks (```text```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Convert inline code (`text`)
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')

  // Convert unordered lists (- item or • item)
  const lines = html.split('\n')
  let inList = false
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this line is a list item
    if (/^[•\-\*]\s/.test(line.trim())) {
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      // Extract the list item content (remove bullet and leading spaces)
      const itemContent = line.replace(/^[\s]*[•\-\*]\s/, '').trim()
      processedLines.push(`<li>${itemContent}</li>`)
    }
    // Check for numbered lists
    else if (/^\d+\.\s/.test(line.trim())) {
      if (!inList) {
        processedLines.push('<ol>')
        inList = true
      }
      const itemContent = line.replace(/^[\s]*\d+\.\s/, '').trim()
      processedLines.push(`<li>${itemContent}</li>`)
    }
    // If we were in a list but this line isn't a list item, close the list
    else {
      if (inList) {
        // Check if the previous list was ordered or unordered by looking at the last opening tag
        const lastOpenTag = processedLines.slice().reverse().find(l => l.includes('<ul>') || l.includes('<ol>'))
        if (lastOpenTag?.includes('<ol>')) {
          processedLines.push('</ol>')
        } else {
          processedLines.push('</ul>')
        }
        inList = false
      }
      processedLines.push(line)
    }
  }

  // Close any remaining open list
  if (inList) {
    const lastOpenTag = processedLines.slice().reverse().find(l => l.includes('<ul>') || l.includes('<ol>'))
    if (lastOpenTag?.includes('<ol>')) {
      processedLines.push('</ol>')
    } else {
      processedLines.push('</ul>')
    }
  }

  html = processedLines.join('\n')

  // Convert double line breaks to paragraph separators
  const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim())
  
  // Process each paragraph
  const processedParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim()
    
    // Don't wrap certain elements in paragraphs
    if (trimmed.startsWith('<h') || 
        trimmed.startsWith('<hr') || 
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<pre') ||
        trimmed === '') {
      return trimmed
    }
    
    // Wrap regular content in paragraphs
    return `<p>${trimmed}</p>`
  })

  html = processedParagraphs.join('\n\n')

  // Clean up any remaining issues
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}