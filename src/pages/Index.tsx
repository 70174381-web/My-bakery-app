import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import StorySection from "@/components/StorySection";
import HighlightsSection from "@/components/HighlightsSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <MissionSection />
    <HighlightsSection />
    <StorySection />
    <Footer />
  </div>
);

export default Index;
