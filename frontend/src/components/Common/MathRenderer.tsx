import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  // Process text with KaTeX formulas ($$...$$ for display, $...$ for inline)
  const renderMathAndText = (text: string) => {
    // Split by block math first: $$...$$
    const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

    return blockParts.map((bPart, bIdx) => {
      if (bPart.startsWith('$$') && bPart.endsWith('$$') && bPart.length >= 4) {
        const math = bPart.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <div
              key={`b-${bIdx}`}
              className="my-3 py-1 overflow-x-auto text-slate-900"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <pre key={`b-${bIdx}`} className="p-2 bg-slate-100 rounded text-sm text-purple-700">{math}</pre>;
        }
      }

      // Inside non-block parts, handle inline math: $...$
      // We look for $...$ where the inner doesn't contain $
      const inlineParts = bPart.split(/(\$[^$\n]+?\$)/g);
      return (
        <span key={`p-${bIdx}`}>
          {inlineParts.map((iPart, iIdx) => {
            if (iPart.startsWith('$') && iPart.endsWith('$') && iPart.length >= 3) {
              const math = iPart.slice(1, -1).trim();
              try {
                const html = katex.renderToString(math, {
                  displayMode: false,
                  throwOnError: false,
                });
                return (
                  <span
                    key={`i-${iIdx}`}
                    className="inline-block px-1 align-baseline text-slate-900 font-medium"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                return <code key={`i-${iIdx}`} className="px-1 text-purple-600 bg-purple-50 rounded text-xs">{math}</code>;
              }
            }

            // Normal text: handle line breaks and bold
            return formatMarkdownSpans(iPart, `t-${bIdx}-${iIdx}`);
          })}
        </span>
      );
    });
  };

  const formatMarkdownSpans = (raw: string, keyPrefix: string) => {
    // Replace markdown bold **text** and bullet points
    const lines = raw.split('\n');
    return lines.map((line, lIdx) => {
      // Split line by bold **text**
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = boldParts.map((bp, bpIdx) => {
        if (bp.startsWith('**') && bp.endsWith('**') && bp.length >= 4) {
          return <strong key={`${keyPrefix}-${lIdx}-${bpIdx}`} className="font-semibold text-slate-900">{bp.slice(2, -2)}</strong>;
        }
        return bp;
      });

      return (
        <React.Fragment key={`${keyPrefix}-${lIdx}`}>
          {lIdx > 0 && <br />}
          {formattedLine}
        </React.Fragment>
      );
    });
  };

  if (inline) {
    return <span className={`math-content ${className}`}>{renderMathAndText(content)}</span>;
  }

  return <div className={`math-content leading-relaxed text-slate-800 ${className}`}>{renderMathAndText(content)}</div>;
};

export default MathRenderer;
