import React from 'react';
import { useDrag } from 'react-dnd';

export default function SignaturePlaceholder({ 
  position,
  onPositionChange,
  onClick,
  field,
  setActiveFieldId,
  handleOpenSignatureModal,
}) {

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'SIGNATURE_SLOT',
    item: { id: 'placeholder' },
    end: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const container = document.getElementById('pdf-container')?.getBoundingClientRect();
      if (offset && container) {
        const x = offset.x - container.left;
        const y = offset.y - container.top;
        onPositionChange({ x, y });
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        width: 160,
        height: 60,
        background: '#fff',
        border: '2px dashed #007bff',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'move',
        zIndex: 10,
        opacity: isDragging ? 0.5 : 0.8,
        borderRadius: '14px',
      }}
      onClick={() => {
        setActiveFieldId(field.id);
        handleOpenSignatureModal();
      }}

    >
      <span style={{ color: '#555' }}>Click to add signature</span>
    </div>
  );
}