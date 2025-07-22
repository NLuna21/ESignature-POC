import React from 'react';
import { useDrag } from 'react-dnd';

export default function SignatureDraggable({ url }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'SIGNATURE_SLOT',
    item: { id: 'placeholder', url },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      style={{
        width: 160,
        height: 50,
        border: '2px dashed #888',
        backgroundColor: '#f0f0f0',
        color: url ? '#222' : '#666',
        fontSize: url ? 24 : 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
        marginTop: '1rem',
        fontWeight: url ? 'bold' : 'normal',
      }}
    >
      {url
        ? (url.startsWith("data:image")
            ? <img src={url} alt="Signature" style={{ maxHeight: 40, maxWidth: 140 }} />
            : <span>{url}</span>
          )
        : "Drag Signature field"}
    </div>
  );
}