"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How does the booking system work?",
    answer:
      "Our intuitive booking system allows users to browse available workspaces, select their desired time slot, and confirm their booking in just a few clicks. You can filter by workspace type, location, and amenities to find the perfect space for your needs.",
  },
  {
    question: "Can I integrate Volt with my calendar?",
    answer:
      "Yes! Volt seamlessly integrates with popular calendar applications like Google Calendar, Microsoft Outlook, and Apple Calendar. This ensures all your bookings are automatically added to your calendar, and you'll receive timely reminders.",
  },
  {
    question: "What types of workspaces can I manage with Volt?",
    answer:
      "Volt supports a wide range of workspace types including desks, meeting rooms, conference rooms, phone booths, event spaces, and more. You can customize workspace types to match your organization's specific needs.",
  },
  {
    question: "Is Volt suitable for small businesses?",
    answer:
      "Volt is designed to scale with your business. Our Starter plan is perfect for small teams with up to 10 users, while our Professional and Enterprise plans offer additional features for growing organizations.",
  },
  {
    question: "How does the analytics dashboard help optimize workspace usage?",
    answer:
      "Our analytics dashboard provides valuable insights into workspace usage patterns, peak hours, occupancy rates, and more. This data helps you make informed decisions about workspace allocation, identify underutilized spaces, and optimize your office layout for maximum efficiency.",
  },
  {
    question: "Can I customize notifications and reminders?",
    answer:
      "Yes, Volt offers fully customizable notification settings. Users can choose to receive booking confirmations, reminders, and updates via email, push notifications, or SMS. Administrators can also set up automated reminders for specific events.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">Everything you need to know about Volt</p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="mb-4"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="flex justify-between items-center w-full text-left p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <h3 className="text-lg font-medium">{faq.question}</h3>
                <ChevronDown className={`h-5 w-5 transition-transform ${openIndex === index ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-2 text-foreground/70">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
