import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';
import { snackService, Snack } from '../services/snackService';

const SnacksManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    available: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    discount: '',
    category: 'popcorn',
    stock: '',
    imageUrl: ''
  });

  useEffect(() => {
    const price = Number(formData.price);
    const original = Number(formData.originalPrice);

    if (original > 0 && price > 0 && original > price) {
      const computed = Math.round(((original - price) / original) * 100);
      setFormData(prev => ({ ...prev, discount: Math.min(100, Math.max(0, computed)).toString() }));
    } else {
      setFormData(prev => ({ ...prev, discount: '0' }));
    }
  }, [formData.price, formData.originalPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedSnacks, fetchedStats] = await Promise.all([
        snackService.getSnacks(selectedCategory, debouncedSearch),
        snackService.getStats()
      ]);
      setSnacks(fetchedSnacks);
      setStats(fetchedStats);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load snacks data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, debouncedSearch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'popcorn':
        return 'bg-yellow-500';
      case 'beverages':
        return 'bg-blue-500';
      case 'candy':
        return 'bg-pink-500';
      case 'nachos':
        return 'bg-orange-500';
      case 'combo':
        return 'bg-purple-500';
      default:
        return 'bg-brand-red';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-400';
    if (stock <= 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      price: '',
      originalPrice: '',
      discount: '0',
      category: 'popcorn',
      stock: '0',
      imageUrl: ''
    });
    setEditingSnack(null);
    setShowAddModal(true);
  };

  const openEditModal = (snack: Snack) => {
    setFormData({
      name: snack.name,
      price: snack.price.toString(),
      originalPrice: snack.originalPrice?.toString() || snack.price.toString(),
      discount: snack.discountPercent?.toString() || '0',
      category: snack.category,
      stock: snack.stock.toString(),
      imageUrl: snack.image || (snack as any).imageUrl || ''
    });
    setEditingSnack(snack);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: Partial<Snack> = {
        name: formData.name,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        discountPercent: Number(formData.discount),
        category: formData.category as any,
        stock: Number(formData.stock),
        image: formData.imageUrl
      };

      if (editingSnack) {
        await snackService.updateSnack(editingSnack.id || editingSnack._id, payload);
      } else {
        await snackService.createSnack(payload);
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving snack');
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this snack?')) return;
    setIsLoading(true);
    try {
      await snackService.deleteSnack(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete snack');
      setIsLoading(false);
    }
  };

  const isAutoCalculated = Number(formData.originalPrice) > 0 && Number(formData.price) > 0 && Number(formData.originalPrice) > Number(formData.price);

  if (isLoading && snacks.length === 0) {
    return <BookNViewLoader fullScreen={true} text="Loading Snacks..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-utensils text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Snacks Management</h1>
                <p className="text-brand-light-gray">Manage your theatre's snack inventory and pricing</p>
              </div>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Snack</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {errorMsg}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-utensils text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Available</p>
                <p className="text-2xl font-bold text-white">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Out of Stock</p>
                <p className="text-2xl font-bold text-white">{stats.outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-white">{stats.lowStock}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-rupee-sign text-white"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
            >
              <option value="all">All Categories</option>
              <option value="popcorn">Popcorn</option>
              <option value="beverages">Beverages</option>
              <option value="nachos">Nachos</option>
              <option value="combo">Combo Packs</option>
              <option value="other">Other</option>
            </select>
            <button 
              onClick={() => loadData()}
              className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center">
              <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Snacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {snacks.map((snack) => (
            <div key={snack.id || snack._id} className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Snack Image */}
              <div className="relative">
                <img 
                  src={(snack as any).imageUrl || snack.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  alt={snack.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found' }}
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(snack.status)}`}>
                    {snack.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(snack.category)}`}>
                    {snack.category}
                  </span>
                </div>
                {snack.category === 'combo' && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                      COMBO
                    </span>
                  </div>
                )}
                {((snack as any).discount > 0 || snack.discountPercent > 0) && (
                  <div className="absolute bottom-4 left-4 shadow-lg">
                    <span className="bg-green-500 text-white px-3 py-1 rounded font-bold text-sm">
                      {((snack as any).discount || snack.discountPercent)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Snack Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">{snack.name}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-light-gray text-sm">Price:</span>
                    <div className="text-right">
                      <span className="text-white font-bold">{formatCurrency(snack.price)}</span>
                      {snack.originalPrice > snack.price && (
                        <span className="text-brand-light-gray text-xs line-through ml-2">
                          {formatCurrency(snack.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-brand-light-gray text-sm">Stock:</span>
                    <span className={`font-medium ${getStockColor(snack.stock)}`}>
                      {snack.stock} units
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditModal(snack)}
                    className="flex-1 bg-brand-dark border border-brand-red text-white py-2 rounded-lg hover:bg-brand-red transition-colors text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(snack.id || snack._id)} 
                    className="flex-1 bg-brand-dark/50 text-red-500 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm"
                  >
                    <i className="fas fa-trash mr-1"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {snacks.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center">
              <i className="fas fa-box-open text-4xl text-brand-light-gray mb-4"></i>
              <p className="text-brand-light-gray">No snacks found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-brand-gray border border-brand-dark/40 rounded-2xl w-full max-w-2xl text-left shadow-2xl mt-10 mb-10">
            <div className="p-6 border-b border-brand-dark/40 flex justify-between items-center bg-brand-dark/30 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center">
                <i className={`fas ${editingSnack ? 'fa-edit' : 'fa-plus'} mr-3 text-brand-red`}></i>
                {editingSnack ? 'Edit Snack' : 'Add New Snack'}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-brand-light-gray hover:text-white transition-colors p-2"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Category *</label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  >
                    <option value="popcorn">Popcorn</option>
                    <option value="beverages">Beverages</option>
                    <option value="nachos">Nachos</option>
                    <option value="combo">Combo Pack</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Original Price (₹)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-brand-light-gray mb-2">
                    Discount %
                    {isAutoCalculated && (
                      <span
                        className="ml-2 font-medium"
                        style={{
                          background: '#1a3a1a',
                          color: '#66bb6a',
                          fontSize: '0.7rem',
                          padding: '2px 7px',
                          borderRadius: '10px'
                        }}
                      >
                        auto-calculated
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={handleFormChange}
                    readOnly={isAutoCalculated}
                    className={`w-full px-4 py-2 bg-[#111] rounded-xl text-[#e5e5e5] outline-none transition-colors ${
                      isAutoCalculated
                        ? 'border border-[#2e7d32] cursor-default'
                        : 'border border-[#333] focus:border-[#e91e8c]'
                    }`}
                  />
                  {isAutoCalculated && (
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '3px' }}>
                      Calculated from Price vs Original Price
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                  {formData.imageUrl && (
                    <div className="mt-4 flex justify-center bg-black/40 p-4 rounded-xl border border-brand-dark/50">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="h-32 object-contain rounded-lg shadow-lg"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4 border-t border-brand-dark/40 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-brand-light-gray/30 text-white hover:bg-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 rounded-xl bg-brand-red text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-save mr-2"></i>
                  )}
                  {editingSnack ? 'Update Snack' : 'Save Snack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnacksManagement;