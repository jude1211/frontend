import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';

interface Snack {
  id: string;
  name: string;
  category: 'popcorn' | 'beverages' | 'candy' | 'nachos' | 'combo';
  price: number;
  originalPrice: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  imageUrl: string;
  description: string;
  isCombo: boolean;
  comboItems?: string[];
  discount: number;
}

const SnacksManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Simulate loading snacks
    setSnacks([
      {
        id: '1',
        name: 'Butter Popcorn (Large)',
        category: 'popcorn',
        price: 180,
        originalPrice: 200,
        stock: 45,
        status: 'available',
        imageUrl: 'https://picsum.photos/seed/popcorn/400/300',
        description: 'Fresh buttered popcorn, perfect for movie watching',
        isCombo: false,
        discount: 10
      },
      {
        id: '2',
        name: 'Coca Cola (500ml)',
        category: 'beverages',
        price: 80,
        originalPrice: 80,
        stock: 120,
        status: 'available',
        imageUrl: 'https://picsum.photos/seed/cola/400/300',
        description: 'Refreshing Coca Cola to quench your thirst',
        isCombo: false,
        discount: 0
      },
      {
        id: '3',
        name: 'Movie Combo Pack',
        category: 'combo',
        price: 350,
        originalPrice: 450,
        stock: 25,
        status: 'available',
        imageUrl: 'https://picsum.photos/seed/combo/400/300',
        description: 'Popcorn + Coke + Nachos - Perfect movie companion',
        isCombo: true,
        comboItems: ['Butter Popcorn (Medium)', 'Coca Cola (500ml)', 'Nachos with Cheese'],
        discount: 22
      },
      {
        id: '4',
        name: 'Nachos with Cheese',
        category: 'nachos',
        price: 150,
        originalPrice: 150,
        stock: 0,
        status: 'out_of_stock',
        imageUrl: 'https://picsum.photos/seed/nachos/400/300',
        description: 'Crispy nachos topped with melted cheese',
        isCombo: false,
        discount: 0
      },
      {
        id: '5',
        name: 'M&M Chocolate',
        category: 'candy',
        price: 60,
        originalPrice: 75,
        stock: 80,
        status: 'available',
        imageUrl: 'https://picsum.photos/seed/mms/400/300',
        description: 'Colorful M&M chocolates for sweet cravings',
        isCombo: false,
        discount: 20
      },
      {
        id: '6',
        name: 'Premium Combo',
        category: 'combo',
        price: 500,
        originalPrice: 650,
        stock: 15,
        status: 'available',
        imageUrl: 'https://picsum.photos/seed/premium/400/300',
        description: 'Large Popcorn + Coke + Candy + Nachos',
        isCombo: true,
        comboItems: ['Butter Popcorn (Large)', 'Coca Cola (500ml)', 'M&M Chocolate', 'Nachos with Cheese'],
        discount: 23
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
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
    if (stock < 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredSnacks = selectedCategory === 'all' 
    ? snacks 
    : snacks.filter(snack => snack.category === selectedCategory);

  const stats = {
    totalItems: snacks.length,
    availableItems: snacks.filter(s => s.status === 'available').length,
    outOfStock: snacks.filter(s => s.status === 'out_of_stock').length,
    totalValue: snacks.reduce((sum, snack) => sum + (snack.price * snack.stock), 0),
    lowStock: snacks.filter(s => s.stock > 0 && s.stock < 10).length
  };

  if (isLoading) {
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
              onClick={() => setShowAddModal(true)}
              className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Snack</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
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
                <p className="text-2xl font-bold text-white">{stats.availableItems}</p>
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
              <option value="candy">Candy</option>
              <option value="nachos">Nachos</option>
              <option value="combo">Combo Packs</option>
            </select>
            <button className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors">
              <i className="fas fa-filter mr-2"></i>
              Filter
            </button>
          </div>
        </div>

        {/* Snacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSnacks.map((snack) => (
            <div key={snack.id} className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Snack Image */}
              <div className="relative">
                <img 
                  src={snack.imageUrl} 
                  alt={snack.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(snack.status)}`}>
                    {snack.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(snack.category)}`}>
                    {snack.category}
                  </span>
                </div>
                {snack.isCombo && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                      COMBO
                    </span>
                  </div>
                )}
                {snack.discount > 0 && (
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {snack.discount}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Snack Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">{snack.name}</h3>
                <p className="text-brand-light-gray text-sm mb-3 line-clamp-2">{snack.description}</p>
                
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

                  {snack.isCombo && snack.comboItems && (
                    <div>
                      <span className="text-brand-light-gray text-sm">Includes:</span>
                      <div className="mt-1">
                        {snack.comboItems.map((item, index) => (
                          <span key={index} className="inline-block bg-brand-dark text-white px-2 py-1 rounded text-xs mr-1 mb-1">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setEditingSnack(snack)}
                    className="flex-1 bg-brand-red text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button className="flex-1 bg-brand-dark text-white py-2 rounded-lg hover:bg-brand-dark/80 transition-colors text-sm">
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SnacksManagement; 