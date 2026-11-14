import React, { useEffect, useRef, useState } from "react";

interface InlineEditableProps {
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  lightSurface?: boolean;
  as?: "span" | "p" | "h2" | "div";
}

export const InlineEditable: React.FC<InlineEditableProps> = ({
  value,
  onChange,
  multiline = false,
  className = "",
  inputClassName = "",
  style,
  placeholder = "Click to edit...",
  lightSurface = false,
  as: Tag = "span",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    const next = draft.trim() === "" && placeholder ? value : draft;
    if (next !== value) {
      onChange(next);
    }
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  if (isEditing) {
    const sharedRing = lightSurface
      ? "ring-2 ring-blue-600/80 bg-white/80 text-zinc-900"
      : "ring-2 ring-blue-400/90 bg-black/55 text-white";

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={Math.min(9, Math.max(2, draft.split(/\r?\n/).length))}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          style={style}
          className={`w-full resize-none rounded px-1.5 py-0.5 outline-none ${sharedRing} ${className} ${inputClassName}`}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        size={Math.max(6, Math.min(48, draft.length + 1))}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        style={style}
        className={`max-w-full rounded px-1 -mx-1 outline-none ${sharedRing} ${className} ${inputClassName}`}
      />
    );
  }

  const hoverClass = lightSurface
    ? "hover:bg-blue-600/10 hover:ring-1 hover:ring-blue-600/60"
    : "hover:bg-blue-400/15 hover:ring-1 hover:ring-blue-400/70";

  return (
    <Tag
      role="button"
      tabIndex={0}
      title="Click to edit text"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setDraft(value);
        setIsEditing(true);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDraft(value);
          setIsEditing(true);
        }
      }}
      style={style}
      className={`cursor-text rounded-[3px] transition-colors ${hoverClass} ${className}`}
    >
      {value || <span className="opacity-45">{placeholder}</span>}
    </Tag>
  );
};
