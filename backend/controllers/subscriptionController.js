const Razorpay = require('razorpay');
const crypto = require('crypto');
const Restaurant = require('../models/Restaurant');

// Initialize Razorpay
// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

const PLANS = {
  basic: { 
    name: 'Basic Plan', 
    price: 999, 
    durationDays: 30,
    features: ['Core POS Access', 'Table & Menu Management', 'Kitchen Dashboard', 'Max 3 QR Codes'] 
  },
  standard: { 
    name: 'Standard Plan', 
    price: 1999, 
    durationDays: 30,
    features: ['Everything in Basic', 'Unlimited QR Ordering', 'Waiter Dashboard Ops'] 
  },
  premium: { 
    name: 'Premium Plan', 
    price: 2999, 
    durationDays: 30,
    features: ['Everything in Standard', 'Advanced Analytics', 'Complete Inventory & ERP', 'Executive Dashboard'] 
  }
};

exports.getPlans = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    let activePlanKey = 'free';
    let credit = 0;

    if (user && user.subscription && user.subscription.status === 'active') {
      activePlanKey = user.subscription.plan;
      const validUntil = new Date(user.subscription.validUntil);
      const now = new Date();
      
      if (validUntil > now) {
        const remainingDays = Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
        const currentPlan = PLANS[activePlanKey];
        if (currentPlan) {
          credit = (currentPlan.price / currentPlan.durationDays) * remainingDays;
        }
      }
    }

    // Generate dynamic plans with upgrade prices
    const dynamicPlans = {};
    for (const [key, plan] of Object.entries(PLANS)) {
      let upgradePrice = plan.price;
      let isUpgrade = false;

      if (activePlanKey !== 'free' && key !== activePlanKey) {
        if (plan.price > PLANS[activePlanKey].price) {
          isUpgrade = true;
          upgradePrice = Math.max(0, Math.round(plan.price - credit));
        }
      }

      dynamicPlans[key] = {
        ...plan,
        upgradePrice,
        isUpgrade
      };
    }

    res.status(200).json({ 
      success: true, 
      plans: dynamicPlans, 
      activePlan: activePlanKey,
      validUntil: user?.subscription?.validUntil 
    });
  } catch (err) {
    console.error('getPlans error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching plans' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { planKey } = req.body;
    
    if (!PLANS[planKey]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let credit = 0;

    if (user && user.subscription && user.subscription.status === 'active') {
      const activePlanKey = user.subscription.plan;
      const validUntil = new Date(user.subscription.validUntil);
      const now = new Date();
      
      if (validUntil > now && PLANS[activePlanKey]) {
        const remainingDays = Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
        const currentPlan = PLANS[activePlanKey];
        if (PLANS[planKey].price > currentPlan.price) { // Only apply credit if upgrading
          credit = (currentPlan.price / currentPlan.durationDays) * remainingDays;
        }
      }
    }

    const plan = PLANS[planKey];
    const finalPrice = Math.max(0, Math.round(plan.price - credit));
    const amountInPaise = finalPrice * 100; // Razorpay expects amount in paise

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planKey,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Could not create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planKey } = req.body;
    const restaurantId = req.user.restaurantId; // From auth middleware

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Payment is valid, update database
    const plan = PLANS[planKey];
    if (!plan) {
       return res.status(400).json({ success: false, message: 'Invalid plan key provided during verification' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
       return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate new validity
    const now = new Date();
    let newValidUntil = new Date(user.subscription?.validUntil || now);
    
    // If already expired or no validity, start from today. Otherwise, add to existing.
    if (!user.subscription?.validUntil || newValidUntil < now) {
       newValidUntil = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    } else {
       newValidUntil = new Date(newValidUntil.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    }

    user.subscription.plan = planKey;
    user.subscription.status = 'active';
    user.subscription.validUntil = newValidUntil;
    user.subscription.razorpayOrderId = razorpay_order_id;
    user.subscription.razorpayPaymentId = razorpay_payment_id;

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Payment verified successfully and subscription activated',
      subscription: user.subscription 
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
