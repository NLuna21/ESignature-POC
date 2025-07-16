import React from 'react';
import { useDrag } from 'react-dnd';

export default function SignatureDraggable({ url }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'SIGNATURE',
    item: { url },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
  }));

  return (
    <div ref={dragRef} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      {url.startsWith("data:image") ? (
        <img src={url} alt="Signature" width={150} />
      ) : (
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>{url}</div>
      )}
    </div>
  );
}