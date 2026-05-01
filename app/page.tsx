export const dynamic = 'force-dynamic';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeaturedTeachers } from "@/components/sections/FeaturedTeachers";
import { WhyClario } from "@/components/sections/WhyClario";
import { Testimonial } from "@/components/sections/Testimonial";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Header />
      <main className="w-full min-h-screen bg-warm-white flex flex-col pt-0">
        <Hero />
        <HowItWorks />
        <FeaturedTeachers />
        <WhyClario />
        <Testimonial />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
