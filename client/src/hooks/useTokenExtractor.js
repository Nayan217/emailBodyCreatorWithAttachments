import { useMemo } from 'react';

const EJS_BUILTINS = new Set([
  'if','else','for','while','do','switch','case','break','return','var','let',
  'const','function','class','new','typeof','instanceof','true','false','null',
  'undefined','this','in','of','try','catch','finally','throw','import','export',
  'include','locals','escape','print','echo',
]);

/**
 * Extracts unique EJS variable identifiers from a template string.
 * Scans inside <% ... %> tags, filters JS builtins.
 */
export function useTokenExtractor(template) {
  return useMemo(() => {
    const tags   = [...template.matchAll(/<%[\s\S]*?%>/g)];
    const tokens = tags
      .flatMap(([tag]) => [...tag.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g)])
      .map(([, name]) => name)
      .filter(name => !EJS_BUILTINS.has(name));
    return [...new Set(tokens)];
  }, [template]);
}
