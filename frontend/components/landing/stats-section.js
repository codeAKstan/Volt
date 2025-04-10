"use client"

import { motion } from "framer-motion"
import { Building, Users, Clock, Calendar } from "lucide-react"

export function StatsSection() {
  const stats = [
    {
      icon: <Building className="h-8 w-8 text-primary" />,
      value: "10,000+",
      label: "Workspaces Managed",
      delay: 0,
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: "50,000+",
      label: "Active Users",
      delay: 0.1,
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      value: "1M+",
      label: "Bookings Per Month",
      delay: 0.2,
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      value: "99.9%",
      label: "Uptime",
      delay: 0.3,
    },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stat.delay }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {stat.icon}
              </div>
              <motion.div
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                  delay: stat.delay + 0.2,
                }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</h3>
              </motion.div>
              <p className="text-foreground/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
