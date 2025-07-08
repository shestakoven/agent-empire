'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Mail, MessageSquare, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after delay
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      description: 'Get help with your account or technical issues',
      contact: 'support@agent-empire.com',
      response: '< 4 hours'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Chat with our team in real-time',
      contact: 'Available 24/7',
      response: '< 2 minutes'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Enterprise Sales',
      description: 'Speak with our sales team about custom solutions',
      contact: '+1 (555) 123-4567',
      response: '< 1 hour'
    }
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '1234 Innovation Drive\nSan Francisco, CA 94105',
      timezone: 'PST (UTC-8)'
    },
    {
      city: 'New York',
      address: '567 Tech Avenue\nNew York, NY 10001',
      timezone: 'EST (UTC-5)'
    },
    {
      city: 'London',
      address: '890 Future Street\nLondon, UK EC1A 1BB',
      timezone: 'GMT (UTC+0)'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-cyber-400" />
              <span className="text-xl font-heading font-bold gradient-text">Agent Empire</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/features" className="btn-ghost">Features</Link>
              <Link href="/pricing" className="btn-ghost">Pricing</Link>
              <Link href="/signup" className="btn-cyber">Get Started</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 gradient-text mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Have questions about Agent Empire? Need help getting started? 
            Our team is here to help you succeed with AI agents.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card-cyber p-8">
              <h2 className="text-2xl font-heading font-bold mb-6">Send us a Message</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message Sent Successfully!</h3>
                  <p className="text-muted-foreground">
                    Thank you for contacting us. We'll get back to you within 4 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="input-cyber w-full"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="input-cyber w-full"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium mb-2">
                      Inquiry Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="input-cyber w-full"
                    >
                      <option value="general">General Question</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="partnership">Partnership</option>
                      <option value="media">Media/Press</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="input-cyber w-full"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      rows={6}
                      className="input-cyber w-full resize-none"
                      placeholder="Tell us more about how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-cyber w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-6">
            <div className="card-cyber p-6">
              <h3 className="text-xl font-heading font-bold mb-6">Contact Methods</h3>
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 bg-cyber-500/20 rounded-lg">
                      {method.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{method.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <div className="text-sm">
                        <div className="text-cyber-400 font-medium">{method.contact}</div>
                        <div className="text-muted-foreground">Response time: {method.response}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-cyber p-6">
              <h3 className="text-xl font-heading font-bold mb-6">Office Hours</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cyber-400" />
                  <div>
                    <div className="font-medium">24/7 Support</div>
                    <div className="text-sm text-muted-foreground">Chat and email always available</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-cyber-400" />
                  <div>
                    <div className="font-medium">Phone Support</div>
                    <div className="text-sm text-muted-foreground">Mon-Fri, 9AM-6PM PST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Office Locations */}
        <div className="mb-16">
          <h2 className="heading-2 text-center mb-12">Our Offices</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="card-cyber p-6 text-center">
                <MapPin className="w-8 h-8 text-cyber-400 mx-auto mb-4" />
                <h3 className="text-xl font-heading font-bold mb-4">{office.city}</h3>
                <div className="text-muted-foreground mb-4 whitespace-pre-line">
                  {office.address}
                </div>
                <div className="text-sm text-cyber-400">{office.timezone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-cyber p-8 mb-16">
          <h2 className="heading-2 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">How quickly do you respond?</h3>
                <p className="text-muted-foreground text-sm">
                  We respond to emails within 4 hours, live chat within 2 minutes, 
                  and phone calls within 1 hour during business hours.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Do you offer technical support?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! Our technical support team helps with account setup, agent configuration, 
                  troubleshooting, and optimization.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Can I schedule a demo?</h3>
                <p className="text-muted-foreground text-sm">
                  Absolutely! Contact our sales team to schedule a personalized demo 
                  and see how Agent Empire can work for your specific needs.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Do you support enterprise customers?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, we offer dedicated enterprise support with custom solutions, 
                  priority support, and dedicated account managers.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">What about partnerships?</h3>
                <p className="text-muted-foreground text-sm">
                  We're always interested in strategic partnerships. Contact us to discuss 
                  integration opportunities, reseller programs, or joint ventures.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Media inquiries?</h3>
                <p className="text-muted-foreground text-sm">
                  For press inquiries, interviews, or media kits, please email 
                  press@agent-empire.com or use the contact form above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="card-cyber p-8 max-w-2xl mx-auto">
            <h2 className="heading-2 gradient-text mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Don't wait for answers - start building your AI empire today. 
              Our platform is designed to get you up and running in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
                Start Free Trial
              </Link>
              <Link href="/demo" className="btn-outline text-lg px-8 py-4">
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Full support included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}