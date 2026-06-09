import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CreditCard, Zap, Crown, Gift } from "lucide-react";
import "./Payment.css";

export default function Payment() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="payment-container">
        <div className="loading">
          <p>Please log in to make payments</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 99,
      icon: Zap,
      features: [
        "5 GB Storage",
        "Basic Analytics",
        "Standard Support",
        "No Ads on Profile",
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: 299,
      icon: Crown,
      features: [
        "50 GB Storage",
        "Advanced Analytics",
        "Priority Support",
        "Custom Domain",
        "Monetization Tools",
      ],
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: 599,
      icon: Gift,
      features: [
        "Unlimited Storage",
        "Real-time Analytics",
        "24/7 Support",
        "Custom Branding",
        "API Access",
        "Team Collaboration",
      ],
      popular: false,
    },
  ];

  const handlePayment = async (planId: string, price: number) => {
    setLoading(true);
    try {
      // Call payment API
      const response = await fetch("/api/trpc/payment.initiatePayment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: price,
          productName: `${planId.toUpperCase()} Plan`,
          customerName: user?.name || "User",
          customerEmail: user?.email || "user@example.com",
          customerPhone: "01700000000",
          orderId: `ORDER-${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (data.redirectGatewayURL) {
        window.location.href = data.redirectGatewayURL;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <h1>Choose Your Plan</h1>
        <p>Upgrade to unlock premium features</p>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? "popular" : ""} ${
                selectedPlan === plan.id ? "selected" : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}

              <div className="plan-icon">
                <Icon size={32} />
              </div>

              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">৳</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/month</span>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="checkmark">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`subscribe-btn ${plan.popular ? "primary" : "secondary"}`}
                onClick={() => handlePayment(plan.id, plan.price)}
                disabled={loading}
              >
                {loading && selectedPlan === plan.id ? "Processing..." : "Subscribe Now"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="payment-methods">
        <h2>Accepted Payment Methods</h2>
        <div className="methods-grid">
          <div className="method-card">
            <CreditCard size={32} />
            <p>Credit Card</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>Debit Card</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>Mobile Banking</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>Internet Banking</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h4>Can I change my plan anytime?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately.</p>
          </div>
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>Yes, we offer a 7-day free trial for all plans. No credit card required.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>We accept all major credit cards, debit cards, and mobile banking options through SSLCommerz.</p>
          </div>
          <div className="faq-item">
            <h4>Can I get a refund?</h4>
            <p>Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
