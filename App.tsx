
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { marked } from 'marked';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import Hero from './components/Hero';

type Topics = {
  [key: string]: string[];
};

const StepCard: React.FC<{ children: React.ReactNode, className?: string, noPadding?: boolean}> = ({ children, className, noPadding }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-lg ${noPadding ? '' : 'p-6 sm:p-8'} ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [step, setStep] = useState(0);
  const [businessContext, setBusinessContext] = useState('');
  const [contextType, setContextType] = useState<'description' | 'url'>('description');

  const [productName, setProductName] = useState('');
  const [topics, setTopics] = useState<Topics | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [blogContent, setBlogContent] = useState('');
  const [blogMarkdown, setBlogMarkdown] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleContextSubmit = () => {
    if (!businessContext.trim()) {
      setError('Please provide your business information or a website URL.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleGenerateTopics = useCallback(async () => {
    if (!productName.trim()) {
      setError('Please enter a product name.');
      return;
    }
    setError(null);
    setTopics(null);
    setActiveCategory(null);
    setBlogContent('');
    setIsGeneratingTopics(true);

    const prompt = `For the product "${productName}", generate 6-7 distinct buyer-intent blog post topics for each of the following categories: General, Comparison, Cost-Focused, Location-Based, How-To, and Other. For 'Location-Based' topics, you MUST include a placeholder like '[City]' or '[Region]'.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              "General": { type: Type.ARRAY, description: "General blog post topics.", items: { type: Type.STRING } },
              "Comparison": { type: Type.ARRAY, description: "Comparison-focused topics.", items: { type: Type.STRING } },
              "Cost-Focused": { type: Type.ARRAY, description: "Topics about cost, value, and pricing.", items: { type: Type.STRING } },
              "Location-Based": { type: Type.ARRAY, description: "Topics for specific locations with placeholders.", items: { type: Type.STRING } },
              "How-To": { type: Type.ARRAY, description: "Instructional or educational topics.", items: { type: Type.STRING } },
              "Other": { type: Type.ARRAY, description: "Any other relevant buyer-intent topics.", items: { type: Type.STRING } }
            },
          }
        }
      });
      
      const responseJson = JSON.parse(response.text) as Topics;
      setTopics(responseJson);
      if (responseJson && Object.keys(responseJson).length > 0) {
        setActiveCategory(Object.keys(responseJson)[0]);
      }

    } catch (e) {
      console.error(e);
      setError('Failed to generate topics. Please try again.');
    } finally {
      setIsGeneratingTopics(false);
    }
  }, [productName]);

  const handleSelectTopic = useCallback(async (topic: string) => {
    setError(null);
    setBlogContent('');
    setBlogMarkdown('');
    setIsGeneratingBlog(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    const businessInfo = contextType === 'url' 
        ? `The business's website is ${businessContext}.` 
        : `The business is described as: "${businessContext}".`;

    try {
      const prompt = `You are an expert SEO copywriter writing for a business. ${businessInfo}
Your task is to write a comprehensive, SEO-optimized blog post for the product "${productName}" about the topic: "${topic}".

The key angle of the article is to explain how your business (the one described above) helps the reader with this product. Weave mentions of the business's value proposition and how it helps the customer naturally into the article. Do not sound overly promotional.

Structure the content logically for maximum readability and engagement:
- An H1 title (the topic itself).
- Multiple H2 and H3 subheadings to break up the text.
- Short, easy-to-read paragraphs. Each paragraph should ideally be no more than 3-4 sentences.
- Break down complex ideas using bullet points or numbered lists where appropriate.
- Keep sentences concise and direct. Avoid long, complex sentence structures.
- Use ample white space between paragraphs and headings in the Markdown output to make the content easy to scan.
- A strong concluding summary with a call-to-action. The call-to-action MUST be specific and highly relevant to the business described. For example, if the business is a coffee roaster selling beans, a good CTA is "Explore our ethically sourced single-origin roasts today." If it's a SaaS for project management, a good CTA is "Start your free 14-day trial and streamline your team's workflow."

The article should be engaging, informative, and at least 800 words. Format the entire output in Markdown.

---

After the main article, add the following sections, each with a clear heading:

### Meta Description
A concise and compelling summary (155-160 characters) for search engine results.

### Suggested Keywords
A comma-separated list of 5-7 relevant keywords for this blog post.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      
      const markdownContent = response.text;
      setBlogMarkdown(markdownContent);
      const htmlContent = await marked.parse(markdownContent);
      setBlogContent(htmlContent);

    } catch (e) {
      console.error(e);
      setError('Failed to generate the blog post. Please try again.');
    } finally {
      setIsGeneratingBlog(false);
    }
  }, [productName, businessContext, contextType]);

  const handleCopyToClipboard = () => {
    if (!blogMarkdown) return;
    navigator.clipboard.writeText(blogMarkdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500); // Reset after 2.5 seconds
    }).catch(err => {
      console.error('Failed to copy markdown: ', err);
      setError('Could not copy to clipboard.');
    });
  };
  
  const renderStep1 = () => (
    <StepCard>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">First, tell us about your business</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2">
          This context will be used to personalize the generated blog posts.
        </p>
      </div>
      
      <div className="space-y-6">
        <fieldset>
            <legend className="sr-only">Input Type</legend>
            <div className="p-1.5 bg-slate-200/70 dark:bg-zinc-800 rounded-lg flex items-center justify-between gap-1">
              {(['description', 'url'] as const).map((type) => (
                <div key={type} className="w-full">
                  <input
                    type="radio"
                    id={`type-${type}`}
                    name="contextType"
                    value={type}
                    checked={contextType === type}
                    onChange={() => {
                      setContextType(type);
                      setBusinessContext('');
                    }}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="block w-full text-center cursor-pointer select-none rounded-md px-2 py-1.5 text-sm font-semibold transition-colors
                                text-slate-600 dark:text-zinc-300 peer-checked:bg-white dark:peer-checked:bg-zinc-950 peer-checked:text-red-600 peer-checked:shadow-sm
                                hover:bg-white/70 dark:hover:bg-zinc-700/50"
                  >
                    {type === 'description' ? 'Business Description' : 'Website URL'}
                  </label>
                </div>
              ))}
            </div>
        </fieldset>

        {contextType === 'description' ? (
          <div>
            <label htmlFor="businessContext" className="sr-only">Business Description</label>
            <textarea
              id="businessContext"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="e.g., 'We are a specialty coffee roaster from Austin, TX that focuses on ethically sourced, single-origin beans...'"
              className="w-full h-32 bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              aria-label="Business Description"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="businessUrl" className="sr-only">Website URL</label>
            <input
              id="businessUrl"
              type="url"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="e.g., 'https://yourbusiness.com'"
              className="w-full bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              aria-label="Website URL"
            />
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-slate-200 dark:border-zinc-800 pt-6">
         <button
          onClick={handleContextSubmit}
          className="bg-red-600 w-full text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center disabled:bg-red-600/70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-px"
          disabled={!businessContext.trim()}
        >
          Continue
        </button>
      </div>
      {error && <p className="text-red-500 mt-4 text-center text-sm" role="alert">{error}</p>}
    </StepCard>
  );

  const renderStep2 = () => (
    <>
      {/* Product Input */}
      <StepCard>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI Content Engine</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2">
            Enter a product to generate personalized blog topics for your business.
          </p>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleGenerateTopics(); }}>
          <div className="space-y-6">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Product Name</label>
              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., 'AeroPress Coffee Maker'"
                className="w-full bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                disabled={isGeneratingTopics}
                aria-label="Product Name"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-zinc-800 pt-6">
             <button
              type="submit"
              className="bg-red-600 w-full text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center disabled:bg-red-600/70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-px"
              disabled={isGeneratingTopics || !productName.trim()}
            >
              {isGeneratingTopics ? <LoadingSpinner /> : 'Generate Topics'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 mt-4 text-center text-sm" role="alert">{error}</p>}
      </StepCard>

      {/* Topics */}
      {(isGeneratingTopics || topics) && (
        <section className="animate-fade-in" aria-live="polite">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-3 px-2">Select a Topic to Write About</h2>
            {isGeneratingTopics ? (
                <StepCard className="flex justify-center items-center py-16">
                    <LoadingSpinner className="h-8 w-8"/>
                </StepCard>
            ) : topics && (
              <StepCard noPadding>
                {/* Category Tabs */}
                <div className="border-b border-slate-200 dark:border-zinc-800 px-2 sm:px-4">
                    <div className="flex overflow-x-auto -mb-px">
                        {Object.keys(topics).map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none 
                                    ${activeCategory === category 
                                        ? 'text-red-600 dark:text-red-500 border-b-2 border-red-600 dark:border-red-500' 
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 border-b-2 border-transparent'
                                    }`}
                                aria-pressed={activeCategory === category}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Topic List */}
                <div className="divide-y divide-slate-200/80 dark:divide-zinc-800">
                    {activeCategory && topics[activeCategory] && Array.isArray(topics[activeCategory]) && topics[activeCategory].length > 0 ? (
                        topics[activeCategory].map((topic, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectTopic(topic)}
                                className="w-full text-left px-6 sm:px-8 py-4 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 disabled:opacity-60"
                                disabled={isGeneratingBlog}
                            >
                                <p className="font-medium text-slate-800 dark:text-zinc-200">{topic}</p>
                            </button>
                        ))
                    ) : (
                        <p className="px-6 sm:px-8 py-4 text-slate-500 dark:text-zinc-400">No topics found for this category.</p>
                    )}
                </div>
            </StepCard>
            )}
        </section>
      )}

      {/* Blog */}
      {(isGeneratingBlog || blogContent) && (
         <section className="animate-fade-in" aria-live="polite">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-3 px-2">Your Generated Blog Post</h2>
            <StepCard className="min-h-[200px] relative">
                {isGeneratingBlog ? (
                    <div className="text-center py-16">
                        <LoadingSpinner className="h-10 w-10 mx-auto"/>
                        <p className="mt-4 text-slate-500 dark:text-zinc-400">Generating your personalized blog post...</p>
                    </div>
                ) : blogContent && (
                  <>
                    <button
                      onClick={handleCopyToClipboard}
                      className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-600 dark:text-zinc-300 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm border border-slate-200/80 dark:border-zinc-700 disabled:opacity-70 disabled:bg-slate-100"
                      disabled={isCopied}
                      aria-label={isCopied ? "Copied to clipboard" : "Copy blog post markdown to clipboard"}
                    >
                      {isCopied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                          </svg>
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                    <article
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: blogContent }}
                    />
                  </>
                )}
           </StepCard>
        </section>
      )}
    </>
  );

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans flex flex-col ${step === 0 ? 'hero-bg' : ''}`}>
      <Header />
      {step === 0 ? (
        <Hero onStart={() => setStep(1)} />
      ) : (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12 sm:pb-16">
          <div className="max-w-3xl mx-auto space-y-10">
            {step === 1 ? renderStep1() : renderStep2()}
          </div>
        </main>
      )}
      <Footer />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        /* Hide scrollbar for category tabs but allow scrolling */
        .flex.overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        .flex.overflow-x-auto {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hero-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(156, 163, 175, 0.2) 1px, transparent 0);
          background-size: 20px 20px;
        }
        .dark .hero-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(82, 82, 91, 0.2) 1px, transparent 0);
        }
      `}</style>
    </div>
  );
};

export default App;
