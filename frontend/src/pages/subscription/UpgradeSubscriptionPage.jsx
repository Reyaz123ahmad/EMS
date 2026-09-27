import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePlans } from '../../hooks/useSubscription.js';
import paymentService from '../../services/payment.service.js';
import useAuthStore from '../../store/auth.store.js';
import { Check, ShieldCheck, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export function UpgradeSubscriptionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.roles?.includes('SUPER_ADMIN');

  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: razorpayConfig } = useQuery({
    queryKey: ['razorpay-config'],
    queryFn: () => paymentService.getRazorpayConfig()
  });

  const [selectedPlanId, setSelectedPlanId] = useState(
    location.state?.selectedPlan?.id || plans[0]?.id || ''
  );
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  if (isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Subscription Management
        </h1>
        <Card className="p-8 text-center">
          <EmptyState
            title="Super Admin Access"
            message="Super Admins have platform-level access. No organization subscription is required."
          />
        </Card>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      // 1. Check if Razorpay script is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      // 2. Get Razorpay Key
      const keyId = razorpayConfig?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay key not configured. Contact admin.');
      }

      // 3. Create order on backend
      const order = await paymentService.createOrder(selectedPlan.id, billingCycle);

      if (!order?.orderId) {
        throw new Error('Failed to create payment order');
      }

      // 4. Configure Razorpay modal options
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'EMS Platform',
        description: `${selectedPlan.name} Subscription - ${billingCycle}`,
        order_id: order.orderId,
        prefill: {
          name: order.user?.name || user?.name || '',
          email: order.user?.email || user?.email || '',
          contact: order.user?.phone || user?.phone || ''
        },
        theme: {
          color: '#4f46e5'
        },
        handler: async function (response) {
          try {
            toast.loading('Verifying payment and activating plan...');
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId: selectedPlan.id,
              billingCycle
            });

            toast.dismiss();
            toast.success(`Payment successful! ${selectedPlan.name} plan activated.`);
            queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
            navigate('/subscription/current');
          } catch (verifyErr) {
            toast.dismiss();
            toast.error(verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled');
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + (response.error?.description || 'Transaction failed'));
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  const calculatedPrice = selectedPlan
    ? billingCycle === 'yearly'
      ? Number(selectedPlan.price) * 10
      : Number(selectedPlan.price)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Upgrade Subscription
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select your plan and billing frequency to unlock higher capacity and features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                Billing Cycle
              </span>
              <p className="text-xs text-slate-400">Save 17% with annual billing</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Yearly (2 Months Free)
              </button>
            </div>
          </div>

          {/* Plan Selector List */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Choose Tier
            </span>
            {plans.map((p) => {
              const isSelected = (selectedPlan?.id || plans[0]?.id) === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400">{p.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      ₹{billingCycle === 'yearly' ? (Number(p.price) * 10).toLocaleString() : Number(p.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">/{billingCycle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Order Summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Summary</h3>

          <div className="space-y-3 text-sm pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Plan</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedPlan?.name || 'Selected Plan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Billing Cycle</span>
              <span className="capitalize font-semibold text-slate-900 dark:text-white">
                {billingCycle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Tax (GST 18%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{Math.round(calculatedPrice * 0.18).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-900 dark:text-white">Total Amount</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              ₹{Math.round(calculatedPrice * 1.18).toLocaleString()}
            </span>
          </div>

          <Button
            type="button"
            onClick={handleCheckout}
            disabled={processing || loadingPlans}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting Razorpay...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay with Razorpay
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-bit Encrypted Secure Checkout
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeSubscriptionPage;
