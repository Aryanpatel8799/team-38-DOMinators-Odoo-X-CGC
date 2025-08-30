import React from 'react';
import { Link } from 'react-router-dom';
import { 
  WrenchScrewdriverIcon, 
  MapPinIcon, 
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';

const LandingPage = () => {
  const features = [
    {
      icon: <WrenchScrewdriverIcon className="h-8 w-8" />,
      title: 'Expert Mechanics',
      description: 'Connect with verified, skilled mechanics in your area for quick and reliable service.'
    },
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: 'Real-time Tracking',
      description: 'Track your mechanic\'s location in real-time and get live updates on service progress.'
    },
    {
      icon: <ClockIcon className="h-8 w-8" />,
      title: '24/7 Availability',
      description: 'Get roadside assistance anytime, anywhere with our round-the-clock service.'
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with multiple payment options.'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: 'Trusted Community',
      description: 'Join thousands of satisfied customers and verified mechanics.'
    },
    {
      icon: <StarIcon className="h-8 w-8" />,
      title: 'Quality Guaranteed',
      description: 'Rate and review services to maintain high quality standards.'
    }
  ];

  const testimonials = [
    {
      name: 'John Doe',
      role: 'Customer',
      content: 'RoadGuard saved my day when I had a flat tire on the highway. Quick response and professional service!',
      rating: 5
    },
    {
      name: 'Sarah Wilson',
      role: 'Customer', 
      content: 'Amazing app! The real-time tracking feature gave me peace of mind while waiting for help.',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'Mechanic',
      content: 'Great platform for mechanics. Easy to use and helps me connect with customers efficiently.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">R</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-secondary-900">RoadGuard</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-secondary-600 hover:text-primary-600">Features</a>
              <a href="#how-it-works" className="text-secondary-600 hover:text-primary-600">How it Works</a>
              <a href="#testimonials" className="text-secondary-600 hover:text-primary-600">Testimonials</a>
            </nav>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Your Trusted <span className="text-primary-200 animate-pulse">Roadside</span> Companion
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-4xl mx-auto leading-relaxed">
                Get instant help when you need it most. Connect with verified mechanics for quick, 
                reliable roadside assistance wherever you are, 24/7.
              </p>
            </div>
            
            <div className="animate-fade-in-up animation-delay-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/register?role=customer">
                  <Button variant="secondary" size="xl" className="w-full sm:w-auto transform hover:scale-105 transition-transform duration-200 shadow-lg">
                    🚨 Need Help Now?
                  </Button>
                </Link>
                <Link to="/register?role=mechanic">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary-600 transform hover:scale-105 transition-transform duration-200">
                    🔧 Join as Mechanic
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-200">24/7</div>
                  <div className="text-sm text-primary-100">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-200">5k+</div>
                  <div className="text-sm text-primary-100">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-200">500+</div>
                  <div className="text-sm text-primary-100">Verified Mechanics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 animate-bounce">
          <WrenchScrewdriverIcon className="h-8 w-8 text-primary-300 opacity-50" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce animation-delay-1000">
          <MapPinIcon className="h-6 w-6 text-primary-300 opacity-50" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce animation-delay-500">
          <ClockIcon className="h-7 w-7 text-primary-300 opacity-50" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose RoadGuard?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              We provide comprehensive roadside assistance with cutting-edge technology 
              and a network of trusted professionals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="text-primary-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">{feature.title}</h3>
                <p className="text-secondary-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600">
              Get help in just a few simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Request Help</h3>
              <p className="text-secondary-600">
                Describe your issue and share your location. Our system will find nearby mechanics.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Get Matched</h3>
              <p className="text-secondary-600">
                A verified mechanic accepts your request and provides an estimated arrival time.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Track & Pay</h3>
              <p className="text-secondary-600">
                Track your mechanic in real-time and pay securely through the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-secondary-600">
              Trusted by thousands of customers and mechanics
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
                  ))}
                </div>
                <p className="text-secondary-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-secondary-900">{testimonial.name}</p>
                  <p className="text-sm text-secondary-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of satisfied users and experience reliable roadside assistance today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=customer">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Sign Up as Customer
              </Button>
            </Link>
            <Link to="/register?role=mechanic">
              <Button variant="outline" size="xl" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary-600">
                Join as Mechanic
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">R</span>
              </div>
              <span className="ml-3 text-xl font-bold">RoadGuard</span>
            </div>
            <div className="text-secondary-400">
              <p>&copy; 2024 RoadGuard. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
