'use client';

import React, { useEffect, useState } from 'react';
import { Store, Users, Activity } from 'lucide-react';

interface PlatformMetrics {
    totalShops: number;
    activeShops: number;
    totalUsers: number;
}

export default function NovixDashboard() {
    const [metrics, setMetrics] = useState<PlatformMetrics>({
        totalShops: 0,
        activeShops: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/novix/metrics');
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-gray-600 mt-2">Monitor your SaaS platform metrics</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Shops */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Shops</p>
                            {loading ? (
                                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                            ) : (
                                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalShops}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Store className="text-white" size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Total registered shops</p>
                </div>

                {/* Active Shops */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Shops</p>
                            {loading ? (
                                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                            ) : (
                                <p className="text-3xl font-bold text-green-600 mt-2">{metrics.activeShops}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Activity className="text-white" size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Currently active shops</p>
                </div>

                {/* Total Users */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            {loading ? (
                                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                            ) : (
                                <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.totalUsers.toLocaleString()}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="text-white" size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Users across all shops</p>
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Suspended Shops</span>
                        {loading ? (
                            <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <span className="text-sm font-semibold text-red-600">
                                {metrics.totalShops - metrics.activeShops}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Active Rate</span>
                        {loading ? (
                            <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <span className="text-sm font-semibold text-green-600">
                                {metrics.totalShops > 0
                                    ? ((metrics.activeShops / metrics.totalShops) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Avg Users per Shop</span>
                        {loading ? (
                            <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <span className="text-sm font-semibold text-blue-600">
                                {metrics.totalShops > 0
                                    ? Math.round(metrics.totalUsers / metrics.totalShops)
                                    : 0}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
