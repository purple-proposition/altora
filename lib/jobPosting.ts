export function cleanJobPostingHtml(html: string, maxChars = 10000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    // Some sites (Stimulus/Hotwire-based ones in particular) have attribute
    // values with quotes/characters that break the simple tag-stripping
    // regex above, leaking framework wiring as visible "text" — e.g.
    // `data-controller="atc" data-atc-l-value="…" analytics#push`. None of
    // this is prose, and left in it dilutes the actual posting content the
    // model needs to read.
    .replace(/data-[\w-]+="[^"]*"/g, ' ')
    .replace(/class="[^"]*"/g, ' ')
    .replace(/\b[\w-]+#[\w-]+(?::\w+)?(?:@[\w-]+->[\w-]+#[\w-]+)?/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim().slice(0, maxChars);
}
