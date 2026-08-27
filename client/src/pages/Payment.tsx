import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle, CreditCard, Zap, Crown, Gift, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";
import "./Payment.css";

export default function Payment() {
  const { isAuthenticated, user } = useAuth();
  const { t, formatCurrency } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const initiatePayment = trpc.payment.initiatePayment.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="payment-container">
        <div className="loading">
          <p>{t("payment.loginRequired")}</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            {t("common.login")}
          </Button>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "basic",
      name: t("payment.basicPlan"),
      price: 99,
      icon: Zap,
      features: [
        t("payment.basicStorage"),
        t("payment.basicAnalytics"),
        t("payment.standardSupport"),
        t("payment.noAdsProfile"),
      ],
      popular: false,
    },
    {
      id: "pro",
      name: t("payment.proPlan"),
      price: 299,
      icon: Crown,
      features: [
        "50 GB Storage",
        t("payment.advancedAnalytics"),
        t("payment.prioritySupport"),
        t("payment.customDomain"),
        t("payment.monetizationTools"),
      ],
      popular: true,
    },
    {
      id: "premium",
      name: t("payment.premiumPlan"),
      price: 599,
      icon: Gift,
      features: [
        t("payment.unlimitedStorage"),
        t("payment.realtimeAnalytics"),
        t("payment.support247"),
        t("payment.customBranding"),
        t("payment.apiAccess"),
        t("payment.teamCollaboration"),
      ],
      popular: false,
    },
  ];

  const handlePayment = async (planId: string, price: number) => {
    setSelectedPlan(planId);
    setPaymentError(null);
    setLoading(true);
    try {
      const data = await initiatePayment.mutateAsync({
        amount: price,
        productName: `${planId.toUpperCase()} Plan`,
        productDescription: `${planId.toUpperCase()} subscription plan`,
        customerName: user?.name || "User",
        customerEmail: user?.email || "user@example.com",
        customerPhone: "01700000000",
        orderId: `ORDER-${Date.now()}`,
        currency: "BDT",
      });
      const gatewayUrl = data.redirectGatewayURL || data.GatewayPageURL;
      if (!gatewayUrl) throw new Error(t("payment.gatewayUnavailable"));
      window.location.assign(gatewayUrl);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error instanceof Error ? error.message : t("payment.initiationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <h1>{t("payment.choosePlan")}</h1>
        <p>{t("payment.upgradeDescription")}</p>
        {paymentError && (
          <div role="alert" className="mx-auto mt-4 flex max-w-xl items-start gap-3 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-left text-red-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div className="flex-1">
              <p className="font-medium">{paymentError}</p>
              <button type="button" onClick={() => setPaymentError(null)} className="mt-1 text-sm text-red-200 underline underline-offset-2">{t("common.close")}</button>
            </div>
          </div>
        )}
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
              {plan.popular && <div className="popular-badge">{t("common.popular", "Most Popular")}</div>}

              <div className="plan-icon">
                <Icon size={32} />
              </div>

              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">৳</span>
                <span className="amount">{formatCurrency(plan.price, "BDT")}</span>
                <span className="period">{t("payment.monthlyPrice")}</span>
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
                disabled={loading || initiatePayment.isPending}
              >
                {loading && selectedPlan === plan.id ? <><Loader2 className="h-4 w-4 animate-spin" />{t("payment.processing")}</> : t("payment.subscribeNow")}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="payment-methods">
        <h2>{t("payment.paymentMethods")}</h2>
        <div className="methods-grid">
          <div className="method-card">
            <CreditCard size={32} />
            <p>{t("payment.creditCard")}</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>{t("payment.debitCard")}</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>{t("payment.mobileBanking")}</p>
          </div>
          <div className="method-card">
            <CreditCard size={32} />
            <p>{t("payment.internetBanking")}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h2>{t("payment.faq")}</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h4>{t("payment.faqChangePlan")}</h4>
            <p>{t("payment.faqChangePlanAnswer")}</p>
          </div>
          <div className="faq-item">
            <h4>{t("payment.faqTrial")}</h4>
            <p>{t("payment.faqTrialAnswer")}</p>
          </div>
          <div className="faq-item">
            <h4>{t("payment.faqMethods")}</h4>
            <p>{t("payment.faqMethodsAnswer")}</p>
          </div>
          <div className="faq-item">
            <h4>{t("payment.faqRefund")}</h4>
            <p>{t("payment.faqRefundAnswer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
