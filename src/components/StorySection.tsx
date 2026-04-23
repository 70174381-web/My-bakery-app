import goldenAgeImg from "@/assets/vendel_golden_age.png";

const StorySection = () => (
  <section id="story" className="py-12 md:py-20 bg-vendel-warm">
    <div className="container mx-auto px-6 md:px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      <div className="order-2 md:order-1">
        <p className="font-cursive text-vendel-rose text-xl md:text-2xl mb-2">Our Story</p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
          Born From Passion, Built With Code
        </h2>
        <div className="space-y-3 md:space-y-4">
          <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            Vendel Bakes started as weekend experiments — a software developer who traded debugging for dough-kneading. What began as gifts for friends quickly turned into something bigger.
          </p>
          <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            Named after the Vendel era — a golden age of craftsmanship — we bring that same dedication to every bake. Our kitchen may be small, but our standards are anything but.
          </p>
          <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            Today, Vendel Bakes serves customers across the city, delivering freshly baked happiness right to your doorstep. Because the best things in life are homemade.
          </p>
        </div>
      </div>
      <div className="order-1 md:order-2 relative">
        <div className="absolute -inset-4 bg-vendel-rose/10 rounded-2xl blur-xl" />
        <img
          src={goldenAgeImg}
          alt="The golden age — the story behind Vendel Bakes"
          className="relative rounded-2xl shadow-2xl w-full object-cover max-h-[280px] md:max-h-[480px]"
          loading="lazy"
        />
      </div>
    </div>
  </section>
);

export default StorySection;