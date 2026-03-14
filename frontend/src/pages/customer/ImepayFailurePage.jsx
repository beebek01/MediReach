import { Link } from 'react-router-dom';

export default function ImepayFailurePage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 page-enter">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="font-fraunces text-2xl font-semibold text-charcoal">Payment cancelled</h2>
      <p className="text-charcoal/60 mt-2">
        Your IME Pay transaction was cancelled or failed. No money has been deducted from your account.
      </p>
      <p className="text-charcoal/60 text-sm mt-1">
        You can try again from your orders page.
      </p>
      <div className="flex gap-3 justify-center mt-6">
        <Link to="/customer/orders" className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark">
          View My Orders
        </Link>
        <Link to="/medicines" className="rounded-lg border border-charcoal/20 text-charcoal px-6 py-2.5 font-medium hover:bg-charcoal/5">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
