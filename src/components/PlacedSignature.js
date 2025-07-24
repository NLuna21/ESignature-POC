import React from "react";
import { useDrag } from "react-dnd";

export default function PlacedSignature({ url, position, onPositionChange, draggable}) {
  const [{ isDragging }, drag] = useDrag({
    type: "SIGNATURE_SLOT",
    item: { type: "SIGNATURE_SLOT", position },
    canDrag: () => draggable, // ❌ disables drag completely
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
        opacity: 0.5,
        cursor: draggable ? "move" : "default",
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