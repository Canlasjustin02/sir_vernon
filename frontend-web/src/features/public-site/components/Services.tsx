import { motion } from "framer-motion";
import { Truck, Sparkle, WashingMachine } from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "Full-Service Laundry",
      desc: "Choose wash and fold, dry cleaning, or ironing, then arrange convenient pickup and delivery.",
      icon: <Truck size={32} />,
    },
    {
      title: "Self-Service Laundry",
      desc: "Visit our shop and reserve a machine in the mobile app to do your laundry on your schedule.",
      icon: <WashingMachine size={32} />,
    },
  ];

  return (
    <section id="services" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h4 className="text-blue-600 font-bold uppercase tracking-widest mb-4">One Hybrid Laundry Shop</h4>
            <h2 className="text-5xl font-extrabold text-slate-900">One Shop. <br /> Two Ways to Do Laundry.</h2>
          </div>
          <p className="text-slate-600 text-xl max-w-md">
            Choose full-service care with pickup and delivery, or book a machine and do it yourself at the same shop.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((s, idx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -12 }}
              className="group p-10 rounded-[45px] bg-white/60 border border-white/80 backdrop-blur-xl hover:bg-white hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-default flex flex-col h-full"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm flex-shrink-0">
                {s.icon}
              </div>

              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors duration-500">
                  {s.desc}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                <span className="font-bold text-blue-600">Learn More</span>
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Sparkle size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
