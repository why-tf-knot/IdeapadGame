/**
 * Analytics Service for tracking user events and errors
 * 
 * This service provides a unified interface for:
 * - Event tracking (user actions, screen views)
 * - Error tracking and reporting
 * - Custom metrics
 * 
 * Can be integrated with services like:
 * - Sentry (error tracking)
 * - Mixpanel/Amplitude (analytics)
 * - Google Analytics
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

interface ErrorContext {
  userId?: string;
  route?: string;
  additionalInfo?: Record<string, any>;
}

class AnalyticsService {
  private isProduction: boolean;
  private userId: string | null = null;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Set the current user ID for all subsequent events
   */
  setUserId(userId: string): void {
    this.userId = userId;
    console.log(`[Analytics] User identified: ${userId}`);
  }

  /**
   * Clear the current user ID (e.g., on logout)
   */
  clearUserId(): void {
    console.log(`[Analytics] User cleared: ${this.userId}`);
    this.userId = null;
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    const eventData = {
      ...event,
      userId: event.userId || this.userId,
      timestamp: event.timestamp || new Date(),
      environment: process.env.NODE_ENV,
    };

    if (this.isProduction) {
      // TODO: Send to analytics service (Mixpanel, Amplitude, etc.)
      // Example: mixpanel.track(eventData.name, eventData.properties);
    }

    console.log(`[Analytics] Event: ${eventData.name}`, eventData.properties);
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: ErrorContext): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: context?.userId || this.userId,
      route: context?.route,
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
      ...context?.additionalInfo,
    };

    if (this.isProduction) {
      // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
      // Example: Sentry.captureException(error, { contexts: errorData });
    }

    console.error(`[Analytics] Error:`, errorData);
  }

  /**
   * Track API errors with response details
   */
  trackApiError(
    error: any,
    endpoint: string,
    method: string,
    userId?: string
  ): void {
    const errorData = {
      endpoint,
      method,
      statusCode: error.response?.status,
      message: error.message,
      userId: userId || this.userId,
    };

    this.trackEvent({
      name: 'api_error',
      properties: errorData,
    });

    console.error(`[Analytics] API Error: ${method} ${endpoint}`, errorData);
  }

  // ====================
  // Pre-defined Events
  // ====================

  /**
   * User Events
   */
  trackUserRegistered(userId: string, role: 'FOUNDER' | 'INVESTOR'): void {
    this.trackEvent({
      name: 'user_registered',
      properties: { role },
      userId,
    });
  }

  trackUserLogin(userId: string, role: 'FOUNDER' | 'INVESTOR'): void {
    this.trackEvent({
      name: 'user_login',
      properties: { role },
      userId,
    });
  }

  /**
   * Idea Events (Founders)
   */
  trackIdeaCreated(ideaId: string, category: string, stage: string): void {
    this.trackEvent({
      name: 'idea_created',
      properties: { ideaId, category, stage },
    });
  }

  trackIdeaUpdated(ideaId: string): void {
    this.trackEvent({
      name: 'idea_updated',
      properties: { ideaId },
    });
  }

  /**
   * Review Events (Investors)
   */
  trackIdeaReviewed(ideaId: string, action: 'saved' | 'rejected'): void {
    this.trackEvent({
      name: 'idea_reviewed',
      properties: { ideaId, action },
    });
  }

  trackPaperToss(
    ideaId: string,
    action: 'reject' | 'save',
    gestureType: 'swipe_down' | 'swipe_right'
  ): void {
    this.trackEvent({
      name: 'paper_toss',
      properties: { ideaId, action, gestureType },
    });
  }

  /**
   * Credit Events
   */
  trackCreditsAllocated(
    ideaId: string,
    amount: number,
    investorId: string
  ): void {
    this.trackEvent({
      name: 'credits_allocated',
      properties: { ideaId, amount },
      userId: investorId,
    });
  }

  trackCreditsSpent(
    ideaId: string,
    amount: number,
    service: string,
    cached: boolean = false
  ): void {
    this.trackEvent({
      name: 'credits_spent',
      properties: { ideaId, amount, service, cached },
    });
  }

  /**
   * AI Tool Events
   */
  trackAiToolUsed(
    ideaId: string,
    service: string,
    cost: number,
    cached: boolean = false
  ): void {
    this.trackEvent({
      name: 'ai_tool_used',
      properties: { ideaId, service, cost, cached },
    });
  }

  /**
   * Performance Metrics
   */
  trackApiResponseTime(endpoint: string, method: string, duration: number): void {
    this.trackEvent({
      name: 'api_response_time',
      properties: { endpoint, method, duration },
    });
  }

  trackCacheHit(service: string, ideaId: string): void {
    this.trackEvent({
      name: 'cache_hit',
      properties: { service, ideaId },
    });
  }

  trackCacheMiss(service: string, ideaId: string): void {
    this.trackEvent({
      name: 'cache_miss',
      properties: { service, ideaId },
    });
  }

  /**
   * Get analytics summary (for admin/debugging)
   */
  getSummary(): Record<string, any> {
    return {
      service: 'AnalyticsService',
      environment: process.env.NODE_ENV,
      currentUser: this.userId,
      isProduction: this.isProduction,
    };
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
