import { Toast, ToastContainer } from 'react-bootstrap';
import { useProduct  } from '../context/ProductContext';

export default function ToastNotif() {
  const { showToast, setShowToast, toastMsg } = useProduct ();

  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast bg="success" onClose={() => setShowToast(false)} show={showToast} delay={2000} autohide>
        <Toast.Body className="text-white">{toastMsg}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
