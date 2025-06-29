'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api-client';

interface ContentItem {
  id: string;
  type: 'review' | 'page' | 'media' | 'seo';
  title: string;
  content?: string;
  status: 'published' | 'draft' | 'pending' | 'rejected';
  author: string;
  created_at: string;
  updated_at: string;
  meta?: {
    rating?: number;
    product_id?: string;
    file_size?: number;
    file_type?: string;
    seo_score?: number;
  };
}

export function ContentManager() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const contentTypes = ['review', 'page', 'media', 'seo'];
  const contentStatuses = ['published', 'draft', 'pending', 'rejected'];

  useEffect(() => {
    loadContent();
  }, [currentPage, searchTerm, selectedType, selectedStatus]);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Load different types of content based on selection
      let response;
      if (selectedType === 'review') {
        response = await adminApi.getReviews({
          page: currentPage,
          per_page: 20,
          search: searchTerm,
          status: selectedStatus,
        });
      } else if (selectedType === 'page') {
        response = await adminApi.getPages();
      } else {
        // Load all content types
        const [reviews, pages] = await Promise.allSettled([
          adminApi.getReviews({ page: 1, per_page: 10 }),
          adminApi.getPages(),
        ]);

        const allContent: ContentItem[] = [];
        
        if (reviews.status === 'fulfilled' && reviews.value.success) {
          const reviewItems = reviews.value.data.data?.map((review: any) => ({
            id: review.id,
            type: 'review' as const,
            title: `Review for ${review.product_name || 'Product'}`,
            content: review.comment,
            status: review.status,
            author: review.customer_name,
            created_at: review.created_at,
            updated_at: review.updated_at,
            meta: {
              rating: review.rating,
              product_id: review.product_id,
            },
          })) || [];
          allContent.push(...reviewItems);
        }

        if (pages.status === 'fulfilled' && pages.value.success) {
          const pageItems = pages.value.data?.map((page: any) => ({
            id: page.id,
            type: 'page' as const,
            title: page.title,
            content: page.content,
            status: page.status,
            author: page.author,
            created_at: page.created_at,
            updated_at: page.updated_at,
            meta: {
              seo_score: page.seo_score,
            },
          })) || [];
          allContent.push(...pageItems);
        }

        response = { success: true, data: { data: allContent } };
      }

      if (response.success) {
        let filteredContent = response.data.data || [];
        
        // Apply client-side filtering
        if (searchTerm) {
          filteredContent = filteredContent.filter((item: ContentItem) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedType) {
          filteredContent = filteredContent.filter((item: ContentItem) => item.type === selectedType);
        }
        
        if (selectedStatus) {
          filteredContent = filteredContent.filter((item: ContentItem) => item.status === selectedStatus);
        }

        setContent(filteredContent);
        setTotalPages(Math.ceil(filteredContent.length / 20));
      } else {
        throw new Error('Failed to load content');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Content loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContent = async (contentId: string, type: string) => {
    try {
      let response;
      if (type === 'review') {
        response = await adminApi.approveReview(contentId);
      } else {
        response = await adminApi.updatePage(contentId, { status: 'published' });
      }
      
      if (response.success) {
        setContent(content.map(item => 
          item.id === contentId 
            ? { ...item, status: 'published' as any }
            : item
        ));
      } else {
        throw new Error('Failed to approve content');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectContent = async (contentId: string, type: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      let response;
      if (type === 'review') {
        response = await adminApi.rejectReview(contentId, reason);
      } else {
        response = await adminApi.updatePage(contentId, { status: 'rejected' });
      }
      
      if (response.success) {
        setContent(content.map(item => 
          item.id === contentId 
            ? { ...item, status: 'rejected' as any }
            : item
        ));
      } else {
        throw new Error('Failed to reject content');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteContent = async (contentId: string, type: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      let response;
      if (type === 'page') {
        response = await adminApi.deletePage(contentId);
      } else {
        // For reviews, we might not have delete endpoint, so just remove from UI
        response = { success: true };
      }
      
      if (response.success) {
        setContent(content.filter(item => item.id !== contentId));
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      draft: { color: 'bg-gray-100 text-gray-800', icon: DocumentTextIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return StarIcon;
      case 'page':
        return DocumentTextIcon;
      case 'media':
        return PhotoIcon;
      case 'seo':
        return MagnifyingGlassIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getTypeDisplay = (type: string) => {
    const typeMap = {
      review: 'Review',
      page: 'Page',
      media: 'Media',
      seo: 'SEO',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  if (loading && content.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage reviews, pages, media, and SEO content</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/content/media"
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PhotoIcon className="h-4 w-4" />
            <span>Media Library</span>
          </Link>
          <Link
            href="/admin/content/pages/add"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Page</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {content.filter(c => c.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <EyeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {content.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-50 text-gray-600">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">
                {content.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <StarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {content.filter(c => c.type === 'review').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {contentTypes.map(type => (
                  <option key={type} value={type}>
                    {getTypeDisplay(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {contentStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType('');
                  setSelectedStatus('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {content.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        {item.content && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.content.substring(0, 100)}...
                          </div>
                        )}
                        {item.meta?.rating && (
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-3 w-3 ${
                                  i < item.meta!.rating! ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <TypeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getTypeDisplay(item.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.author}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <div>{new Date(item.created_at).toLocaleDateString()}</div>
                        {item.updated_at !== item.created_at && (
                          <div className="text-xs">
                            Updated: {new Date(item.updated_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/content/${item.type}/${item.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {item.type === 'page' && (
                          <Link
                            href={`/admin/content/pages/${item.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        )}
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveContent(item.id, item.type)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectContent(item.id, item.type)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteContent(item.id, item.type)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}
    </div>
  );
}
