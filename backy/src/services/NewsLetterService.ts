import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { NewsLetterRepository } from '../repositories/NewsLetterRepository';
import { INewsletter, SubscribeToNewsletterData } from '../models/newsletter';

@injectable()
export class NewsLetterService {
  constructor(
    @inject(TYPES.NewsLetterRepository) private repository: NewsLetterRepository
  ) {}
  sendOrganizationNewsletter = async (organizationSlug: string, newsletterData: {
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    segment?: 'all' | 'notified' | 'unnotified';
  }) => {
    return await this.repository.sendOrganizationNewsletter(
      organizationSlug,
      newsletterData
    )
  }

  subscribe = async (data: SubscribeToNewsletterData): Promise<INewsletter> =>{
    return await this.repository.subscribe(data)
  }

  findOrganizationByIdOrSlug = async (identifier: string) =>{
    return await this.findOrganizationByIdOrSlug(identifier)
  }

  // Unsubscribe from organization newsletter
  unsubscribe = async (email: string, organizationIdOrSlug: string): Promise<INewsletter | null> =>{
    return await this.repository.unsubscribe(email, organizationIdOrSlug)
  }

  // Get subscription status for specific organization
  getSubscription = async (email: string, organizationIdOrSlug: string): Promise<INewsletter | null> =>{
    return await this.getSubscription(email, organizationIdOrSlug)
  }

  // Update subscription preferences for specific organization
  updatePreferences = async (
    email: string,
    organizationIdOrSlug: string,
    preferences: Partial<INewsletter['preferences']>
  ): Promise<INewsletter | null> =>{
    return await this.repository.updatePreferences(email, organizationIdOrSlug, preferences)
  }

  // Get all active subscribers for an organization
  getActiveSubscribers = async (
    organizationIdOrSlug: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ subscribers: INewsletter[]; total: number }> =>{
    return await this.getActiveSubscribers(
      organizationIdOrSlug,
      page,
      limit
    )
  }

  isSubscribed = async (email: string, organizationIdOrSlug: string): Promise<boolean> =>{
    return await this.isSubscribed(
      email,
      organizationIdOrSlug
    )
  }
}