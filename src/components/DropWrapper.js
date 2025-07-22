import React from "react";
import { useDrop } from "react-dnd";

export default function DropWrapper({ onDrop, children }) {
  const [{ isOver }, dropRef] = useDrop({
    accept: "SIGNATURE_SLOT",
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef}
      style={{
        position: "relative",
        display: "inline-block",
        marginTop: 20,
        border: isOver ? "2px dashed green" : undefined,
      }}
    >
      {children}
    </div>
  );
}