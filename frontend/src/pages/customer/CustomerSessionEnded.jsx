import React, { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import axios from '@/lib/axios';

const StarRating = ({ rating, setRating, label }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-semibold mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          >
            <Star fill={star <= rating ? 'currentColor' : 'none'} className="w-8 h-8" />
          </button>
        ))}
      </div>
    </div>
  );
};

const CustomerSessionEnded = () => {
  const [searchParams] = useSearchParams();
  const { tableId } = useParams();
  const sessionId = searchParams.get('sessionId');
  const restaurantId = searchParams.get('restaurantId');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [comments, setComments] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId || !restaurantId) {
      setSubmitted(true);
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('/feedback', {
        sessionId,
        tableId,
        restaurantId,
        foodRating,
        serviceRating,
        cleanlinessRating,
        comments
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback', err);
      // Still show submitted so they can move on
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted || (!sessionId && !restaurantId)) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center p-6 bg-background relative z-10 animate-in fade-in duration-500">
        <div className="w-full max-w-sm bg-card/60 backdrop-blur-2xl border border-border/60 p-8 rounded-3xl shadow-xl text-center">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle className="text-emerald-500 w-12 h-12" />
          </div>
          
          <h1 className="text-2xl font-bold font-heading text-foreground mb-3">Thank You!</h1>
          <p className="text-muted-foreground font-sans text-sm mb-6">
            Your bill has been paid and this session is now closed. We appreciate your visit!
          </p>
          
          <div className="bg-foreground/5 rounded-xl p-4 text-xs text-muted-foreground font-medium">
            If you are still at the table and wish to place another order, please close this page and scan the QR code again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full p-4 sm:p-6 bg-background relative z-10 animate-in fade-in duration-500 overflow-y-auto hide-scrollbar pb-24">
      <div className="w-full max-w-sm mx-auto bg-card/60 backdrop-blur-2xl border border-border/60 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <span className="text-3xl">⭐</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">How was it?</h1>
          <p className="text-sm text-muted-foreground">We'd love to hear about your experience!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <StarRating label="Food Quality" rating={foodRating} setRating={setFoodRating} />
          <StarRating label="Service" rating={serviceRating} setRating={setServiceRating} />
          <StarRating label="Cleanliness" rating={cleanlinessRating} setRating={setCleanlinessRating} />
          
          <div className="pt-4">
            <label className="text-sm font-semibold mb-2 block">Any comments? (Optional)</label>
            <textarea 
              rows="3"
              className="w-full bg-foreground/5 border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:bg-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300 resize-none"
              placeholder="Tell us what you liked or what we can improve..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div className="pt-6 space-y-3">
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20">
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSubmitted(true)} className="w-full h-12 rounded-xl text-muted-foreground">
              Skip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerSessionEnded;
