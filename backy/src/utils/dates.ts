
/**
* Helper method to calculate date filter
*/
export const getDateFilter = (timeRange: string): any => {
    const now = new Date();

    switch (timeRange) {
        case 'today':
            return { createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { createdAt: { $gte: weekAgo } };
        case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return { createdAt: { $gte: monthAgo } };
        case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return { createdAt: { $gte: yearAgo } };
        default:
            return {};
    }
}