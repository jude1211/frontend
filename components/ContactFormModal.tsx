import React, { useState } from 'react';
import Modal from './Modal';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  organization: string;
  eventType: string;
  venueLocation: string;
  description: string;
  expectedAudience: string;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    eventType: '',
    venueLocation: '',
    description: '',
    expectedAudience: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          eventType: '',
          venueLocation: '',
          description: '',
          expectedAudience: ''
        });
        onClose();
      }, 3000);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
          <p className="text-green-700 mb-4">
            Your partnership request has been submitted successfully. Our team will contact you within 24 hours.
          </p>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-8 max-w-2xl mx-auto border border-brand-dark/40 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-tent text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">List Your Show</h2>
          <p className="text-brand-light-gray">
            Partner with BookNView and reach millions of movie lovers and event enthusiasts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-user mr-2 text-brand-red"></i>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-envelope mr-2 text-brand-red"></i>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-phone mr-2 text-brand-red"></i>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-building mr-2 text-brand-red"></i>
                Organization *
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
                placeholder="Your organization name"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-tag mr-2 text-brand-red"></i>
                Event Type *
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
              >
                <option value="">Select event type</option>
                <option value="movie">Movie Screening</option>
                <option value="concert">Concert</option>
                <option value="comedy">Comedy Show</option>
                <option value="dance">Dance Performance</option>
                <option value="theatre">Theatre Play</option>
                <option value="sports">Sports Event</option>
                <option value="workshop">Workshop</option>
                <option value="exhibition">Exhibition</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-map-marker-alt mr-2 text-brand-red"></i>
                Venue Location *
              </label>
              <input
                type="text"
                name="venueLocation"
                value={formData.venueLocation}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
                placeholder="City, State"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              <i className="fas fa-users mr-2 text-brand-red"></i>
              Expected Audience Size *
            </label>
            <select
              name="expectedAudience"
              value={formData.expectedAudience}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all"
            >
              <option value="">Select audience size</option>
              <option value="50-100">50-100 people</option>
              <option value="100-500">100-500 people</option>
              <option value="500-1000">500-1000 people</option>
              <option value="1000-5000">1000-5000 people</option>
              <option value="5000+">5000+ people</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              <i className="fas fa-align-left mr-2 text-brand-red"></i>
              Event Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition-all resize-none"
              placeholder="Tell us about your event, its unique features, and why people should attend..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-brand-light-gray hover:text-white transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>Submit Partnership Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ContactFormModal; 