export function matchesGemSearch(text, query) {
  const haystack=String(text).toLowerCase();
  const terms=String(query).toLowerCase().match(/"[^"]+"|\S+/g)||[];
  return terms.every(term=>{
    if(term.startsWith('"')&&term.endsWith('"')) {
      const phrase=term.slice(1,-1).trim();
      if(!phrase)return true;
      const escaped=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp(`(?:^|[\\s+])${escaped}(?=\\s|$)`).test(haystack);
    }
    return haystack.includes(term);
  });
}
