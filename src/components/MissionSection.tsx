import missionImg from "@/assets/vendel_mission.png";

const MissionSection = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="relative">
        <div className="absolute -inset-4 bg-vendel-rose/10 rounded-2xl blur-xl" />
        <img
          src={missionImg}
          alt="Vendel Bakes mission — crafting joy through baking"
          className="relative rounded-2xl shadow-2xl w-full object-cover max-h-[480px]"
          loading="lazy"
        />
      </div>
      <div>
        <p className="font-cursive text-vendel-rose text-2xl mb-2">Our Mission</p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
          Crafting Joy, One Bite at a Time
        </h2>
        <p className="font-body text-muted-foreground leading-relaxed mb-4">
          At Vendel Bakes, every recipe is a labour of love. We blend the precision of code with the warmth of a home kitchen to create treats that bring people together.
        </p>
        <p className="font-body text-muted-foreground leading-relaxed">
          From celebration cakes to everyday cookies, each item is baked fresh to order using quality ingredients — no preservatives, no shortcuts, just honest baking.
        </p>
      </div>
    </div>
  </section>
);

export default MissionSection;
