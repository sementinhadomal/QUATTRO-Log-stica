import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, description, children, maxWidth = '500px' }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            position: 'fixed',
            inset: 0,
            zIndex: 999
          }} 
        />
        <Dialog.Content 
          style={{
            backgroundColor: '#0D131D',
            border: '1px solid #1C2A3A',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: maxWidth,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            zIndex: 1000
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Dialog.Title style={{ margin: 0, fontSize: '1.25rem', color: '#F5F8FC' }}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button 
                style={{ background: 'transparent', border: 'none', color: '#8FA3B8', cursor: 'pointer' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          
          {description && (
            <Dialog.Description style={{ margin: '0 0 1.5rem 0', color: '#8FA3B8', fontSize: '0.875rem' }}>
              {description}
            </Dialog.Description>
          )}
          
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
