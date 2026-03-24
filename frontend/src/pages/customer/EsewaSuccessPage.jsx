import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';

export default function EsewaSuccessPage() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { fetchCart } = useCart();
  const [orderId, setOrderId] = useState('');
  const [transactionUuid, setTransactionUuid] = useState('');

  useEffect(() => {
    const callbackOrderId = searchParams.get('orderId') || '';
    const callbackTransactionUuid = searchParams.get('transaction_uuid') || '';

    setOrderId(callbackOrderId);
    setTransactionUuid(callbackTransactionUuid);
    addToast('Payment verified successfully!', 'success');
    fetchCart();
  }, [searchParams, addToast, fetchCart]);

  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center page-enter">
      <div className="glass-morphism rounded-3xl p-8 border border-white/20 shadow-2xl">
        <>
          <div className="text-6xl mb-6 animate-bounce">✅</div>
          <h1 className="font-fraunces text-3xl font-bold text-charcoal mb-2">Payment Success!</h1>
          <p className="text-charcoal/60 mb-2">Thank you for your payment. Your order is now being processed.</p>
          {transactionUuid && <p className="text-xs text-charcoal/50 mb-8">Transaction UUID: {transactionUuid}</p>}
          <div className="flex flex-col gap-3">
            <Link
              to={orderId ? `/customer/orders/${orderId}` : '/customer/orders'}
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all"
            >
              View Order Details
            </Link>
            <Link to="/medicines" className="text-charcoal/40 text-sm hover:text-primary transition-colors">
              Continue Shopping
            </Link>
          </div>
        </>
      </div>
    </div>
  );
}
