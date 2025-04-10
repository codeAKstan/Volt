"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    content:
      "Volt has transformed how we manage our office spaces. The booking system is intuitive and the analytics help us optimize our workspace usage.",
    author: "Sarah Johnson",
    role: "Operations Manager",
    company: "TechCorp Inc.",
    avatar: "/placeholder.svg",
  },
  {
    id: 2,
    content:
      "Since implementing Volt, we've seen a 30% increase in workspace efficiency. The AI recommendations are surprisingly accurate!",
    author: "Michael Chen",
    role: "Facilities Director",
    company: "Innovate Solutions",
    avatar: "/placeholder.svg",
  },
  {
    id: 3,
    content:
      "As a remote-first company with occasional in-office meetings, Volt has been a game-changer for coordinating our team's workspace needs.",
    author: "Priya Patel",
    role: "HR Director",
    company: "Global Connect",
    avatar: "/placeholder.svg",
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000) // Change testimonial every 5 seconds

    return () => clearInterval(interval) // Clean up on unmount
  }, [testimonials.length])

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative py-16">
      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -skew-y-3 z-0"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            What Our Customers Say
          </motion.h2>
          <motion.p
            className="text-xl text-foreground/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Trusted by companies of all sizes
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <Card className="border-none shadow-lg bg-background">
                  <CardContent className="p-8 md:p-12">
                    <Quote className="h-12 w-12 text-primary/20 mb-6" />
                    <p className="text-xl md:text-2xl mb-8 italic">"{testimonials[currentIndex].content}"</p>
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={testimonials[currentIndex].avatar} />
                        <AvatarFallback>{testimonials[currentIndex].author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{testimonials[currentIndex].author}</h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonials[currentIndex].role}, {testimonials[currentIndex].company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex ? "bg-primary w-6" : "bg-primary/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 rounded-full bg-background shadow-md hidden md:flex"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full bg-background shadow-md hidden md:flex"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
