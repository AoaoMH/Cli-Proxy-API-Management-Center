import React, { useMemo } from 'react';

interface JsonViewerProps {
  data: string | Record<string, unknown> | null | undefined;
  emptyText?: string;
}

// 简单的 JSON 语法高亮渲染
const highlightJson = (jsonStr: string): React.ReactNode[] => {
  const lines = jsonStr.split('\n');
  
  return lines.map((line, index) => {
    // 高亮 key
    let highlighted = line.replace(
      /"([^"]+)":/g,
      '<span class="json-key">"$1"</span>:'
    );
    // 高亮字符串值
    highlighted = highlighted.replace(
      /: "([^"]*)"/g,
      ': <span class="json-string">"$1"</span>'
    );
    // 高亮数字
    highlighted = highlighted.replace(
      /: (-?\d+\.?\d*)/g,
      ': <span class="json-number">$1</span>'
    );
    // 高亮布尔值
    highlighted = highlighted.replace(
      /: (true|false)/g,
      ': <span class="json-boolean">$1</span>'
    );
    // 高亮 null
    highlighted = highlighted.replace(
      /: (null)/g,
      ': <span class="json-null">$1</span>'
    );

    return (
      <div 
        key={index} 
        className="json-line"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  });
};

export const JsonViewer = ({ data, emptyText = '无数据' }: JsonViewerProps) => {
  const content = useMemo(() => {
    if (!data) return null;
    
    try {
      // 如果是字符串，尝试解析为 JSON
      if (typeof data === 'string') {
        // 先尝试解析看是否是有效 JSON
        try {
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // 不是有效 JSON，直接返回原始字符串
          return data;
        }
      }
      // 如果是对象，格式化为 JSON 字符串
      return JSON.stringify(data, null, 2);
    } catch {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  }, [data]);

  if (!content) {
    return <div className="json-viewer-empty">{emptyText}</div>;
  }

  // 检查是否是 JSON 格式（以 { 或 [ 开头）
  const isJson = content.trim().startsWith('{') || content.trim().startsWith('[');

  return (
    <div className="json-viewer">
      <pre className="json-pre">
        <code className="json-code">
          {isJson ? highlightJson(content) : content}
        </code>
      </pre>
    </div>
  );
};
