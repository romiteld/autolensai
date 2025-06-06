```markdown
# AutoLensAI PPC Campaign Automation Guide

## Cross-Platform Campaign Setup Workflow

```
graph TD
    A[Vehicle Listed] --> B{CrewAI Orchestrator}
    B --> C[Google Ads Agent]
    B --> D[Bing Ads Agent]
    B --> E[Facebook Marketplace Agent]
    C --> F[Campaign Creation]
    C --> G[Keyword Optimization]
    D --> H[Google Ads Import]
    E --> I[Boost Management]
    E --> J[Payment Processing]
```

## Google Ads Implementation

### 1. Account Configuration
```
// lib/ads/google.ts
export class GoogleAdsManager {
  async createCampaign(vehicle: Vehicle) {
    const campaign = await google.ads.create({
      name: `AutoLens-${vehicle.id}`,
      budget: vehicle.dailyBudget,
      targeting: {
        locations: vehicle.zipRadius,
        keywords: vehicle.aiGeneratedKeywords,
        languages: ['en-US']
      }
    });
    return campaign.id;
  }
}
```
*Key steps from sources [1][4][6]:*
- Use Expert Mode for full control
- Set conversion tracking via Google Analytics
- Implement negative keywords list

## Bing Ads Implementation

### 1. Campaign Import Strategy
```
# agents/bing_agent.py
def import_google_campaign(google_campaign_id):
    bing_campaign = microsoft_ads.import_campaign(
        source='google',
        campaign_id=google_campaign_id,
        adjustments={
            'bids': 0.85,  # 15% lower than Google
            'negative_match_type': 'exact'
        }
    )
    return bing_campaign
```
*Best practices from [2][3][5]:*
- Start with 85% of Google bid amounts
- Convert negative keywords to exact match
- Enable sitelink extensions

## Facebook Marketplace Priority

### Boost Payment Workflow
```
// pages/api/facebook/boost.ts
export async function handleBoostRequest(vehicleId: string) {
  const vehicle = await getVehicle(vehicleId);
  const boostCost = calculateBoostFee(vehicle);
  
  // Process payment
  const payment = await stripe.charges.create({
    amount: boostCost * 100,
    currency: 'usd',
    source: 'tok_visa',
  });

  if (payment.status === 'succeeded') {
    const boostResult = await facebookApi.boostListing({
      listingId: vehicle.fbListingId,
      budget: boostCost,
      platform: 'web' // Avoid iOS 30% fee
    });
    trackConversion('boost', vehicleId);
  }
}
```

| Payment Method | Fee Handling | Platform | Advantage |
|----------------|--------------|----------|-----------|
| In-App Purchase | 30% Apple fee | iOS | Native integration |
| Stripe Web Flow | 2.9% + $0.30 | Web | Lower fees |
| Subscription Credit | 5% service fee | All | Predictable billing |

## CrewAI Agent Configuration

### Marketing Orchestrator Agent
```
from crewai import Agent

ppc_orchestrator = Agent(
    role="PPC Campaign Manager",
    goal="Maximize ROAS across all platforms",
    backstory="Specializes in multi-platform ad optimization",
    tools=[
        GoogleAdsAPI(),
        BingAdsManager(),
        FacebookBoostTool()
    ],
    verbose=True,
    memory=True,
    max_iter=3
)
```

## Budget Optimization Strategy

### Cross-Platform Bid Adjustments
```
{
  "google": {
    "max_cpc": 2.50,
    "daily_budget": 50,
    "device_modifiers": {
      "mobile": -20%
    }
  },
  "bing": {
    "max_cpc": 2.10,
    "daily_budget": 30,
    "match_type": "phrase"
  },
  "facebook": {
    "daily_budget": 70,
    "bid_strategy": "cost_cap"
  }
}
```
*Optimization tips from [1][3][5]:*
- Start with 20% higher mobile bids
- Use dayparting for peak hours
- Implement portfolio bidding strategies

## Compliance & Security

1. **PCI-DSS Compliance**
```
// components/PaymentForm.tsx
const Elements = initStripeElements(stripe, {
  mode: 'payment',
  amount: 1000,
  currency: 'usd',
  paymentMethodCreation: 'manual',
});

const CardElement = createElement('card');
```
2. **Data Privacy**
- Anonymize vehicle owner data
- Encrypt driver's license scans
- Regular penetration testing

## Performance Monitoring

```
// components/AnalyticsDashboard.tsx
export default function PpcAnalytics() {
  const { data } = useSWR('/api/campaigns/performance');
  
  return (
    
  );
}
```

**Implementation Checklist:**
- [ ] Set up conversion tracking pixels
- [ ] Configure automated bid rules
- [ ] Implement negative keyword monitoring
- [ ] Enable cross-device attribution
- [ ] Schedule weekly performance reports

*Sources: Google Ads setup [1][4][6], Bing optimization [2][3][5], Payment integration [6]*
```

This implementation combines automated campaign management with secure payment processing, leveraging CrewAI agents for cross-platform optimization. The workflow prioritizes Facebook Marketplace while maintaining Google/Bing search presence, using best practices from provided sources[1-6].

[1] https://hawksem.com/blog/google-ads-ppc-campaigns/
[2] https://bird.marketing/blog/digital-marketing/guide/ppc-advertising-guide/bing-ads-successful-campaign/
[3] https://hawksem.com/blog/how-to-create-stellar-ads-for-bing/
[4] https://ads.google.com/intl/en_us/home/how-it-works/
[5] https://www.datafeedwatch.com/blog/microsoft-bing-ads-guide
[6] https://business.google.com/us/google-ads/how-ads-work/
[7] https://support.google.com/google-ads/answer/6324971
[8] https://www.reddit.com/r/PPC/comments/1axgsxb/first_campaign_google_ads/
[9] https://www.youtube.com/watch?v=i3-Dvy4Wjb4
[10] https://landingi.com/ppc/bing/