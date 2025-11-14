
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { marked } from 'marked';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import { Topics } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const categoryDisplayNames: { [key: string]: string } = {
  general: 'General',
  comparison: 'Comparison',
  costFocused: 'Cost-Focused',
  locationBased: 'Location-Based',
  howTo: 'How-To',
  other: 'Other',
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'Authentication error. Please ensure your API key is correctly configured in your deployment environment.';
    }
    // Try to parse for a detailed API error message
    try {
      const match = error.message.match(/\{.*\}/);
      if (match) {
        const errorObj = JSON.parse(match[0]);
        if (errorObj.error && errorObj.error.message) {
          return `API Error: ${errorObj.error.message}`;
        }
      }
    } catch (e) {
      // Fallback to default message if parsing fails
    }
    return `Details: ${error.message}`;
  }
  return 'An unknown error occurred. Please check the console for more details.';
};

const generateWithRetry = async (
  generationRequest: () => Promise<any>,
  onRetry: (attempt: number, delay: number) => void,
  maxRetries: number = 3
) => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generationRequest();
    } catch (e: any) {
      lastError = e;
      const isOverloaded = e.message && (e.message.includes('503') || e.message.toLowerCase().includes('overloaded'));
      
      if (isOverloaded && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        onRetry(attempt + 1, delay);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw e;
    }
  }
  if (lastError) throw lastError;
};


const StepCard: React.FC<{ children: React.ReactNode, className?: string, noPadding?: boolean}> = ({ children, className, noPadding }) => (
  <div className={`bg-white dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/50 rounded-2xl shadow-lg shadow-slate-300/50 dark:shadow-black/20 ${noPadding ? '' : 'p-6 sm:p-8'} ${className}`}>
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
  const [retryMessage, setRetryMessage] = useState<string | null>(null);


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
    setRetryMessage(null);

    const prompt = `For the product "${productName}", generate 6-7 distinct buyer-intent blog post topics for each of the following categories: general, comparison, costFocused, locationBased, howTo, and other. For 'locationBased' topics, you MUST include a placeholder like '[City]' or '[Region]'.`;

    const generationRequest = () => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "general": { type: Type.ARRAY, description: "General blog post topics.", items: { type: Type.STRING } },
            "comparison": { type: Type.ARRAY, description: "Comparison-focused topics.", items: { type: Type.STRING } },
            "costFocused": { type: Type.ARRAY, description: "Topics about cost, value, and pricing.", items: { type: Type.STRING } },
            "locationBased": { type: Type.ARRAY, description: "Topics for specific locations with placeholders.", items: { type: Type.STRING } },
            "howTo": { type: Type.ARRAY, description: "Instructional or educational topics.", items: { type: Type.STRING } },
            "other": { type: Type.ARRAY, description: "Any other relevant buyer-intent topics.", items: { type: Type.STRING } }
          },
        }
      }
    });

    try {
      const response = await generateWithRetry(generationRequest, (attempt, delay) => {
        setRetryMessage(`The model is busy. Retrying in ${delay / 1000}s... (Attempt ${attempt})`);
      });
      
      if (!response.text) {
        throw new Error("The AI returned an empty response. Please try modifying your product name.");
      }

      let responseJson: Topics;
      try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        responseJson = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse JSON response from model:", response.text);
        throw new Error("The AI returned a response in an unexpected format. Please try again.");
      }
      
      setTopics(responseJson);
      if (responseJson && Object.keys(responseJson).length > 0) {
        setActiveCategory(Object.keys(responseJson)[0]);
      }

    } catch (e) {
      console.error(e);
      setError(`Failed to generate topics. ${getErrorMessage(e)}`);
    } finally {
      setIsGeneratingTopics(false);
      setRetryMessage(null);
    }
  }, [productName]);

  const handleSelectTopic = useCallback(async (topic: string) => {
    setError(null);
    setBlogContent('');
    setBlogMarkdown('');
    setIsGeneratingBlog(true);
    setRetryMessage(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    const businessInfo = contextType === 'url' 
        ? `The business's website is ${businessContext}.` 
        : `The business is described as: "${businessContext}".`;
    
    const prompt = `You are an expert SEO copywriter writing for a business. ${businessInfo}
Your task is to write a comprehensive, SEO-optimized, and highly readable blog post for the product "${productName}" about the topic: "${topic}".

The key angle of the article is to explain how your business (the one described above) helps the reader with this product. Weave mentions of the business's value proposition and how it helps the customer naturally into the article. Do not sound overly promotional.

**Readability is paramount. Follow these rules strictly:**
- **Structure:**
  - Start with an H1 title (the topic itself).
  - Immediately after the introduction, include a "Key Takeaways" section using a blockquote with 3-4 bullet points summarizing the article's main points.
  - Use a logical hierarchy of H2 and H3 subheadings to break up the text.
  - End with a strong concluding summary, followed by a relevant call-to-action.
  - After the conclusion, add a "Frequently Asked Questions" (FAQ) section with 2-3 relevant questions and answers.
- **Clarity and Conciseness:**
  - Write in a clear, conversational tone.
  - **Paragraphs must be short:** Limit each paragraph to a maximum of 3-4 sentences.
  - **Sentences must be concise:** Break down long, complex sentences into shorter, simpler ones. Aim for an average sentence length of 15-20 words.
  - Use **bold text** to highlight key terms and important concepts to improve scannability.
- **Engagement:**
  - Break down complex ideas using bullet points or numbered lists where appropriate.
  - Use ample white space between paragraphs and headings in the Markdown output.

The article should be engaging, informative, and at least 800 words. Format the entire output in Markdown.

The call-to-action MUST be specific and highly relevant to the business described. For example, if the business is a coffee roaster selling beans, a good CTA is "Explore our ethically sourced single-origin roasts today." If it's a SaaS for project management, a good CTA is "Start your free 14-day trial and streamline your team's workflow."

---

After the main article (including the FAQ), add the following final sections, each with a clear heading:

### Meta Description
A concise and compelling summary (155-160 characters) for search engine results.

### Suggested Keywords
A comma-separated list of 5-7 relevant keywords for this blog post.`;

    const generationRequest = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    try {
      const response = await generateWithRetry(generationRequest, (attempt, delay) => {
        setRetryMessage(`The model is busy crafting your article. Retrying in ${delay / 1000}s... (Attempt ${attempt})`);
      });
      
      const markdownContent = response.text;
      if (!markdownContent || !markdownContent.trim()) {
        throw new Error("The AI returned an empty blog post. Please try this topic again, or select a different one.");
      }
      setBlogMarkdown(markdownContent);
      const htmlContent = await marked.parse(markdownContent);
      setBlogContent(htmlContent);

    } catch (e) {
      console.error(e);
      setError(`Failed to generate the blog post. ${getErrorMessage(e)}`);
    } finally {
      setIsGeneratingBlog(false);
      setRetryMessage(null);
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
  
  const renderStep0 = () => (
    <div className="text-center animate-fade-in flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[50vh]">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Your AI Content Studio
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
        Go from a single product name to a ready-to-publish, SEO-optimized blog post in minutes. Click below to get started.
      </p>
      <div className="mt-10 sm:mt-12">
        <button
          onClick={() => setStep(1)}
          className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-px text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
        >
          Get Started
        </button>
      </div>
      <p className="mt-16 text-sm text-slate-500 dark:text-zinc-500">
        Built by <a href="https://www.noshaiautomation.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline dark:text-blue-500">nosh</a>.
      </p>
    </div>
  );
  
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <StepCard className="text-left max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">1. Provide Business Context</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">
            This helps tailor the content to your brand.
          </p>
        </div>
        
        <div className="space-y-6">
          <fieldset>
              <legend className="sr-only">Input Type</legend>
              <div className="p-1 bg-slate-200/70 dark:bg-zinc-900 rounded-lg flex items-center justify-between gap-1">
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
                                  text-slate-600 dark:text-zinc-300 peer-checked:bg-white dark:peer-checked:bg-zinc-700/50 peer-checked:text-slate-800 dark:peer-checked:text-zinc-50 peer-checked:shadow-sm
                                  hover:bg-white/70 dark:hover:bg-zinc-700/30"
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
                placeholder="e.g., 'We are a specialty coffee roaster from Austin, TX...'"
                className="w-full h-32 bg-slate-100 dark:bg-zinc-700/40 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
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
                className="w-full bg-slate-100 dark:bg-zinc-700/40 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                aria-label="Website URL"
              />
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-zinc-700/50 pt-6">
           <button
            onClick={handleContextSubmit}
            className="bg-blue-600 w-full text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-px"
            disabled={!businessContext.trim()}
          >
            Continue
          </button>
        </div>
        {error && <p className="text-red-500 mt-4 text-center text-sm" role="alert">{error}</p>}
      </StepCard>
    </div>
  );

  const renderStep2 = () => (
    <>
      {/* Product Input */}
      <StepCard>
        <div className="mb-6">
          <button 
            onClick={() => { setStep(1); setError(null); }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors mb-4 flex items-center gap-1.5 group"
            aria-label="Go back to change business context"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:-translate-x-1">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">2. Generate Content</h1>
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
                className="w-full bg-slate-100 dark:bg-zinc-700/40 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                disabled={isGeneratingTopics}
                aria-label="Product Name"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-zinc-700/50 pt-6">
             <button
              type="submit"
              className="bg-blue-600 w-full text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-px"
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
                <StepCard className="flex flex-col justify-center items-center py-16">
                    <LoadingSpinner className="h-8 w-8"/>
                    {retryMessage && <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400">{retryMessage}</p>}
                </StepCard>
            ) : topics && (
              <StepCard noPadding>
                {/* Category Tabs */}
                <div className="border-b border-slate-200 dark:border-zinc-700/50 px-2 sm:px-4">
                    <div className="flex overflow-x-auto -mb-px" role="tablist" aria-label="Topic Categories">
                        {Object.keys(topics).map((category) => (
                            <button
                                key={category}
                                id={`tab-${category}`}
                                role="tab"
                                aria-controls={`panel-${category}`}
                                aria-selected={activeCategory === category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 
                                    ${activeCategory === category 
                                        ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600'
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 border-b-2 border-transparent'
                                    }`}
                            >
                                {categoryDisplayNames[category] || category}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Topic List Panel */}
                <div 
                  key={activeCategory}
                  id={`panel-${activeCategory || ''}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${activeCategory || ''}`}
                  className="divide-y divide-slate-200 dark:divide-zinc-700/50 animate-fade-in-fast"
                >
                    {activeCategory && topics[activeCategory] && Array.isArray(topics[activeCategory]) && topics[activeCategory].length > 0 ? (
                        topics[activeCategory].map((topic, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectTopic(topic)}
                                className="w-full text-left px-6 sm:px-8 py-4 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:opacity-60"
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
                    <div className="text-center py-12">
                        <LoadingSpinner className="h-10 w-10 mx-auto"/>
                        <p className="mt-4 font-semibold text-slate-600 dark:text-zinc-300">Crafting your article...</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                          {retryMessage || 'This can take up to a minute. Please wait.'}
                        </p>
                    </div>
                ) : blogContent && (
                  <>
                    <button
                      onClick={handleCopyToClipboard}
                      className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm border border-slate-200 dark:border-zinc-600 disabled:opacity-70"
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
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className={`max-w-3xl mx-auto ${step > 1 ? 'space-y-10' : ''}`}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.3s ease-out forwards;
        }
        /* Hide scrollbar for category tabs but allow scrolling */
        .flex.overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        .flex.overflow-x-auto {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default App;
