import React from 'react'

export default function Modal({ children, open, onClose }) {
  if (!open) return null
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  )
}
