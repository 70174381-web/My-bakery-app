import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground py-12">
    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-heading text-2xl font-semibold text-vendel-rose mb-3">Vendel Bakes</h3>
        <p className="text-sm text-primary-foreground/70 font-body leading-relaxed">
          Artisan Brownies &amp; Baked Goods — handcrafted with love, delivered to your door.
        </p>
      </div>
      <div>
        <h4 className="font-heading text-lg font-semibold mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
          <li><Link to="/shop" className="hover:text-vendel-rose transition-colors">Shop</Link></li>
          <li><Link to="/track" className="hover:text-vendel-rose transition-colors">Track Order</Link></li>
          <li><Link to="/admin/login" className="hover:text-vendel-rose transition-colors">Admin</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-heading text-lg font-semibold mb-3">Payment Methods</h4>
        <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
          <li>EasyPaisa: 0330-458-2288</li>
          <li>Bank: PK10TMFB0000000077895231</li>
          <li>Card payments accepted</li>
        </ul>
      </div>
    </div>
    <div className="container mx-auto px-4 mt-8 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50 font-body">
      © {new Date().getFullYear()} Vendel Bakes. All rights reserved.
    </div>
  </footer>
);

export default Footer;