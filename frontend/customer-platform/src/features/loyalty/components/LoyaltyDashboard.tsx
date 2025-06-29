'use client';

import React, { useState, useEffect } from 'react';
import {
  StarIcon,
  GiftIcon,
  TagIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { customerApi } from '@/lib/api-client';

interface LoyaltyData {
  points_balance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_progress: {
    current_points: number;
    next_tier_points: number;
    points_needed: number;
  };
  lifetime_points: number;
  points_expiring: {
    amount: number;
    expiry_date: string;
  };
  available_rewards: Reward[];
  active_coupons: Coupon[];
  points_history: PointsTransaction[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  type: 'discount' | 'free_shipping' | 'product' | 'experience';
  value: string;
  image?: string;
  expires_at?: string;
  available: boolean;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount?: number;
  expires_at: string;
  used: boolean;
}

interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  date: string;
  order_id?: string;
}

export function LoyaltyDashboard() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'coupons' | 'history'>('rewards');
  const [redeeming, setRedeeming] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await customerApi.get('/loyalty/dashboard');
      
      if (response.success) {
        setLoyaltyData(response.data);
      } else {
        // Mock data for demonstration
        const mockData: LoyaltyData = {
          points_balance: 2450,
          tier: 'gold',
          tier_progress: {
            current_points: 2450,
            next_tier_points: 5000,
            points_needed: 2550,
          },
          lifetime_points: 8750,
          points_expiring: {
            amount: 150,
            expiry_date: '2024-12-31',
          },
          available_rewards: [
            {
              id: '1',
              name: '10% Off Next Order',
              description: 'Get 10% discount on your next purchase',
              points_required: 500,
              type: 'discount',
              value: '10%',
              available: true,
            },
            {
              id: '2',
              name: 'Free Shipping',
              description: 'Free shipping on any order',
              points_required: 300,
              type: 'free_shipping',
              value: 'Free',
              available: true,
            },
            {
              id: '3',
              name: '$25 Gift Card',
              description: 'Redeem for a $25 gift card',
              points_required: 2500,
              type: 'product',
              value: '$25',
              available: true,
            },
            {
              id: '4',
              name: 'Premium Headphones',
              description: 'Wireless premium headphones',
              points_required: 5000,
              type: 'product',
              value: '$199',
              available: false,
            },
          ],
          active_coupons: [
            {
              id: '1',
              code: 'LOYALTY10',
              name: '10% Off Coupon',
              description: 'Get 10% off your next order',
              discount_type: 'percentage',
              discount_value: 10,
              expires_at: '2024-12-31',
              used: false,
            },
            {
              id: '2',
              code: 'FREESHIP',
              name: 'Free Shipping',
              description: 'Free shipping on orders over $50',
              discount_type: 'fixed_amount',
              discount_value: 0,
              min_order_amount: 50,
              expires_at: '2024-11-30',
              used: false,
            },
          ],
          points_history: [
            {
              id: '1',
              type: 'earned',
              points: 125,
              description: 'Order #12345 - Purchase reward',
              date: '2024-10-15',
              order_id: '12345',
            },
            {
              id: '2',
              type: 'redeemed',
              points: -500,
              description: 'Redeemed 10% off coupon',
              date: '2024-10-10',
            },
            {
              id: '3',
              type: 'earned',
              points: 200,
              description: 'Product review bonus',
              date: '2024-10-05',
            },
          ],
        };
        setLoyaltyData(mockData);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Loyalty data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    setRedeeming(prev => new Set(prev).add(rewardId));
    
    try {
      const response = await customerApi.post(`/loyalty/rewards/${rewardId}/redeem`);
      
      if (response.success) {
        // Refresh loyalty data
        await loadLoyaltyData();
        // Show success message
      } else {
        throw new Error('Failed to redeem reward');
      }
    } catch (err: any) {
      console.error('Redeem reward error:', err);
    } finally {
      setRedeeming(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }
  };

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: { name: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '🥉' },
      silver: { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🥈' },
      gold: { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🥇' },
      platinum: { name: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '💎' },
    };
    return tiers[tier as keyof typeof tiers] || tiers.bronze;
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return TagIcon;
      case 'free_shipping':
        return GiftIcon;
      case 'product':
        return SparklesIcon;
      case 'experience':
        return StarIcon;
      default:
        return GiftIcon;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800 font-medium">Error loading loyalty data</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = getTierInfo(loyaltyData.tier);
  const progressPercentage = (loyaltyData.tier_progress.current_points / loyaltyData.tier_progress.next_tier_points) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
          <p className="text-gray-600">Earn points, unlock rewards, and enjoy exclusive benefits</p>
        </div>

        {/* Points Balance & Tier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Points Balance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <StarSolidIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {loyaltyData.points_balance.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Available Points</div>
              </div>
            </div>
            
            {loyaltyData.points_expiring.amount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    {loyaltyData.points_expiring.amount} points expiring on{' '}
                    {new Date(loyaltyData.points_expiring.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Current Tier */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${tierInfo.bgColor}`}>
                <span className="text-2xl">{tierInfo.icon}</span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${tierInfo.color}`}>
                  {tierInfo.name}
                </div>
                <div className="text-sm text-gray-500">Current Tier</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress to next tier</span>
                <span className="text-gray-900">
                  {loyaltyData.tier_progress.points_needed} points needed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Lifetime Points */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {loyaltyData.lifetime_points.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Lifetime Points</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Total points earned since joining
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'rewards', label: 'Available Rewards', count: loyaltyData.available_rewards.filter(r => r.available).length },
                { key: 'coupons', label: 'My Coupons', count: loyaltyData.active_coupons.filter(c => !c.used).length },
                { key: 'history', label: 'Points History', count: loyaltyData.points_history.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loyaltyData.available_rewards.map((reward) => {
                  const RewardIcon = getRewardIcon(reward.type);
                  const canRedeem = loyaltyData.points_balance >= reward.points_required && reward.available;
                  
                  return (
                    <div
                      key={reward.id}
                      className={`border rounded-lg p-6 ${
                        canRedeem ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${canRedeem ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <RewardIcon className={`h-6 w-6 ${canRedeem ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${canRedeem ? 'text-blue-900' : 'text-gray-500'}`}>
                            {reward.points_required.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>
                      
                      <h3 className={`font-semibold mb-2 ${canRedeem ? 'text-gray-900' : 'text-gray-500'}`}>
                        {reward.name}
                      </h3>
                      <p className={`text-sm mb-4 ${canRedeem ? 'text-gray-600' : 'text-gray-400'}`}>
                        {reward.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${canRedeem ? 'text-green-600' : 'text-gray-400'}`}>
                          Value: {reward.value}
                        </span>
                        
                        <button
                          onClick={() => redeemReward(reward.id)}
                          disabled={!canRedeem || redeeming.has(reward.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            canRedeem
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {redeeming.has(reward.id) ? 'Redeeming...' : 'Redeem'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                {loyaltyData.active_coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`border rounded-lg p-6 ${
                      coupon.used ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-semibold ${coupon.used ? 'text-gray-500' : 'text-gray-900'}`}>
                            {coupon.name}
                          </h3>
                          {coupon.used && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                              Used
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${coupon.used ? 'text-gray-400' : 'text-gray-600'}`}>
                          {coupon.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`font-mono bg-white px-3 py-1 rounded border ${
                            coupon.used ? 'text-gray-400 border-gray-200' : 'text-gray-900 border-gray-300'
                          }`}>
                            {coupon.code}
                          </span>
                          <span className={coupon.used ? 'text-gray-400' : 'text-gray-600'}>
                            Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {!coupon.used && (
                        <button className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                          Use Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {loyaltyData.points_history.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'earned' ? 'bg-green-100' :
                        transaction.type === 'redeemed' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'earned' ? (
                          <StarSolidIcon className="h-4 w-4 text-green-600" />
                        ) : transaction.type === 'redeemed' ? (
                          <GiftIcon className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`text-lg font-bold ${
                      transaction.type === 'earned' ? 'text-green-600' :
                      transaction.type === 'redeemed' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : ''}{transaction.points.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How to Earn Points */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🛒', title: 'Make Purchases', description: 'Earn 1 point for every $1 spent' },
              { icon: '⭐', title: 'Write Reviews', description: 'Get 50 points for each product review' },
              { icon: '👥', title: 'Refer Friends', description: 'Earn 500 points for each successful referral' },
              { icon: '🎂', title: 'Birthday Bonus', description: 'Receive 200 bonus points on your birthday' },
            ].map((item, index) => (
              <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
