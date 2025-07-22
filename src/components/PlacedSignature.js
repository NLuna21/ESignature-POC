import React from "react";
import { useDrag } from "react-dnd";

export default function PlacedSignature({ url, position, onPositionChange }) {
  const [{ isDragging }, drag] = useDrag({
    type: "SIGNATURE_SLOT",
    item: { type: "SIGNATURE_SLOT", position },
    end: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const container = document.getElementById("pdf-container")?.getBoundingClientRect();
      if (offset && container) {
        const x = offset.x - container.left;
        const y = offset.y - container.top;
        onPositionChange({ x, y });
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        opacity: isDragging ? 0.5 : 1,
        zIndex: 10,
        cursor: "move",
        pointerEvents: "auto",
      }}
    >
      {url.startsWith("data:image") ? (
        <img src={url} alt="Signature" width={150} />
      ) : (
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>{url}</div>
      )}
    </div>
  );
}