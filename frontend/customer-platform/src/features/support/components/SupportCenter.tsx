'use client';

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { customerApi } from '@/lib/api-client';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  views: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  category: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
  response_time: {
    email: string;
    chat: string;
    phone: string;
  };
}

export function SupportCenter() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [chatOpen, setChatOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'orders', label: 'Orders & Shipping' },
    { value: 'returns', label: 'Returns & Refunds' },
    { value: 'account', label: 'Account & Profile' },
    { value: 'payments', label: 'Payments & Billing' },
    { value: 'products', label: 'Products & Inventory' },
    { value: 'technical', label: 'Technical Support' },
  ];

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      
      const [faqResponse, ticketsResponse] = await Promise.allSettled([
        customerApi.get('/support/faq'),
        customerApi.get('/support/tickets'),
      ]);

      // Mock data for demonstration
      const mockFAQs: FAQ[] = [
        {
          id: '1',
          question: 'How can I track my order?',
          answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You\'ll find tracking information and delivery updates there.',
          category: 'orders',
          helpful_count: 245,
          views: 1250,
        },
        {
          id: '2',
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Some restrictions apply for certain product categories.',
          category: 'returns',
          helpful_count: 189,
          views: 890,
        },
        {
          id: '3',
          question: 'How do I change my password?',
          answer: 'To change your password, go to Account Settings > Security Settings. Click "Change Password" and follow the instructions.',
          category: 'account',
          helpful_count: 156,
          views: 678,
        },
        {
          id: '4',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.',
          category: 'payments',
          helpful_count: 203,
          views: 1100,
        },
        {
          id: '5',
          question: 'How long does shipping take?',
          answer: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. Free shipping is available on orders over $50.',
          category: 'orders',
          helpful_count: 312,
          views: 1580,
        },
      ];

      const mockTickets: SupportTicket[] = [
        {
          id: 'T001',
          subject: 'Issue with order delivery',
          status: 'in_progress',
          priority: 'medium',
          created_at: '2024-10-15T10:30:00Z',
          updated_at: '2024-10-16T14:20:00Z',
          category: 'orders',
        },
        {
          id: 'T002',
          subject: 'Refund request for damaged item',
          status: 'resolved',
          priority: 'high',
          created_at: '2024-10-10T09:15:00Z',
          updated_at: '2024-10-12T16:45:00Z',
          category: 'returns',
        },
      ];

      const mockContactInfo: ContactInfo = {
        phone: '+1-800-123-4567',
        email: 'support@ecommerce.com',
        hours: {
          weekdays: '9:00 AM - 8:00 PM EST',
          weekends: '10:00 AM - 6:00 PM EST',
        },
        response_time: {
          email: '24 hours',
          chat: '5 minutes',
          phone: 'Immediate',
        },
      };

      setFaqs(mockFAQs);
      setTickets(mockTickets);
      setContactInfo(mockContactInfo);

    } catch (err: any) {
      setError(err.message);
      console.error('Support data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const markFAQHelpful = async (faqId: string) => {
    try {
      await customerApi.post(`/support/faq/${faqId}/helpful`);
      setFaqs(prev => prev.map(faq => 
        faq.id === faqId 
          ? { ...faq, helpful_count: faq.helpful_count + 1 }
          : faq
      ));
    } catch (error) {
      console.error('Mark FAQ helpful failed:', error);
    }
  };

  const startLiveChat = () => {
    setChatOpen(true);
    // Initialize chat widget or redirect to chat service
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircleIcon },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        priorityColors[priority as keyof typeof priorityColors]
      }`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How can we help you?</h1>
          <p className="text-gray-600 mb-8">Find answers to common questions or get in touch with our support team</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={startLiveChat}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">Get instant help from our support team</p>
                <p className="text-xs text-green-600 mt-1">Average response: {contactInfo?.response_time.chat}</p>
              </div>
            </div>
          </button>

          <a
            href={`tel:${contactInfo?.phone}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <PhoneIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Call Us</h3>
                <p className="text-sm text-gray-600">{contactInfo?.phone}</p>
                <p className="text-xs text-gray-500 mt-1">{contactInfo?.hours.weekdays}</p>
              </div>
            </div>
          </a>

          <a
            href={`mailto:${contactInfo?.email}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-600">{contactInfo?.email}</p>
                <p className="text-xs text-gray-500 mt-1">Response within {contactInfo?.response_time.email}</p>
              </div>
            </div>
          </a>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'faq', label: 'FAQ', count: faqs.length },
                { key: 'tickets', label: 'My Tickets', count: tickets.length },
                { key: 'contact', label: 'Contact Info' },
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
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div>
                {/* Category Filter */}
                <div className="mb-6">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-4 border-t border-gray-200">
                          <div className="pt-4 text-gray-600 mb-4">{faq.answer}</div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{faq.views} views</span>
                              <span>{faq.helpful_count} found this helpful</span>
                            </div>
                            
                            <button
                              onClick={() => markFAQHelpful(faq.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Was this helpful?
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-12">
                    <QuestionMarkCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    Create New Ticket
                  </button>
                </div>

                {tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">#{ticket.id} - {ticket.subject}</h3>
                            <p className="text-sm text-gray-500">
                              Created {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Last updated: {new Date(ticket.updated_at).toLocaleDateString()}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                    <p className="text-gray-600 mb-4">You haven't created any support tickets yet</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                      Create Your First Ticket
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && contactInfo && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Phone Support</h3>
                        <p className="text-gray-600">{contactInfo.phone}</p>
                        <p className="text-sm text-gray-500">
                          Weekdays: {contactInfo.hours.weekdays}<br />
                          Weekends: {contactInfo.hours.weekends}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
                        <p className="text-gray-600">{contactInfo.email}</p>
                        <p className="text-sm text-gray-500">
                          Response time: {contactInfo.response_time.email}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Response Times</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Live Chat:</span>
                          <span className="text-gray-900">{contactInfo.response_time.chat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900">{contactInfo.response_time.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900">{contactInfo.response_time.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Social Media</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">Twitter: @ecommerce_support</p>
                        <p className="text-gray-600">Facebook: /ecommerce.support</p>
                        <p className="text-gray-600">Instagram: @ecommerce_help</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Community Forum</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Join our community forum to get help from other users and our team.
                      </p>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Visit Forum →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        )}
      </div>

      {/* Live Chat Widget (placeholder) */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <h3 className="font-medium">Live Chat Support</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
          <div className="p-4 h-full">
            <p className="text-gray-600 text-sm">
              Chat widget would be integrated here with your preferred live chat service.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
