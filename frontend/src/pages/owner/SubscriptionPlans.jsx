import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { CheckCircle2, ShieldAlert, ArrowUpCircle } from 'lucide-react';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState(null);
  const [activePlan, setActivePlan] = useState('');
  const [validUntil, setValidUntil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch plans
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/subscriptions/plans', {
          withCredentials: true
        });
        if (response.data.success) {
          setPlans(response.data.plans);
          setActivePlan(response.data.activePlan || 'free');
          if (response.data.validUntil) {
            setValidUntil(new Date(response.data.validUntil));
          }
        }
      } catch (err) {
        setError('Failed to load subscription plans.');
      }
    };
    
    fetchPlans();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (planKey) => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Create order
      const orderRes = await axios.post('/subscriptions/create-order', { planKey }, {
        withCredentials: true
      });
      
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Ahhar Subscription',
        description: `Subscription for ${plans[planKey].name}`,
        order_id: orderId,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verifyRes = await axios.post('/subscriptions/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planKey
            }, {
              withCredentials: true
            });

            if (verifyRes.data.success) {
              alert('Subscription successful!');
              window.location.reload(); // Refresh to update dashboard and features
            }
          } catch (err) {
            console.error(err);
            setError('Payment verification failed.');
          }
        },
        prefill: {
          name: 'Restaurant Owner', // Could fetch from user context
        },
        theme: {
          color: '#f97316' // Tailwind orange-500
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setError('Failed to initiate subscription.');
    } finally {
      setLoading(false);
    }
  };

  if (!plans && !error) return <div className="p-8 text-center text-gray-500">Loading plans...</div>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Subscription</h2>
        <p className="text-sm text-gray-600">
          Your current plan is <span className="font-bold text-orange-600 uppercase">{activePlan}</span>. 
          {validUntil && activePlan !== 'free' && ` Valid until: ${validUntil.toLocaleDateString()}`}
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center rounded-xl shadow-sm border border-red-100">
          <ShieldAlert className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {!plans ? null : (
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = key === activePlan;
            const isUpgrade = plan.isUpgrade;

            // Determine what to show in the pricing header
            let displayPrice = plan.price;
            let displaySub = '/ month';
            if (isUpgrade && plan.upgradePrice < plan.price) {
               displayPrice = plan.upgradePrice;
               displaySub = 'to upgrade today';
            }

            return (
              <div key={key} className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isCurrent ? 'border-orange-500 ring-2 ring-orange-500 ring-opacity-50' : 'border-gray-200'} transition-all`}>
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {isCurrent && <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Current</span>}
                  </div>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-extrabold text-gray-900">₹{displayPrice}</span>
                    <span className="text-gray-500 ml-2 text-sm">{displaySub}</span>
                  </div>
                  {isUpgrade && plan.upgradePrice < plan.price && (
                     <p className="text-xs text-green-600 mt-1 font-medium">Pro-rated discount applied!</p>
                  )}
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrent ? (
                    <button
                      onClick={() => handleSubscribe(key)}
                      disabled={loading || (!isUpgrade && activePlan !== 'free')} // Disable downgrades for now
                      className={`w-full py-2.5 px-4 font-semibold rounded-lg transition-colors ${
                        isUpgrade || activePlan === 'free'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Processing...' : isUpgrade ? 'Upgrade Plan' : 'Subscribe'}
                    </button>
                  ) : (
                    <button disabled className="w-full py-2.5 px-4 bg-orange-50 text-orange-700 font-semibold rounded-lg border border-orange-200">
                      Active Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
