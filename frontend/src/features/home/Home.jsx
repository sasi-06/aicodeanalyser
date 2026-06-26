/**
 * Home Page - Enterprise Landing Page
 * Demonstrates premium design system and component usage
 * - Advanced animations with Framer Motion
 * - Responsive design across all breakpoints
 * - Accessibility-first approach
 * - Performance-optimized (lazy loading, code splitting)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  TerminalSquare,
  ShieldCheck,
  Cpu,
  ChevronRight,
  Users,
  BarChart3,
  Menu,
  X,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  Database,
  Sparkles,
  TrendingUp,
  Rocket,
} from 'lucide-react';
import { Button, Card, Badge, Container, Section, Stack, Grid, Heading, Paragraph } from '@/common/components';
import { animations, buttonVariants, cardVariants, brandConfigs } from '@/design-system';
import { useMediaQuery } from '@/hooks/useAdvanced';


/**
 * Navigation Header Component
 * Fixed header with scroll detection and mobile responsiveness
 */
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const throttledScroll = () => {
      handleScroll();
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 py-3'
          : 'bg-transparent py-6'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code2 className="text-white w-6 h-6" />
            </motion.div>
            <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              {brandConfigs.name}
            </span>
          </Link>

          {/* Desktop Navigation Group */}
          {!isMobile && (
            <div className="hidden lg:flex flex-1 items-center justify-between ml-12">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-slate-400 hover:text-white transition-colors relative group"
                    whileHover={{ y: -2 }}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all group-hover:w-full" />
                  </motion.a>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-bold">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="font-bold shadow-blue-500/20 shadow-lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <motion.button
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          )}
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden mt-4 pt-4 border-t border-slate-700/50"
            >
              <Stack direction="vertical" gap="md">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base font-medium text-slate-400 hover:text-white transition-colors py-2"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="h-px bg-slate-700/30 my-2" />
                <Link to="/login" className="block">
                  <Button
                    variant="ghost"
                    size="md"
                    className="w-full rounded-lg"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full rounded-lg"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Get Started
                  </Button>
                </Link>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.nav>
  );
};

/**
 * Hero Section Component
 */
const HeroSection = () => {
  return (
    <Section className="relative pt-32 md:pt-40 overflow-hidden" hasPadding={false}>
      {/* Animated Background Gradients */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-3xl"
        animate={{ y: [0, 50, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-600/10 to-transparent rounded-full blur-3xl"
        animate={{ y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <Container>
        <div className="text-center relative z-10 py-20 md:py-32">
          {/* Badge */}
          <motion.div {...animations.fadeInDown} className="mb-8">
            <Badge variant="primary" className="inline-flex gap-2">
              <Sparkles size={14} />
              V3.0 Enterprise Engine
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.div {...animations.fadeInUp}>
            <Heading
              level={1}
              color="primary"
              className="mb-8"
            >
              Technical Hiring<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Beyond The Code
              </span>
            </Heading>
          </motion.div>

          {/* Subheading */}
          <motion.div {...animations.fadeInUp} transition={{ delay: 0.1 }}>
            <Paragraph
              variant="lg"
              color="secondary"
              className="mb-12 max-w-3xl mx-auto"
            >
              The world's most advanced AI-powered technical assessment platform with live behavioral telemetry, typing analysis, and predictive authenticity scoring.
            </Paragraph>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            {...animations.fadeInUp}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/register">
              <Button
                variant="primary"
                size="lg"
                icon={Rocket}
                iconPosition="left"
                className="rounded-xl"
              >
                Deploy Your First Test
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
              >
                Recruiter Access
              </Button>
            </Link>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-3xl" />
            <Card variant="elevated" className="relative rounded-2xl p-1 overflow-hidden border-blue-500/30">
              <div className="bg-slate-900 rounded-xl p-8">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center">
                  <motion.div
                    className="text-center"
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Cpu className="text-blue-400 mx-auto mb-3" size={40} />
                    <p className="text-slate-400 font-medium">Live Assessment Dashboard</p>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
};

/**
 * Features Section Component
 */
const FeaturesSection = () => {
  const features = useMemo(
    () => [
      {
        icon: TerminalSquare,
        color: 'from-blue-500 to-blue-600',
        title: 'Elite CodeIDE',
        description: 'Custom-tuned Monaco editor with multi-language support, lightning-fast IntelliSense.',
      },
      {
        icon: Zap,
        color: 'from-yellow-500 to-orange-600',
        title: 'Typing Telemetry ML',
        description: 'Proprietary models analyze typing cadence and syntax patterns for authenticity verification.',
      },
      {
        icon: ShieldCheck,
        color: 'from-green-500 to-emerald-600',
        title: 'Zero-Trust Security',
        description: 'Deep monitoring with instant recruiter notifications for suspicious activities.',
      },
      {
        icon: BarChart3,
        color: 'from-purple-500 to-indigo-600',
        title: 'Predictive Reporting',
        description: 'Automated PDF session summaries with code quality metrics and behavioral analysis.',
      },
      {
        icon: Users,
        color: 'from-pink-500 to-rose-600',
        title: 'Assessment Workflow',
        description: 'Native candidate pipeline management with real-time Socket.io alerts.',
      },
      {
        icon: Lock,
        color: 'from-cyan-500 to-blue-600',
        title: 'Isolated Sandboxing',
        description: 'Secure, resource-limited execution environments with strict enforcement.',
      },
    ],
    []
  );

  return (
    <Section id="features" className="bg-gradient-to-b from-slate-900/50 to-transparent">
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">Architecture</Badge>
          <Heading level={2} className="mb-4">
            Enterprise Design Standards
          </Heading>
          <Paragraph
            variant="lg"
            color="secondary"
            className="max-w-2xl mx-auto"
          >
            Built for global engineering teams who demand uncompromisable assessment integrity.
          </Paragraph>
        </motion.div>

        <Grid columns={3} gap="lg">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              index={index}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  );
};

/**
 * Feature Card Sub-component
 */
const FeatureCard = ({ icon: Icon, color, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card
        variant="interactive"
        className="rounded-xl p-8 h-full group"
      >
        <div
          className={`w-14 h-14 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}
        >
          <Icon className="text-white" size={28} />
        </div>
        <Heading level={4} className="mb-3">
          {title}
        </Heading>
        <Paragraph color="secondary">
          {description}
        </Paragraph>
      </Card>
    </motion.div>
  );
};

/**
 * Workflow Section Component
 */
const WorkflowSection = () => {
  const workshopItems = useMemo(
    () => [
      {
        step: '01',
        title: 'Dynamic Challenge Creation',
        description: 'Recruiters design complex coding challenges with hidden test cases and specific limits.',
      },
      {
        step: '02',
        title: 'Live Real-time Proctoring',
        description: 'Monitor candidate progress live from your dashboard with AI-powered behavior detection.',
      },
      {
        step: '03',
        title: 'Smart Assessment Reports',
        description: 'Get detailed PDF reports including skill assessment and authenticity recommendations.',
      },
    ],
    []
  );

  return (
    <Section id="workflow" className="bg-slate-800/50">
      <Container>
        <Grid columns={2} gap="2xl">
          {/* Left: Workflow Steps */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="primary" className="mb-4">The Process</Badge>
            <Heading level={2} className="mb-8">
              Hire Faster.<br />Hire Better.
            </Heading>
            <Paragraph variant="lg" color="secondary" className="mb-12">
              Our streamlined workflow reduces developer assessment time by 40%.
            </Paragraph>

            <Stack direction="vertical" gap="xl">
              {workshopItems.map((item, index) => (
                <WorkflowItem key={index} {...item} />
              ))}
            </Stack>
          </motion.div>

          {/* Right: Metrics Display */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card variant="elevated" className="rounded-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <Heading level={4}>Assessment Status</Heading>
                <Badge variant="success">Candidate Active</Badge>
              </div>

              <Stack direction="vertical" gap="lg">
                <MetricBar label="Code Correctness" value={92} />
                <MetricBar label="Time Complexity" value={78} />
                <MetricBar label="Authenticity" value={98} />
                <MetricBar label="Memory Usage" value={14} />
              </Stack>

              <div className="mt-8 pt-8 border-t border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                    SSP
                  </div>
                  <div>
                    <p className="font-semibold">Sasisivaprakash M</p>
                    <p className="text-sm text-slate-400">CSE</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Grid>
      </Container>
    </Section>
  );
};

/**
 * Workflow Item Sub-component
 */
const WorkflowItem = ({ step, title, description }) => {
  return (
    <motion.div className="flex gap-6" whileHover={{ x: 10 }}>
      <div className="text-4xl font-black text-blue-500/30 w-12 flex-shrink-0">
        {step}
      </div>
      <div>
        <Heading level={5} className="mb-2">
          {title}
        </Heading>
        <Paragraph color="secondary">
          {description}
        </Paragraph>
      </div>
    </motion.div>
  );
};

/**
 * Metric Bar Sub-component
 */
const MetricBar = ({ label, value }) => {
  return (
    <div>
      <div className="flex justify-between mb-2 text-sm font-medium">
        <span className="text-slate-300">{label}</span>
        <span className="text-blue-400 font-semibold">{value}%</span>
      </div>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
        />
      </div>
    </div>
  );
};

/**
 * CTA Section Component
 */
const CTASection = () => {
  return (
    <Section>
      <Container>
        <Card
          variant="elevated"
          className="rounded-2xl p-12 md:p-16 bg-gradient-to-br from-blue-600/80 to-indigo-800/80 overflow-hidden relative"
        >
          {/* Animated background blob */}
          <motion.div
            className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          <div className="relative z-10 text-center">
            <Heading level={2} color="primary" className="mb-8">
              Ready to Scale Your<br />Engineering Team?
            </Heading>
            <Paragraph
              variant="lg"
              color="primary"
              className="mb-12 max-w-2xl mx-auto"
            >
              Join 500+ top technology companies using CodeAnalyser.AI to find and verify the world's best developers.
            </Paragraph>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-xl"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Get Started Now
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-xl border border-white/30 text-white hover:bg-white/10"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
};

/**
 * Footer Component
 */
const Footer = () => {
  const footerSections = useMemo(
    () => [
      {
        title: 'Platform',
        links: ['Live Monitoring', 'Telemetry ML', 'Integrated IDE', 'Fraud Detection'],
      },
      {
        title: 'Company',
        links: ['About Us', 'Enterprise', 'Careers', 'Security'],
      },
      {
        title: 'Resources',
        links: ['Documentation', 'API Reference', 'Support', 'Community'],
      },
    ],
    []
  );

  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 py-16 md:py-20">
      <Container>
        <Grid columns={4} gap="xl" className="mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Code2 size={18} className="text-white" />
              </div>
              <span className="font-black">{brandConfigs.name}</span>
            </Link>
            <Paragraph color="secondary" className="mb-6">
              The premier AI-driven platform for technical talent verification.
            </Paragraph>
            <div className="flex gap-3">
              {['GitHub', 'Twitter', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-slate-500 hover:text-blue-400 transition-colors text-sm font-medium"
                >
                  {social}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">
                {section.title}
              </h4>
              <Stack direction="vertical" gap="md">
                {section.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium"
                  >
                    {link}
                  </a>
                ))}
              </Stack>
            </motion.div>
          ))}
        </Grid>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
            <p>© {new Date().getFullYear()} CodeAnalyser AI Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-blue-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

/**
 * Home Page - Main Component
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
      <Header />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
