'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, Rocket, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  tier_level: number;
  max_projects_per_month: number;
  max_estimates_per_project: number;
  priority_support: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
  ai_capability_level: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadPlans();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('public_subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading plans:', error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const getTierIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return Sparkles;
      case 2: return Zap;
      case 3: return Rocket;
      case 4: return Crown;
      default: return Sparkles;
    }
  };

  const getTierColor = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return 'from-gray-400 to-gray-500';
      case 2: return 'from-brand-green to-emerald-500';
      case 3: return 'from-blue-500 to-blue-600';
      case 4: return 'from-amber-500 to-orange-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      router.push('/auth/register');
      return;
    }

    // In production, integrate with payment provider (Stripe, etc.)
    router.push(`/checkout?plan=${plan.name}&billing=${billingPeriod}`);
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const yearlySavings = monthlyTotal - plan.price_yearly;
    return yearlySavings > 0 ? Math.round((yearlySavings / monthlyTotal) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-3xl mx-auto">
            Unlock more powerful AI capabilities and features as you scale. All plans include full access to our construction estimating platform.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-brand-green text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-brand-green text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {loading ? (
          <div className="text-center text-gray-900">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const Icon = getTierIcon(plan.tier_level);
              const isPopular = plan.tier_level === 2;
              const isEnterprise = plan.tier_level === 4;

              return (
                <Card
                  key={plan.id}
                  className={`relative bg-white border shadow-lg transition-all duration-300 hover:scale-105 ${
                    isPopular
                      ? 'border-brand-green/30 shadow-brand-green/20'
                      : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand-green text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className={`inline-flex mx-auto mb-4 p-3 rounded-xl bg-gradient-to-br ${getTierColor(plan.tier_level)} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.display_name}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-sm min-h-[3rem]">
                      {plan.description}
                    </CardDescription>

                    {/* AI Capability Badge */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 border border-brand-green/30 rounded-full">
                      <Sparkles className="h-3 w-3 text-brand-green" />
                      <span className="text-xs text-brand-green font-medium">
                        {plan.ai_capability_level}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${getPrice(plan).toFixed(0)}
                        </span>
                        <span className="text-gray-500">/month</span>
                      </div>
                      {billingPeriod === 'yearly' && getSavings(plan) > 0 && (
                        <div className="text-xs text-emerald-400 mt-1">
                          Save {getSavings(plan)}% annually
                        </div>
                      )}
                      {billingPeriod === 'yearly' && (
                        <div className="text-xs text-gray-500 mt-1">
                          ${plan.price_yearly}/year
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                          <Check className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full transition-all duration-200 ${
                        isPopular || isEnterprise
                          ? 'bg-brand-green hover:bg-brand-greenDark text-white shadow-lg shadow-brand-green/20'
                          : 'bg-gray-200 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      {plan.price_monthly === 0 ? 'Get Started Free' : `Select ${plan.display_name}`}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* AI Intelligence Levels Explanation */}
        <Card className="mt-16 bg-white border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-green" />
              What Makes Each AI Intelligence Level Different?
            </CardTitle>
            <CardDescription className="text-gray-500">
              Our AI becomes more sophisticated and accurate as you move up tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <Sparkles className="h-5 w-5" />
                Standard AI
              </div>
              <p className="text-sm text-gray-600">
                Reliable estimates for straightforward projects. Fast processing with solid accuracy for common construction scenarios.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <Zap className="h-5 w-5" />
                Advanced AI
              </div>
              <p className="text-sm text-gray-600">
                Enhanced understanding of complex requirements. Better at handling nuanced project details and regional variations.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <Rocket className="h-5 w-5" />
                Premium AI
              </div>
              <p className="text-sm text-gray-600">
                Superior accuracy for sophisticated projects. Excels at technical specifications and detailed cost breakdowns.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <Crown className="h-5 w-5" />
                Enterprise AI
              </div>
              <p className="text-sm text-gray-600">
                Maximum intelligence for mission-critical estimates. Unparalleled accuracy, comprehensive analysis, and deep industry knowledge.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h2>
          <p className="text-gray-500 mb-6">
            Our team is here to help you choose the right plan for your business
          </p>
          <Link href="/faq">
            <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
              View FAQ
            </Button>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
