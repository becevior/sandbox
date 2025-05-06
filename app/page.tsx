import Image from "next/image";
import MarinersLogo from "./components/MarinersLogo";
import backgroundImage from "./components/background.jpeg";

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
      <div className="relative z-10 w-full h-full min-h-screen flex items-center justify-center">
        <MarinersLogo />
      </div>
    </div>
  );
}
