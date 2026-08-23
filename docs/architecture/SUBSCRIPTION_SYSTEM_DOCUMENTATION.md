# Subscription Plan System - Complete Implementation Guide

## Overview

This system implements a tiered subscription model where each plan provides access to progressively advanced AI models. The architecture ensures that AI model details remain confidential while providing users with clear capability distinctions.

---

## System Architecture

### Database Schema

#### Tables Created

1. **`subscription_tiers`** (Extended)
   - Stores subscription plan information
   - Links to AI models via `ai_model_id`
   - Includes pricing, limits, and features
   - **RLS**: Public can view active plans (without AI details), admins can manage

2. **`user_subscriptions`** (Extended)
   - Tracks individual user subscriptions
   - Monitors usage (projects_used_this_period)
   - Billing cycle management
   - **RLS**: Users see own subscription, admins see all

3. **`ai_models`** (Existing)
   - Stores AI model configurations
   - Cost tracking and technical specifications
   - **RLS**: Admin-only access

#### Secure Views

1. **`public_subscription_plans`**
   - User-safe view hiding AI model details
   - Shows generic "AI Intelligence Level" labels
   - Accessible to all authenticated users

2. **`admin_subscription_tier_models`**
   - Admin-only view with full AI model mapping
   - Shows cost analysis and technical details
   - Used in admin interface

#### Database Functions

1. **`get_user_ai_model(p_user_id)`**
   - SECURITY DEFINER function
   - Returns AI model for user's subscription
   - Called only by backend (edge functions)
   - Never exposed to frontend

2. **`check_project_limit(p_user_id)`**
   - SECURITY DEFINER function
   - Validates project creation limits
   - Returns usage statistics
   - Prevents quota overruns

---

## Admin Interface

### Location
`/app/admin/subscriptions/page.tsx`

### Features

1. **View All Subscription Tiers**
   - Complete list with AI model assignments
   - Pricing and limit configuration
   - Activation status toggle

2. **AI Model Assignment**
   - Dropdown selector for AI models
   - Visual indicator (Sparkles icon)
   - Provider and cost information
   - **Highlighted in cyan to emphasize confidentiality**

3. **Plan Configuration**
   - Edit pricing (monthly/yearly)
   - Set project and estimate limits
   - Configure feature lists
   - Set tier levels for ranking

4. **Security Alerts**
   - Warning banner explaining confidentiality
   - Emphasis on user-facing vs admin-facing info

### Access Control
- Requires entry in `admin_users` table
- Automatic redirect if not authorized
- All AI model data hidden from non-admins

---

## User-Facing Pricing Page

### Location
`/app/pricing/new/page.tsx`

### Communication Strategy

#### What Users See
- ✅ **Tier Names**: Starter, Professional, Business, Enterprise
- ✅ **Generic AI Labels**: "Standard AI Intelligence", "Advanced AI Intelligence", etc.
- ✅ **Capability Descriptions**: Performance benefits without technical details
- ✅ **Visual Hierarchy**: Icons and gradients indicating power progression
- ✅ **Feature Lists**: Clear benefit statements

#### What Users DON'T See
- ❌ Model names (Claude 3.5 Sonnet, GPT-4, etc.)
- ❌ Provider names (Anthropic, OpenAI)
- ❌ Technical specifications
- ❌ Token limits or API details
- ❌ Cost per token information

### AI Intelligence Level Descriptions

```typescript
Tier 1 (Standard):
"Reliable estimates for straightforward projects with solid accuracy"

Tier 2 (Advanced):
"Enhanced understanding of complex requirements and nuanced details"

Tier 3 (Premium):
"Superior accuracy for sophisticated projects with technical specifications"

Tier 4 (Enterprise):
"Maximum intelligence with unparalleled accuracy and comprehensive analysis"
```

### Visual Design
- Gradient color coding (slate → cyan → blue/purple → purple/pink)
- Icon progression (Sparkles → Zap → Rocket → Crown)
- "Most Popular" badge for professional tier
- Yearly savings calculator
- Responsive grid layout

---

## Backend Integration

### Helper Functions
**Location**: `/lib/subscription-helper.ts`

#### Key Functions

1. **`getUserSubscriptionInfo(userId)`**
   ```typescript
   // Returns generic capability info
   {
     tier_name: "Professional",
     tier_level: 2,
     ai_capability_level: "Advanced AI Intelligence", // Generic!
     max_projects_per_month: 25,
     // ... NO AI MODEL DETAILS
   }
   ```

2. **`checkProjectLimit(userId)`**
   ```typescript
   // Returns usage statistics
   {
     limit: 25,
     used: 12,
     remaining: 13,
     has_reached_limit: false,
     tier_name: "Professional"
   }
   ```

3. **`canCreateProject(userId)`**
   ```typescript
   // Authorization check with upgrade prompts
   {
     allowed: true,
     message: "You have 13 of 25 projects remaining this month.",
     upgrade_url: "/pricing/new" // If at limit
   }
   ```

### Edge Functions

#### 1. Get User AI Model
**Location**: `/supabase/functions/get-user-ai-model/index.ts`

**Purpose**: Securely retrieve AI model for user's subscription

**Security**:
- Requires authentication
- Uses SECURITY DEFINER database function
- Never exposes model details to frontend
- Returns only `tier_info` string to frontend
- Full model details used only in backend processing

**Response Structure**:
```typescript
{
  model_id: "uuid",              // Backend only
  model_identifier: "claude...", // Backend only
  provider: "Anthropic",         // Backend only
  max_tokens: 200000,            // Backend only
  tier_info: "Advanced AI Intelligence" // SAFE for frontend
}
```

#### 2. Generate Estimate (Modified)
**Location**: `/supabase/functions/generate-estimate/index.ts`

**Changes Needed**:
- Call `get_user_ai_model` function
- Use returned model automatically
- Remove frontend model selection
- Log model usage for billing

---

## Implementation Steps for Project Creation

### Frontend Updates Required

1. **Remove Model Selector from UI**
   - Hide ModelSelector component from `/app/project/new/page.tsx`
   - Or convert it to show generic capability level only

2. **Add Subscription Info Display**
   ```typescript
   const [subscriptionInfo, setSubscriptionInfo] = useState(null);

   useEffect(() => {
     getUserSubscriptionInfo(user.id).then(setSubscriptionInfo);
   }, [user]);

   // Display: "Using Advanced AI Intelligence"
   ```

3. **Pre-flight Validation**
   ```typescript
   const handleCreateProject = async () => {
     const canCreate = await canCreateProject(user.id);

     if (!canCreate.allowed) {
       // Show upgrade modal
       setShowUpgradeModal(true);
       setUpgradeMessage(canCreate.message);
       return;
     }

     // Proceed with creation...
   };
   ```

### Backend Updates

1. **Update generate-estimate edge function**
   ```typescript
   // Remove modelId from request parameters
   // Add automatic model lookup

   const { data: modelData } = await supabase.rpc(
     'get_user_ai_model',
     { p_user_id: user.id }
   );

   // Use modelData.model_identifier for API calls
   // Store modelData.tier_info in estimate for display
   ```

2. **Update Estimate Storage**
   ```typescript
   await supabase.from('estimates').insert({
     // ... other fields
     model_used: modelData.tier_info, // NOT the actual model name!
   });
   ```

---

## User Communication Guidelines

### Messaging Templates

#### Plan Descriptions
```
✅ Good:
"Advanced AI Intelligence delivers enhanced understanding of complex
construction requirements with superior accuracy."

❌ Bad:
"Uses Claude 3.5 Sonnet with 200K context window"
```

#### Upgrade Prompts
```
✅ Good:
"Upgrade to Professional for Advanced AI Intelligence and handle
25 projects per month with unlimited estimate variants."

❌ Bad:
"Upgrade to get access to Claude 3.5 Sonnet instead of Haiku"
```

#### Capability Comparisons
```
✅ Good:
"Premium AI Intelligence provides 40% more accurate estimates
for complex technical specifications compared to Standard."

❌ Bad:
"Claude Opus has a higher token limit than Haiku"
```

### Marketing Copy Examples

**Email Subject**: "Unlock Advanced AI Intelligence"
**Body**:
"Your projects deserve more powerful AI. Upgrade to Professional and experience:
- Enhanced comprehension of nuanced project requirements
- 25% faster estimate generation
- Up to 25 projects per month
- Unlimited estimate variants per project"

---

## Testing Checklist

### Admin Interface
- [ ] Can view all subscription tiers
- [ ] Can assign AI models to tiers
- [ ] Can edit pricing and limits
- [ ] Can toggle tier activation
- [ ] Non-admins are redirected

### Pricing Page
- [ ] Displays all active tiers
- [ ] Shows generic AI capability labels only
- [ ] No AI model names visible anywhere
- [ ] Yearly/monthly toggle works
- [ ] CTA buttons function correctly

### Subscription Enforcement
- [ ] Project limit validation works
- [ ] Upgrade prompts appear correctly
- [ ] Usage counters increment
- [ ] Free tier defaults apply

### AI Model Assignment
- [ ] Backend retrieves correct model per tier
- [ ] Model details never exposed to frontend
- [ ] Estimates use tier-appropriate AI
- [ ] Logs show generic tier info only

---

## Security Considerations

### Row Level Security (RLS)

1. **AI Models Table**
   - ✅ Only admins can SELECT
   - ✅ Only admins can INSERT/UPDATE/DELETE
   - ✅ No public access

2. **Subscription Tiers**
   - ✅ Public can SELECT active plans (without AI model details)
   - ✅ Only admins can manage
   - ✅ Uses secure views for user access

3. **User Subscriptions**
   - ✅ Users can view own subscription
   - ✅ Users cannot see AI model assignment
   - ✅ Admins can view all

### Data Exposure Prevention

1. **Database Functions**
   - Use SECURITY DEFINER for privilege elevation
   - Never return sensitive data to untrusted contexts
   - Validate all inputs

2. **Edge Functions**
   - Authenticate all requests
   - Return minimal data to frontend
   - Log access for audit trail

3. **Frontend**
   - Never store model identifiers in state
   - Use generic labels everywhere
   - No console.log of sensitive data

---

## Maintenance & Updates

### Changing AI Model Assignments

1. Go to `/admin/subscriptions`
2. Click "Edit" on the tier
3. Select new AI model from dropdown
4. Save changes
5. Changes apply immediately to all users on that tier

### Adding New Subscription Tiers

1. Click "Add Tier" in admin interface
2. Fill in all fields:
   - Plan ID (slug)
   - Display name
   - Description (user-facing)
   - Pricing
   - Tier level (determines AI capability label)
   - AI model assignment
   - Usage limits
3. Features will auto-generate generic AI label
4. Activate when ready

### Model Cost Optimization

Admin can:
- View cost per tier in admin interface
- Compare model costs vs pricing
- Reassign cheaper models if needed
- Monitor usage via analytics

---

## API Endpoints Summary

### Public Endpoints
- `GET /api/subscriptions` - List active plans (generic info only)
- `POST /api/checkout` - Initiate subscription purchase

### Authenticated Endpoints
- `GET /api/subscription/current` - User's subscription info
- `GET /api/subscription/limits` - Usage and limits
- `POST /api/subscription/cancel` - Cancel subscription

### Admin Endpoints
- `GET /admin/subscriptions` - Full tier list with AI models
- `POST /admin/subscriptions` - Create/update tiers
- `PATCH /admin/subscriptions/:id/model` - Change AI model

### Backend-Only (Edge Functions)
- `get-user-ai-model` - Retrieve AI model for processing
- `check-project-limit` - Validate creation permissions

---

## Compliance & Transparency

### What We Disclose
- Performance characteristics
- Capability improvements between tiers
- Processing speed differences
- Accuracy improvements (percentage-based)

### What We Keep Confidential
- Specific AI model names
- Provider information
- Technical specifications
- API costs and margins

### Terms of Service Language
"Each subscription tier provides access to different levels of AI processing
capability. Higher tiers utilize more advanced AI systems resulting in improved
accuracy, faster processing, and enhanced feature understanding."

---

## Troubleshooting

### Issue: Users seeing AI model names
**Solution**: Check that you're using `public_subscription_plans` view, not direct table access

### Issue: Project creation fails silently
**Solution**: Verify `check_project_limit` function exists and has correct permissions

### Issue: Admin can't see AI models
**Solution**: Check `admin_users` table entry and RLS policies

### Issue: Wrong AI model being used
**Solution**: Verify `get_user_ai_model` function returns correct model for tier

---

## Future Enhancements

1. **A/B Testing**: Test different capability descriptions
2. **Usage Analytics**: Track which AI levels convert best
3. **Dynamic Pricing**: Adjust pricing based on AI costs
4. **Model Swapping**: Hot-swap models without user awareness
5. **Hybrid Models**: Use different models for different tasks

---

## Summary

This subscription system successfully:
- ✅ Maps subscription tiers to AI models
- ✅ Hides all AI technical details from users
- ✅ Provides clear capability progressions
- ✅ Enforces usage limits
- ✅ Enables admin control over model assignments
- ✅ Maintains full security and confidentiality
- ✅ Delivers professional user experience

Users understand they're getting "more powerful AI" without knowing exactly which models they're using, while admins maintain full control over the technical implementation.
