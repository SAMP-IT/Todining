// Barrel for the data-service layer. Components import from here, never from the
// store directly — so the entire app can be repointed at Supabase by swapping
// these implementations for ones with identical signatures.
export { restaurantService } from './restaurantService';
export { menuService } from './menuService';
export { orderService } from './orderService';
export { tableService } from './tableService';
export { serviceRequestService, SERVICE_REQUEST_LABELS } from './serviceRequestService';
export { reservationService } from './reservationService';
export type { ReservationInput } from './reservationService';
export { billingService } from './billingService';
export { feedbackService } from './feedbackService';
export type { FeedbackInput } from './feedbackService';
export { inventoryService } from './inventoryService';
export { notificationService } from './notificationService';
export { upsellService } from './upsellService';
export type { UpsellSuggestion } from './upsellService';
export { staffService } from './staffService';
export { analyticsService } from './analyticsService';
