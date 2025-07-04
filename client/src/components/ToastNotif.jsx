import { Toast, ToastContainer } from 'react-bootstrap';
import { useCart } from '../context/CartContext';

export default function ToastNotif() {
  const { showToast, setShowToast, toastMsg } = useCart();

  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast bg="success" onClose={() => setShowToast(false)} show={showToast} delay={2000} autohide>
        <Toast.Body className="text-white">{toastMsg}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
