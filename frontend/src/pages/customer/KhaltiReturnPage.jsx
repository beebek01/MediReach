import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export default function KhaltiReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    if (!pidx) {
      addToast('Invalid payment response', 'error');
      navigate('/customer/orders');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.verifyKhalti({ pidx }, accessToken);
        addToast(response.message || 'Payment verified successfully', 'success');
        navigate('/customer/orders');
      } catch (error) {
        addToast(error.message || 'Payment verification failed', 'error');
        navigate('/customer/orders');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, accessToken, addToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2-emerald-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment</h2>
        <p className="text-gray-600">Please wait while we verify your Khalti payment...</p>
      </div>
    </div>
  );
}
