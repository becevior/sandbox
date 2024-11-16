export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex space-x-8 py-4">
            <a href="/" className="text-blue-600 border-b-2 border-blue-600 px-1 py-2">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 px-1 py-2">
              Blog
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 px-1 py-2">
              Recipes
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 px-1 py-2">
              Other
            </a>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-center gap-8">
        <img
          src="/api/getImage"
          alt="Conner Beckwith Headshot"
          className="rounded-full w-64 h-64 object-cover shadow-lg"
          priority="true"
        />
        <h1 className="text-3xl font-bold">Conner Beckwith</h1>
      </div>
    </div>
  );
}