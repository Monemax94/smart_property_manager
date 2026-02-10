import { inject, injectable } from 'inversify';
import { AnalyticsDashboardDTO, IAnalyticsRepository, MetricDTO, RevenueOverTimeDTO, TopVendorDTO } from '../repositories/AnalyticsRepository';
import { TYPES } from '../config/types';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { IVendorRepository } from '../interfaces/IVendorRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { OrderRepository } from '../repositories/OrderRepository';


export interface IAnalyticsService {
  getDashboardAnalytics(timeRange: string): Promise<AnalyticsDashboardDTO>;
}

@injectable()
export class AnalyticsService implements IAnalyticsService {
  constructor(
    @inject(TYPES.AnalyticsRepository) private analyticsRepository: IAnalyticsRepository,
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.OrderRepository) private orderRepo: OrderRepository,
    @inject(TYPES.VendorRepository) private vendorRepo: IVendorRepository
  ) { }

  private async getPreviousPeriodData(
    currentStart: Date,
    currentEnd: Date,
    metricFunction: (start: Date, end: Date) => Promise<number>
  ): Promise<{ current: number; previous: number }> {
    const current = await metricFunction(currentStart, currentEnd);
    const periodDiff = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodDiff);
    const previousEnd = new Date(currentEnd.getTime() - periodDiff);
    const previous = await metricFunction(previousStart, previousEnd);
    return { current, previous };
  }

  private calculateChange(current: number, previous: number): MetricDTO {
    if (previous === 0) {
      return {
        value: current,
        change: 0,
        changeType: 'increase'
      };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      value: current,
      change: Math.abs(change),
      changeType: current >= previous ? 'increase' : 'decrease'
    };
  }

  async getDashboardAnalytics(timeRange: string = 'month'): Promise<AnalyticsDashboardDTO> {
    let startDate: Date;
    let endDate: Date = new Date();

    switch (timeRange) {
      case 'day':
        startDate = startOfDay(endDate);
        endDate = endOfDay(endDate);
        break;
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
      default:
        startDate = subMonths(endDate, 1);
        break;
    }

    // Get current and previous period data for metrics
    const [
      revenueData,
      salesData,
      ordersData,
      vendorsData,
      buyersData,
      commissionData
    ] = await Promise.all([
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getTotalRevenue.bind(this.analyticsRepository)),
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getTotalSales.bind(this.analyticsRepository)),
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getTotalOrders.bind(this.analyticsRepository)),
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getActiveVendorsCount.bind(this.analyticsRepository)),
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getActiveBuyersCount.bind(this.analyticsRepository)),
      this.getPreviousPeriodData(startDate, endDate, this.analyticsRepository.getCommissionRevenue.bind(this.analyticsRepository))
    ]);

    // Get other data
    const [pendingVerifications, revenueOverTime, topVendors] = await Promise.all([
      this.vendorRepo.getPendingVerificationsCount(),
      // this.analyticsRepository.getRevenueOverTime(startDate, endDate, 'day'),
      this.analyticsRepository.getRevenueOverTime(startDate, endDate, timeRange),
      this.analyticsRepository.getTopVendors(5)
    ]);

    // Calculate yesterday's pending verifications for change percentage
    const yesterdayPending = await this.vendorRepo.getPendingVerificationsCount();
    const todayPending = pendingVerifications;
    const pendingChange = ((todayPending - yesterdayPending) / (yesterdayPending || 1)) * 100;

    return {
      totalRevenue: this.calculateChange(revenueData.current, revenueData.previous),
      totalSales: this.calculateChange(salesData.current, salesData.previous),
      totalOrders: this.calculateChange(ordersData.current, ordersData.previous),
      activeVendors: this.calculateChange(vendorsData.current, vendorsData.previous),
      activeBuyers: this.calculateChange(buyersData.current, buyersData.previous),
      commissionRevenue: this.calculateChange(commissionData.current, commissionData.previous),
      pendingVerifications: {
        value: pendingVerifications,
        change: Math.abs(pendingChange),
        changeType: pendingChange >= 0 ? 'increase' : 'decrease'
      },
      // revenueOverTime: revenueOverTime,
      revenueOverTime: this.formatRevenueOverTime(revenueOverTime, timeRange),

      topVendors: topVendors.map((vendor) => ({
        name: vendor.vendor.storeName,
        category: 'General'
      }))
    };
  }

  private formatRevenueOverTime(raw: Array<{ date: Date; amount: number }>, timeRange: string) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  
    switch (timeRange) {
  
      case "day": // return weekly format (Mon, Tue...)
        return raw.map(item => ({
          date: days[new Date(item.date).getDay()],
          amount: item.amount
        }));
  
      case "week": // return monthly format (Week 1, Week 2...)
        return raw.map((item, index) => ({
          date: `Week ${index + 1}`,
          amount: item.amount
        }));
  
      case "month": // return yearly format (Jan, Feb...)
        return raw.map(item => ({
          date: months[new Date(item.date).getMonth()],
          amount: item.amount
        }));
  
      default:
        return raw;
    }
  }
  

  async getCustomerGrowth() {
    const currentYear = new Date().getFullYear();

    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const returning = await this.userRepo.countReturningBuyersByMonth(currentYear, month);
      const newly = await this.userRepo.countNewBuyersByMonth(currentYear, month);

      monthlyData.push({
        month,
        returning,
        new: newly
      });
    }

    return monthlyData;
  }

  async getVendorGrowth() {
    const currentYear = new Date().getFullYear();

    const monthlyVendors = [];

    for (let month = 0; month < 12; month++) {
      const newVendors = await this.userRepo.countNewVendorsByMonth(currentYear, month);
      monthlyVendors.push({ month, newVendors });
    }

    return monthlyVendors;
  }

  async getDemographics() {
    return {
      america: await this.userRepo.countCustomersByRegion(["USA", "Canada", "Mexico", "Brazil"]),
      europe: await this.userRepo.countCustomersByRegion(["UK", "Germany", "France", "Italy", "Spain"]),
      africa: await this.userRepo.countCustomersByRegion(["Nigeria", "Kenya", "South Africa", "Egypt"]),
      other: await this.userRepo.countCustomersByRegion([])
    };
  }

  async getDeviceUsage() {
    const result = await this.userRepo.countDeviceUsage();
    const summary = {
      mobile: 0,
      laptop: 0,
      tablet: 0,
      other: 0
    };

    for (const r of result) {
      const ua = r._id || "other";
      if (ua.includes("iPhone") || ua.includes("Android")) summary.mobile += r.count;
      else if (ua.includes("Windows") || ua.includes("Macintosh")) summary.laptop += r.count;
      else if (ua.includes("iPad") || ua.includes("Tablet")) summary.tablet += r.count;
      else summary.other += r.count;
    }

    return summary;
  }

  async getOnlineSessions() {
    return await this.userRepo.getActiveSessions();
  }

  async getCustomerAnalytics() {
    const [
      growth,
      vendors,
      demographics,
      devices,
      online,
      topBuyers,
      topVendors
    ] = await Promise.all([
      this.getCustomerGrowth(),
      this.getVendorGrowth(),
      this.getDemographics(),
      this.getDeviceUsage(),
      this.getOnlineSessions(),
      this.orderRepo.getTopBuyers(),
      this.orderRepo.getTopVendors()
    ]);

    return {
      customerGrowth: growth,
      vendorGrowth: vendors,
      demographics,
      devices,
      onlineUsers: online,
      topBuyers,
      topVendors
    };
  }
}