import React from 'react';

const Footer = ({ 
  companyName = "NMDC Ltd Kirandul", 
  developerName = "Development Team",
  year = new Date().getFullYear(),
  version = "1.0.0",
  showVersion = true,
  customLinks = []
}) => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left Section - Company Info */}
          <div className="text-center md:text-left">
            <p className="text-sm">
              © {year} {companyName}. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Developed by <span className="font-medium text-blue-400">{developerName}</span>
            </p>
          </div>

          {/* Center Section - Custom Links */}
          {customLinks.length > 0 && (
            <div className="flex space-x-6">
              {customLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  target={link.external ? "_blank" : "_self"}
                  rel={link.external ? "noopener noreferrer" : ""}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Right Section - Version Info */}
          {showVersion && (
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-400">Version {version}</p>
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Border */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>Built with React & Tailwind CSS</p>
            <p className="mt-2 md:mt-0">
              For support, contact: 
              <a href="mailto:support@company.com" className="text-blue-400 hover:text-blue-300 ml-1">
                support@company.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;