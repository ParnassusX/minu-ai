# 🎯 CONSOLIDATION TARGETS - EXACT LOCATIONS

## **IMMEDIATE ACTION ITEMS**

### **🔥 CRITICAL: Environment Variables (.env.local)**
```bash
# CURRENT DUPLICATES (CONFIRMED IN OPEN FILE)
GEMINI_API_KEY=sk-xxx
GOOGLE_GEMINI_API_KEY=sk-xxx  # ← DELETE THIS LINE
REPLICATE_API_TOKEN=r8_xxx
NEXT_PUBLIC_REPLICATE_API_TOKEN=r8_xxx  # ← DELETE THIS LINE

# TARGET STATE
GEMINI_API_KEY=sk-xxx  # Keep server-side only
REPLICATE_API_TOKEN=r8_xxx  # Keep server-side only
```

---

## **🔐 AUTHENTICATION HELPERS - EXACT LOCATIONS**

### **Duplicate getAuthenticatedUser() Functions**
```typescript
// 1. src/app/api/gallery/route.ts
// Lines: 185-191 (Remove local function)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // ... remove this entire function
}

// 2. src/app/api/gallery/folders/route.ts  
// Lines: 6-17 (Remove local function)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // ... remove this entire function
}

// 3. src/app/api/gallery/save/route.ts
// Lines: 5-14 (Remove local function)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // ... remove this entire function
}

// 4. src/app/api/prompt-history/route.ts
// Lines: 20-35 (Remove local function)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // ... remove this entire function
}

// 5. src/app/api/gallery/batch/route.ts
// Lines: 8-14 (Remove local function - uses import from server.ts)
// This one already imports correctly, verify it's using the right import
```

### **Required Import Updates**
```typescript
// ADD TO ALL AFFECTED FILES:
import { getAuthenticatedUser } from '@/lib/auth/server'

// REMOVE FROM ALL AFFECTED FILES:
import { createClient } from '@/lib/supabase/server' // (if only used for auth)
```

---

## **🔗 API ENDPOINTS - REMOVAL TARGETS**

### **Duplicate Prompt Enhancement**
```typescript
// ❌ DELETE ENTIRE DIRECTORY
src/app/api/enhance-prompt/
├── route.ts  # Legacy implementation
└── ...

// ✅ KEEP
src/app/api/enhance-prompt-v2/route.ts  # Optimized version
```

### **Duplicate Auth Status**
```typescript
// ❌ DELETE ENTIRE DIRECTORY  
src/app/api/auth-status/
├── route.ts  # Returns hardcoded false values
└── ...

// ✅ KEEP
src/app/api/auth-check/route.ts  # Optimized with caching
```

### **Multiple Health Checks**
```typescript
// ❌ CONSOLIDATE THESE INTO SINGLE ENDPOINT
src/app/api/health/route.ts  # Comprehensive health check
src/app/api/integration-check/route.ts  # Integration verification  
src/app/api/production-verify/route.ts  # Production readiness

// ✅ TARGET: Single comprehensive health endpoint
src/app/api/health/route.ts  # Enhanced with all checks
```

---

## **🎨 UI COMPONENTS - REMOVAL TARGETS**

### **Gallery Components**
```typescript
// ❌ DELETE THESE FILES
src/components/gallery/GalleryManager.tsx  # 405 lines - over-engineered
src/components/gallery/EnhancedImageCard.tsx  # Premium gallery card
src/components/gallery/FilterPanel.tsx  # Complex filtering system

// ✅ KEEP
src/components/gallery/SimplifiedGallery.tsx  # 348 lines - clean
```

### **Loading Components**
```typescript
// ❌ DELETE SPECIALIZED VARIANTS (Find exact locations)
- GenerationLoading (Lines 269-283 in OptimizedLoading.tsx)
- UploadLoading (Lines 285-289 in OptimizedLoading.tsx)  
- InlineLoading (Find location)

// ✅ KEEP
src/components/ui/OptimizedLoading.tsx  # Main component only
```

### **Error Components**
```typescript
// ❌ DELETE THESE FILES
src/components/ui/FormErrorHandling.tsx  # Form-specific errors
// Find and delete: ApiError, NetworkError, GenerationError components

// ✅ KEEP  
src/components/ui/OptimizedErrorBoundary.tsx  # 467 lines - comprehensive
```

### **Card Components**
```typescript
// ❌ DELETE THESE FILES
src/components/ui/glass.tsx  # GlassCard implementation
src/components/ui/premium-glass.tsx  # PremiumCard implementation

// ✅ KEEP
src/components/ui/UnifiedCard.tsx  # Main card system
```

---

## **⚙️ CONFIGURATION - REMOVAL TARGETS**

### **Environment Configuration**
```typescript
// ❌ REMOVE AUTH SECTIONS FROM THESE FILES
src/lib/api/config.ts  # Lines 187-192 (ENVIRONMENT section)
src/components/generator-v2/lib/config.ts  # Lines 1-17 (ENV section)
src/lib/config/production-validator.ts  # getEnvironmentConfig function

// ✅ KEEP (SIMPLIFIED)
src/lib/config/environment.ts  # Single source of truth
```

### **API Configuration**
```typescript
// ❌ REMOVE DUPLICATE API CONFIGS
src/components/generator-v2/lib/config.ts  # Lines 18-50 (API_CONFIG)
src/lib/replicate/config.ts  # Lines 238-243 (API_ENDPOINTS)

// ✅ KEEP (CONSOLIDATED)
src/lib/api/config.ts  # Single API configuration
```

### **Generator Configuration**
```typescript
// ❌ REMOVE DUPLICATE GENERATOR CONFIGS
src/components/generator-v2/lib/config.ts  # Lines 51-156 (GENERATION_CONFIG)
src/lib/api/config.ts  # Lines 79-158 (DEFAULT_GENERATION_SETTINGS)

// ✅ KEEP (SIMPLIFIED)
src/lib/config/generator.ts  # Single generator configuration
```

---

## **🧭 NAVIGATION - REMOVAL TARGETS**

### **Link Components**
```typescript
// ❌ DELETE THIS FILE
src/components/navigation/OptimizedLink.tsx  # Redundant with InstantLink

// ✅ KEEP
src/components/navigation/InstantLink.tsx  # Unified link system
```

### **Preloading Systems**
```typescript
// ❌ FIND AND REMOVE DUPLICATE PRELOADING LOGIC
// Search for: "preload", "prefetch" in navigation components
// Consolidate into single preloading system

// ✅ KEEP
// Single preloading system with InstantLink
```

---

## **🗂️ FILES TO DELETE COMPLETELY**

### **Backup/Unused Files**
```bash
# DELETE THESE FILES
src/lib/middleware/auth.ts.backup  # Unused backup middleware
src/app/api/enhance-prompt/  # Entire directory (legacy)
src/app/api/auth-status/  # Entire directory (non-functional)

# FIND AND DELETE
# Search for files with ".backup", ".old", ".unused" extensions
# Search for commented-out imports or unused components
```

### **Over-Engineered Systems**
```bash
# EVALUATE FOR DELETION (if unused)
src/app/api/cost-tracking/  # 6 endpoints - may be unused
src/app/api/prompts/  # 6 endpoints - over-engineered  
src/app/api/user/  # 4 endpoints - duplicates Supabase Auth
```

---

## **📋 VERIFICATION COMMANDS**

### **After Each Consolidation Step**
```bash
# Test API endpoints
curl http://localhost:4000/api/gallery  # Should return 401
curl http://localhost:4000/api/auth-check  # Should return status
curl http://localhost:4000/api/generate-v2  # Should return health

# Check for remaining duplicates
grep -r "getAuthenticatedUser" src/app/api/  # Should only find imports
grep -r "GOOGLE_GEMINI_API_KEY" .  # Should find no results
grep -r "NEXT_PUBLIC_REPLICATE_API_TOKEN" .  # Should find no results

# Verify no client-side API key exposure
grep -r "REPLICATE_API_TOKEN" src/components/  # Should find no results
grep -r "GEMINI_API_KEY" src/components/  # Should find no results
```

### **Build & Test Commands**
```bash
npm run build  # Should complete without errors
npm run dev  # Should start without warnings
npm run test  # Should pass all tests (if any)
```

---

## **🎯 SUCCESS CRITERIA**

### **Environment Variables**
- [ ] ✅ Only 2 API keys in .env.local (GEMINI_API_KEY, REPLICATE_API_TOKEN)
- [ ] ✅ No client-side API key exposure
- [ ] ✅ All API endpoints still functional

### **Authentication System**
- [ ] ✅ Single getAuthenticatedUser() function in use
- [ ] ✅ All API endpoints use unified auth helper
- [ ] ✅ All endpoints return proper 401 responses
- [ ] ✅ No duplicate Supabase client creation

### **File Reduction**
- [ ] ✅ 10+ redundant files deleted
- [ ] ✅ 2,000+ lines of code removed
- [ ] ✅ No broken imports or references
- [ ] ✅ Build completes successfully

**Ready to Begin**: Authentication System Consolidation (Task 5)
