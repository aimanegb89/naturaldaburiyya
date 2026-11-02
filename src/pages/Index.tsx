import AppShell from '@/components/AppShell';
import Hero from '@/components/Hero';
import { CategoryGrid, BestSellers, TrustStrip, AboutSection } from '@/components/home/HomeSections';

const Index: React.FC = () => (
  <AppShell>
    <Hero />
    <CategoryGrid />
    <BestSellers />
    <TrustStrip />
    <AboutSection />
  </AppShell>
);

export default Index;
