"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, MapPin, Users } from "lucide-react"

export function WorkspaceCard({ workspace }) {
  const router = useRouter()

  const handleBookNow = () => {
    router.push(`/dashboard/bookings/new?workspace=${workspace.id}`)
  }

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{workspace.name}</CardTitle>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              <Badge variant={workspace.available ? "success" : "destructive"}>
                {workspace.available ? "Available" : "Booked"}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-1">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Badge variant="outline" className="mr-2">
                {workspace.type.charAt(0).toUpperCase() + workspace.type.slice(1)}
              </Badge>
              {workspace.hourlyRate && (
                <Badge variant="secondary" className="ml-2">
                  ${workspace.hourlyRate}/hr
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{workspace.location}</span>
            </div>
            {workspace.capacity && (
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>Capacity: {workspace.capacity}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {workspace.amenities &&
                workspace.amenities.map((amenity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-xs text-muted-foreground"
                  >
                    <Check className="mr-1 h-3 w-3 text-primary" />
                    <span>{amenity}</span>
                  </motion.div>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <motion.div className="w-full" whileTap={{ scale: 0.95 }}>
            <Button className="w-full" onClick={handleBookNow} disabled={!workspace.available}>
              {workspace.available ? "Book Now" : "Unavailable"}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
