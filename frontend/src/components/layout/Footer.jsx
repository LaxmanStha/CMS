import { Link } from 'react-router-dom';
import { GraduationCap, Heart, Code, Send, Users, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('footer', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-text-primary">RapidStrik University</p>
              <p className="text-xs text-text-secondary">Empowering Education Since 2020</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <span>&copy; {currentYear} RapidStrik University. All rights reserved.</span>
            <span className="hidden sm:inline">Version 2.4.1</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-hover transition-colors" aria-label="GitHub">
              <Code className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-hover transition-colors" aria-label="Twitter">
              <Send className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-hover transition-colors" aria-label="LinkedIn">
              <Users className="w-5 h-5" />
            </a>
            <a href="mailto:info@RapidStrik.edu" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-hover transition-colors" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-text-secondary">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>/</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>/</span>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
            <span>/</span>
            <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-danger" />
            <span>by RapidStrik Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
