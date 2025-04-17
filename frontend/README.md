# Volt Workspace Booking Platform

Volt is a modern workspace booking platform built with Next.js, Tailwind CSS, and shadcn/ui components. It provides a comprehensive solution for managing workspace bookings, availability, and analytics.

## Features

- 🏢 **Workspace Management**: Manage different types of workspaces (desks, meeting rooms, phone booths, etc.)
- 📅 **Booking System**: Book workspaces with real-time availability checking
- 📊 **Analytics Dashboard**: Track workspace usage, peak hours, and occupancy trends
- 👥 **User Management**: Role-based access control for admins, employees, and learners
- 🔔 **Notifications**: Email and in-app notifications for bookings and reminders
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎥 **Video Conferencing**: Built-in video conferencing for remote meetings
- 💬 **Chat**: Integrated chat functionality for team communication
- 🔌 **Integrations**: Connect with calendar apps and other services

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/...
   cd frontend
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
3. Run the setup script:
   ```bash
   node setup.js
4. Start the development server:
   ```bash
   npm run dev

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
volt-workspace-booking/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Authentication pages
│   ├── signup/             # User registration
│   └── ...
├── components/             # React components
│   ├── dashboard/          # Dashboard-specific components
│   ├── landing/            # Landing page components
│   ├── ui/                 # UI components (shadcn/ui)
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and API clients
├── public/                 # Static assets
└── ...
```

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind
- **Framer Motion**: Animation library for React
- **React Day Picker**: Date picker component
- **Recharts**: Charting library for React
- **Lucide React**: Icon library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.


Let's create a tailwind.config.js file:
