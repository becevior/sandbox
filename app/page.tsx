import Image from "next/image";
import MarinersLogo from "./components/MarinersLogo";
import backgroundImage from "./components/background.jpeg";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Image
        src={backgroundImage}
        alt="Background"
        fill
        priority
        className="object-cover z-0"
        quality={100}
      />
      
      {/* Navigation Bar */}
      <nav className="relative z-10 w-full bg-black/50 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl">Mariners</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white">Home</Link>
                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white">Team</Link>
                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white">Schedule</Link>
                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white">Tickets</Link>
                <Link href="/mortal-kombat" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white bg-red-800/50">Mortal Kombat</Link>
                <Link href="/ascii-maze" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white bg-green-800/50">ASCII Maze</Link>
                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white">Shop</Link>
              </div>
            </div>
            <div className="md:hidden">
              <button className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-gray-700 focus:outline-none">
                <span className="sr-only">Open main menu</span>
                {/* Simplified hamburger icon */}
                <div className="w-6 h-0.5 bg-white mb-1"></div>
                <div className="w-6 h-0.5 bg-white mb-1"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="relative z-10 w-full h-full min-h-screen flex items-center justify-center">
        <MarinersLogo />
      </div>
    </div>
  );
}
