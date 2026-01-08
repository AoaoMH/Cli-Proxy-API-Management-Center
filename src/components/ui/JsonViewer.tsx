import { useMemo, useState } from 'react';

interface JsonViewerProps {
  data: string | Record<string, unknown> | null | undefined;
  emptyText?: string;
}

type JsonLine = {
  id: number;
  lineNumber: number;
  indent: number;
  html: string;
  canFold: boolean;
  blockId: string;
  blockEnd?: number;
  collapsedInfo?: string;
  closingBracket?: string;
  trailingComma?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getTokenHtml = (value: string, type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'bracket' | 'punctuation' | 'ellipsis') => {
  const classMap: Record<string, string> = {
    key: 'token-key',
    string: 'token-string',
    number: 'token-number',
    boolean: 'token-boolean',
    null: 'token-null',
    bracket: 'token-bracket',
    punctuation: 'token-punctuation',
    ellipsis: 'token-ellipsis',
  };
  return `<span class="${classMap[type]}">${escapeHtml(value)}</span>`;
};

const parseJsonToLines = (data: unknown): JsonLine[] => {
  const result: JsonLine[] = [];
  let lineNumber = 1;
  let blockIdCounter = 0;

  const getBlockId = () => `block-${blockIdCounter++}`;

  const processValue = (value: unknown, indent: number, isLast: boolean, keyPrefix = ''): void => {
    const comma = isLast ? '' : ',';

    if (value === null) {
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml('null', 'null') + comma,
        canFold: false,
        blockId: '',
      });
      return;
    }

    if (typeof value === 'boolean') {
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml(String(value), 'boolean') + comma,
        canFold: false,
        blockId: '',
      });
      return;
    }

    if (typeof value === 'number') {
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml(String(value), 'number') + comma,
        canFold: false,
        blockId: '',
      });
      return;
    }

    if (typeof value === 'string') {
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml(`"${value}"`, 'string') + comma,
        canFold: false,
        blockId: '',
      });
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        result.push({
          id: result.length,
          lineNumber: lineNumber++,
          indent,
          html: keyPrefix + getTokenHtml('[]', 'bracket') + comma,
          canFold: false,
          blockId: '',
        });
        return;
      }

      const blockId = getBlockId();
      const startLine = result.length;
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml('[', 'bracket'),
        canFold: true,
        blockId,
        collapsedInfo: `${value.length} items`,
        closingBracket: ']',
        trailingComma: comma,
      });

      value.forEach((item, idx) => {
        processValue(item, indent + 1, idx === value.length - 1);
      });

      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: getTokenHtml(']', 'bracket') + comma,
        canFold: false,
        blockId: '',
      });

      result[startLine].blockEnd = result.length - 1;
      return;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);

      if (keys.length === 0) {
        result.push({
          id: result.length,
          lineNumber: lineNumber++,
          indent,
          html: keyPrefix + getTokenHtml('{}', 'bracket') + comma,
          canFold: false,
          blockId: '',
        });
        return;
      }

      const blockId = getBlockId();
      const startLine = result.length;
      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: keyPrefix + getTokenHtml('{', 'bracket'),
        canFold: true,
        blockId,
        collapsedInfo: `${keys.length} keys`,
        closingBracket: '}',
        trailingComma: comma,
      });

      keys.forEach((key, idx) => {
        const prefix = `${getTokenHtml(`"${key}"`, 'key')}${getTokenHtml(': ', 'punctuation')}`;
        processValue(obj[key], indent + 1, idx === keys.length - 1, prefix);
      });

      result.push({
        id: result.length,
        lineNumber: lineNumber++,
        indent,
        html: getTokenHtml('}', 'bracket') + comma,
        canFold: false,
        blockId: '',
      });

      result[startLine].blockEnd = result.length - 1;
      return;
    }

    result.push({
      id: result.length,
      lineNumber: lineNumber++,
      indent,
      html: keyPrefix + getTokenHtml(String(value), 'string') + comma,
      canFold: false,
      blockId: '',
    });
  };

  processValue(data, 0, true);
  return result;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  return Object.prototype.toString.call(value) === '[object Object]';
};

export const JsonViewer = ({ data, emptyText = '无数据' }: JsonViewerProps) => {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  const normalized = useMemo(() => {
    if (data == null) return { kind: 'empty' as const };

    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (!trimmed) return { kind: 'empty' as const };

      try {
        const parsed = JSON.parse(trimmed);
        return { kind: 'json' as const, value: parsed };
      } catch {
        return { kind: 'text' as const, value: data };
      }
    }

    return { kind: 'json' as const, value: data };
  }, [data]);

  const parseErrorMessage = useMemo(() => {
    if (typeof data !== 'string') return null;
    const trimmed = data.trim();
    if (!trimmed) return null;

    try {
      JSON.parse(trimmed);
      return null;
    } catch {
      return 'invalid JSON';
    }
  }, [data]);

  const lines = useMemo(() => {
    if (normalized.kind !== 'json') return [] as JsonLine[];
    return parseJsonToLines(normalized.value);
  }, [normalized]);

  // Reset folds when switching content
  // (Avoid setState-in-effect to satisfy lint; useMemo already reruns on data changes.)
  const effectiveCollapsedBlocks = useMemo(() => {
    return normalized.kind === 'json' ? collapsedBlocks : new Set<string>();
  }, [collapsedBlocks, normalized.kind]);

  const visibleLines = useMemo(() => {
    if (normalized.kind !== 'json') return [] as JsonLine[];

    const hiddenLineIds = new Set<number>();
    effectiveCollapsedBlocks.forEach((blockId) => {
      const foldStart = lines.find((l) => l.canFold && l.blockId === blockId);
      if (!foldStart || foldStart.blockEnd == null) return;
      for (let idx = foldStart.id + 1; idx < foldStart.blockEnd; idx++) {
        hiddenLineIds.add(idx);
      }
    });

    return lines.filter((l) => !hiddenLineIds.has(l.id));
  }, [effectiveCollapsedBlocks, lines, normalized.kind]);

  const toggleFold = (blockId: string) => {
    if (!blockId) return;
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  if (normalized.kind === 'empty') {
    return <div className="json-viewer-empty">{emptyText}</div>;
  }

  if (normalized.kind === 'text') {
    return (
      <div className="json-viewer json-viewer-raw">
        {parseErrorMessage && (
          <div className="json-parse-warning">
            <span className="warning-title">Warning: 响应解析失败</span>
            <span className="warning-message">{parseErrorMessage}</span>
          </div>
        )}
        <pre className="json-pre">
          <code className="json-code">{normalized.value}</code>
        </pre>
      </div>
    );
  }

  // json
  const contentIsEmptyObject = isPlainObject(normalized.value) && Object.keys(normalized.value).length === 0;
  if (contentIsEmptyObject) {
    return <div className="json-viewer-empty">{emptyText}</div>;
  }

  return (
    <div className="json-viewer json-viewer-tree">
      <div className="json-lines">
        {visibleLines.map((line) => {
          const isCollapsed = line.canFold && effectiveCollapsedBlocks.has(line.blockId);
          const displayHtml = isCollapsed
            ? `${line.html}${getTokenHtml(' … ', 'ellipsis')}${getTokenHtml(line.closingBracket || '', 'bracket')}${line.trailingComma || ''}`
            : line.html;

          return (
            <div key={line.id} className={`json-line ${line.canFold ? 'has-fold' : ''}`}>
              <div className="line-number-area">
                {line.canFold ? (
                  <button type="button" className="fold-button" onClick={() => toggleFold(line.blockId)} aria-label="Toggle fold">
                    <span className="fold-icon">{isCollapsed ? '▶' : '▼'}</span>
                  </button>
                ) : (
                  <span className="fold-spacer" />
                )}
                <span className="line-number">{line.lineNumber}</span>
              </div>
              <div className="line-content-area">
                <span className="indent" style={{ width: `${line.indent * 16}px` }} />
                <span
                  className={`line-content ${isCollapsed ? 'clickable-collapsed' : ''}`}
                  onClick={() => {
                    if (isCollapsed) toggleFold(line.blockId);
                  }}
                  dangerouslySetInnerHTML={{ __html: displayHtml }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
