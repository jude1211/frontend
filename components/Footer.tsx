
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* BookNView Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-brand-red mb-3 sm:mb-4">BookNView</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Your ultimate destination for booking movie tickets, events, and entertainment experiences across the globe.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="fab fa-youtube text-xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Movies</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Events</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Plays</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Sports</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Activities</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Buzz</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">Refund Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-red transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Stay Updated */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Stay Updated</h4>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
              Subscribe to get the latest movie updates and exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-brand-gray text-white px-3 py-2 rounded-t-md sm:rounded-l-md sm:rounded-t-none focus:outline-none focus:ring-2 focus:ring-brand-red text-sm sm:text-base"
              />
              <button className="bg-brand-red text-white px-4 py-2 rounded-b-md sm:rounded-r-md sm:rounded-b-none hover:bg-red-600 transition-colors text-sm sm:text-base whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-300 text-xs sm:text-sm text-center md:text-left">
              <p>support@booknview.com</p>
              <p>+91 80 2720 8080</p>
              <p>Available in 100+ cities</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2024 BookNView. All rights reserved. | Made with ❤️ for movie lovers
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
