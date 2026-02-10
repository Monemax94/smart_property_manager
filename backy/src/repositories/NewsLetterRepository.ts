import { injectable } from 'inversify';
import { OrganizationModel, WaitlistModel } from '../models/waitlist';
import Newsletter, { INewsletter, SubscribeToNewsletterData } from '../models/newsletter';
import sendMail from '../utils/mailer';
import { EmailTemplateType, EmailTemplateModel } from '../models/email.template';
import { Types } from 'mongoose';
import { sendNewsletterSubscriptionEmail } from "../utils/mailer"



@injectable()
export class NewsLetterRepository {
  sendOrganizationNewsletter = async (organizationSlug: string, newsletterData: {
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    segment?: 'all' | 'notified' | 'unnotified';
  }) => {
    // Get the organization
    const organization = await OrganizationModel.findOne({ slug: organizationSlug });
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get or create the newsletter template
    let template = await EmailTemplateModel.findOne({
      organization: organization._id,
      templateType: EmailTemplateType.NEWSLETTER,
      isActive: true
    });

    if (!template) {
      // Create a new template if none exists
      template = await EmailTemplateModel.create({
        organization: organization._id,
        templateType: EmailTemplateType.NEWSLETTER,
        subject: newsletterData.subject || `${organization.displayName} Newsletter`,
        htmlContent: newsletterData.htmlContent || '',
        textContent: newsletterData.textContent,
        isActive: true
      });
    } else {
      // Update template if new content is provided
      if (newsletterData.subject || newsletterData.htmlContent || newsletterData.textContent) {
        template = await EmailTemplateModel.findByIdAndUpdate(
          template._id,
          {
            $set: {
              subject: newsletterData.subject || template.subject,
              htmlContent: newsletterData.htmlContent || template.htmlContent,
              textContent: newsletterData.textContent ?? template.textContent
            }
          },
          { new: true }
        );
      }
    }

    // 3. Get waitlist members based on segment
    const query: any = { organization: organization._id };

    if (newsletterData.segment === 'notified') {
      query.notifiedAt = { $exists: true };
    } else if (newsletterData.segment === 'unnotified') {
      query.notifiedAt = { $exists: false };
    }

    const waitlistMembers = await WaitlistModel.find(query);

    // 4. Send emails
    const results = await Promise.allSettled(
      waitlistMembers.map(async (member) => {
        try {
          const htmlContent = this.replaceTemplateVariables(
            template.htmlContent,
            member,
            organization
          );

          const textContent = template.textContent
            ? this.replaceTemplateVariables(
              template.textContent,
              member,
              organization
            )
            : undefined;

          await sendMail(
            member.email,
            template.subject,
            htmlContent,
            textContent
          );

          return {
            email: member.email,
            status: 'success'
          };
        } catch (error) {
          return {
            email: member.email,
            status: 'failed',
            error: error.message
          };
        }
      })
    );

    // 5. Return summary
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failedCount = results.length - successCount;

    return {
      total: results.length,
      success: successCount,
      failed: failedCount,
      failedEmails: results
        .filter(r => r.status === 'fulfilled' && r.value.status === 'failed')
        .map(r => (r as PromiseFulfilledResult<any>).value)
    };
  }

  private replaceTemplateVariables(
    content: string,
    member: any,
    organization: any
  ): string {
    return content
      .replace(/{{name}}/g, member.name)
      .replace(/{{email}}/g, member.email)
      .replace(/{{organization}}/g, organization.displayName)
      .replace(/{{joinedDate}}/g, member.joinedAt.toLocaleDateString())
      .replace(/{{organizationSlug}}/g, organization.slug);
  }


  subscribe = async (data: SubscribeToNewsletterData): Promise<INewsletter> =>{
    const { email, userId, organization: organizationIdOrSlug, preferences } = data;

    // Find organization by ID or slug using helper method
    const organization = await this.findOrganizationByIdOrSlug(organizationIdOrSlug);

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if already subscribed to this organization's newsletter
    const existingSubscription = await Newsletter.findOne({
      email,
      organization: organization._id
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        throw new Error('Email is already subscribed to this organization\'s newsletter');
      }

      // Reactivate existing subscription
      const updatedSubscription = await Newsletter.findByIdAndUpdate(
        existingSubscription._id,
        {
          isActive: true,
          unsubscribedAt: null,
          userId: userId ? new Types.ObjectId(userId) : existingSubscription.userId,
          preferences: {
            productUpdates: preferences?.productUpdates ?? existingSubscription.preferences?.productUpdates ?? true,
            promotions: preferences?.promotions ?? existingSubscription.preferences?.promotions ?? true,
            news: preferences?.news ?? existingSubscription.preferences?.news ?? true,
            events: preferences?.events ?? existingSubscription.preferences?.events ?? false
          }
        },
        { new: true }
      ).populate('organization');

      // Send welcome back email
      await sendNewsletterSubscriptionEmail(
        email,
        updatedSubscription!.preferences!,
        organization.displayName
      );

      return updatedSubscription!;
    }

    // Create new subscription
    const newSubscription = await Newsletter.create({
      email: email.toLowerCase().trim(),
      userId: userId ? new Types.ObjectId(userId) : undefined,
      organization: organization._id,
      preferences: {
        productUpdates: preferences?.productUpdates ?? true,
        promotions: preferences?.promotions ?? true,
        news: preferences?.news ?? true,
        events: preferences?.events ?? false
      }
    });

    // Populate organization for email
    const populatedSubscription = await newSubscription.populate('organization');

    // Send welcome email
    await sendNewsletterSubscriptionEmail(
      email,
      newSubscription.preferences!,
      organization.displayName
    );

    return populatedSubscription;
  }

  findOrganizationByIdOrSlug = async (identifier: string) =>{
    const query = Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { slug: identifier };

    return await OrganizationModel.findOne(query);
  }

  // Unsubscribe from organization newsletter
  unsubscribe = async (email: string, organizationIdOrSlug: string): Promise<INewsletter | null> =>{
    // Find organization by ID or slug using helper method
    const organization = await this.findOrganizationByIdOrSlug(organizationIdOrSlug);

    if (!organization) {
      throw new Error('Organization not found');
    }

    return await Newsletter.findOneAndUpdate(
      {
        email: email.toLowerCase().trim(),
        organization: organization._id
      },
      {
        isActive: false,
        unsubscribedAt: new Date()
      },
      { new: true }
    );
  }

  // Get subscription status for specific organization
  getSubscription = async (email: string, organizationIdOrSlug: string): Promise<INewsletter | null> =>{
  // Find organization by ID or slug using helper method
  const organization = await this.findOrganizationByIdOrSlug(organizationIdOrSlug);

  console.log(organization)
  if (!organization) {
    throw new Error('Organization not found');
  }


    return await Newsletter.findOne({
      email,
      organization: organization._id
    });
  }

  // Update subscription preferences for specific organization
  updatePreferences = async (
    email: string,
    organizationIdOrSlug: string,
    preferences: Partial<INewsletter['preferences']>
  ): Promise<INewsletter | null> =>{
    const organization = await this.findOrganizationByIdOrSlug(organizationIdOrSlug);

    if (!organization) {
      throw new Error('Organization not found');
    }

    return await Newsletter.findOneAndUpdate(
      {
        email: email.toLowerCase().trim(),
        organization: organization._id
      },
      { preferences },
      { new: true }
    );
  }

  // Get all active subscribers for an organization
  async getActiveSubscribers(
    organizationIdOrSlug: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ subscribers: INewsletter[]; total: number }> {
    const organization = await this.findOrganizationByIdOrSlug(organizationIdOrSlug);

    if (!organization) {
      throw new Error('Organization not found');
    }

    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      Newsletter.find({
        organization: organization._id,
        isActive: true
      })
        .populate('organization')
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit),
      Newsletter.countDocuments({
        organization: organization._id,
        isActive: true
      })
    ]);

    return { subscribers, total };
  }

  // Check if user is subscribed to a specific organization
  async isSubscribed(email: string, organizationIdOrSlug: string): Promise<boolean> {
    const organization = await OrganizationModel.findOne({
      $or: [
        { _id: organizationIdOrSlug },
        { slug: organizationIdOrSlug }
      ]
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const subscription = await Newsletter.findOne({
      email: email.toLowerCase().trim(),
      organization: organization._id,
      isActive: true
    });

    return !!subscription;
  }
}