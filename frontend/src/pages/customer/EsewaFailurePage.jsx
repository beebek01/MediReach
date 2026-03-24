import { Link, useSearchParams } from 'react-router-dom';

export default function EsewaFailurePage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'The payment process was cancelled or failed. Your order is still reserved, you can try paying again from your orders page.';
  const transactionUuid = searchParams.get('transaction_uuid') || '';

  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center page-enter">
      <div className="glass-morphism rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="font-fraunces text-3xl font-bold text-charcoal mb-2">Payment Cancelled</h1>
        <p className="text-charcoal/60 mb-2">{message}</p>
        {transactionUuid && <p className="text-xs text-charcoal/50 mb-8">Transaction UUID: {transactionUuid}</p>}
        <div className="flex flex-col gap-3">
          <Link to="/customer/orders" className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-lg hover:shadow-primary/30 transition-all">
            Go to My Orders
          </Link>
          <Link to="/customer/cart" className="w-full rounded-xl border border-charcoal/10 py-3 font-semibold text-charcoal hover:bg-charcoal/5 transition-all">
            Return to Cart
          </Link>
          <Link to="/" className="text-charcoal/40 text-sm hover:text-primary transition-colors mt-2">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
