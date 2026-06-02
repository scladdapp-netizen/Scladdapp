import React from "react";

// Sample JSON data - replace with your own
const sectionsData = [
  {
    id: "intro",
    title: "Introduction",
    content: "This is the introduction section. Welcome to our app!",
  },
  {
    id: "features",
    title: "Key Features",
    content:
      "Discover powerful tools like real-time updates, dark mode, and smooth navigation.",
  },
  {
    id: "pricing",
    title: "Pricing Plans",
    content:
      "Choose from free, pro, and enterprise plans tailored to your needs.",
  },
  {
    id: "testimonials",
    title: "Testimonials",
    content: "Hear what our happy users have to say about their experience.",
  },
  {
    id: "contact",
    title: "Contact Us",
    content: "Get in touch! We're here to help you succeed.",
  },
];

const App = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed on left */}
      <aside className="w-64 bg-white shadow-lg fixed h-full overflow-y-auto border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Navigation</h2>
          <nav>
            {sectionsData.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left py-3 px-4 mb-2 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300 font-medium"
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            My Awesome App
          </h1>

          {/* Loop through JSON to render sections */}
          {sectionsData.map((section) => (
            <section
              key={section.id}
              id={section.id} // Important: matches sidebar link
              className="mb-20 scroll-mt-20" // scroll-mt adds top margin when scrolling to it
            >
              <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100 hover:shadow-2xl transition-shadow duration-500">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  {section.title}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
