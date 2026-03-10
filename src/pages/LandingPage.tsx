import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Rocket, Mail, MessageCircle, Instagram, Phone, Video, BarChart2, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { LANDING_VIDEOS } from '../config/landingVideos';
import FloatingHeroEyeball from '../components/FloatingHeroEyeball';
import PeekingVignette from '../components/PeekingVignette';
import AmbientEyeballs from '../components/AmbientEyeballs';
import MiCALogo from '../components/MiCALogo';
import { useTypewriter } from '../hooks/useTypewriter';
import '../App.css';

const dynamicPhrases = [
    "runs itself",
    "never sleeps",
    "delivers results",
    "feels like magic",
    "builds your audience",
    "converts on autopilot",
    "knows your customer",
    "is cost effective",
    "handles creativity for you",
    "is optimally deployed",
    "is relevant and relatable",
    "is no fuss!",
    "is easy as pie",
    "just works!",
    "understands your needs",
    "is hassle free",
    "will steal your heart",
    "makes it worth it",
    "hooks & connects",
    "delivers & keeps delivering",
    "is made just for you",
    "makes you breathe easy",
    "is tailor-made for you",
    "loves a challenge",
    "adapts & executes",
];

export const LandingPage: React.FC = () => {
    // ── Eyeball Tracking State ────────────────────────────────────────────────
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const [vignetteVisible, setVignetteVisible] = React.useState(false);

    const idleTimeoutRef = React.useRef<NodeJS.Timeout>(null);
    const vignetteHideTimeoutRef = React.useRef<NodeJS.Timeout>(null);

    const triggerVignette = React.useCallback((duration = 5000) => {
        setVignetteVisible(true);
        if (vignetteHideTimeoutRef.current) clearTimeout(vignetteHideTimeoutRef.current);
        vignetteHideTimeoutRef.current = setTimeout(() => setVignetteVisible(false), duration);
    }, []);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });

            // Reset the idle timer (triggers vignette after 3s of NO mouse movement)
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = setTimeout(() => {
                setVignetteVisible((prev) => {
                    if (!prev) triggerVignette(4000); // 4s duration for idle
                    return prev || true;
                });
            }, 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);
        // Initial timer
        idleTimeoutRef.current = setTimeout(() => triggerVignette(4000), 3000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (vignetteHideTimeoutRef.current) clearTimeout(vignetteHideTimeoutRef.current);
        };
    }, [triggerVignette]);

    const typewriterText = useTypewriter({
        words: dynamicPhrases,
        typingSpeed: 40,
        deletingSpeed: 20,
        pauseDuration: 800,
    });

    return (
        <Layout>
            {/* The global vignette layer */}
            <PeekingVignette visible={vignetteVisible} gazeX={mousePos.x / window.innerWidth} gazeY={mousePos.y / window.innerHeight} />

            {/* The Floating Autonomous Hero Element */}
            <FloatingHeroEyeball onGiggle={() => triggerVignette(4000)} />

            {/* Subtle ambient background eyeballs */}
            <AmbientEyeballs gazeX={mousePos.x / window.innerWidth} gazeY={mousePos.y / window.innerHeight} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden" style={{
                background: 'radial-gradient(ellipse 90% 70% at 50% 50%, #1f2f52 0%, #162240 60%, #101829 100%)'
            }}>
                {/* Subtle grid overlay */}
                <div className="grid-overlay"></div>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 md:px-16 pt-32 pb-16">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                        {/* Left Column - Content */}
                        <div className="text-left animate-in slide-in-from-bottom-5 duration-1000">
                            {/* MiCA Animated Acronym Logo */}
                            <div className="mb-6">
                                <MiCALogo />
                            </div>

                            {/* Fixed height container to prevent jumping */}
                            <div className="h-[140px] md:h-[180px] lg:h-[220px] mb-8">
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
                                    Marketing that <br />
                                    <span className="text-[#FF6600] italic font-serif opacity-90">{typewriterText}</span>
                                    <span className="text-[#FF6600] animate-pulse">|</span>
                                </h1>
                            </div>

                            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-[650px] leading-relaxed">
                                Give us your product details. Get a complete 4-week marketing campaign — emails, WhatsApp, social media, voice agents, and video ads — generated and executed automatically.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 relative z-20" data-interest="buttons">
                                <Link to="/create-campaign">
                                    <Button size="lg" className="bg-[#FF6600] hover:bg-[#E85200] text-white px-10 py-6 text-lg rounded-full shadow-lg shadow-[#FF6600]/20 transition-all transform hover:scale-105 border-none">
                                        Get Started
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="border-gray-500 text-gray-300 hover:bg-white/10 px-10 py-6 text-lg rounded-full backdrop-blur-sm">
                                    See How It Works
                                </Button>
                            </div>
                        </div>

                        {/* Right Column - 3 Video Layout (side by side, staggered, 9:16 portrait) */}
                        <div className="relative w-full flex items-end justify-center gap-3 px-4" data-interest="videos" style={{ minHeight: '70vh' }}>
                            {/* Video 1 — slightly lower */}
                            <div className="bg-gray-800/80 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex items-center justify-center transform translate-y-4" style={{ height: '65vh', width: 'calc(65vh * 9 / 16)' }}>
                                <Video size={36} className="text-gray-600" />
                            </div>
                            {/* Video 2 — higher (breaks symmetry) */}
                            <div className="bg-gray-800/90 rounded-2xl border border-gray-600 shadow-2xl overflow-hidden flex items-center justify-center transform -translate-y-8" style={{ height: '65vh', width: 'calc(65vh * 9 / 16)' }}>
                                <Video size={36} className="text-gray-500" />
                            </div>
                            {/* Video 3 — middle height */}
                            <div className="bg-gray-900 rounded-2xl border-2 border-indigo-500/50 shadow-2xl overflow-hidden flex items-center justify-center transform translate-y-1" style={{ height: '65vh', width: 'calc(65vh * 9 / 16)' }}>
                                <div className="text-center p-4">
                                    <div className="w-14 h-14 rounded-full bg-[#FF6600]/20 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:scale-110 transition-transform">
                                        <Play className="w-7 h-7 text-[#FF6600] fill-[#FF6600] ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-[#0F172A]">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How MiCA Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">1. Tell Us About Your Product</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Fill a simple form with your product details, upload documents, and set your launch date. Takes 2 minutes.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-colors overflow-hidden group">
                            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                {LANDING_VIDEOS.CARD_BACKGROUND && !LANDING_VIDEOS.CARD_BACKGROUND.includes('YOUR_') ? (
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    >
                                        <source src={LANDING_VIDEOS.CARD_BACKGROUND} type="video/mp4" />
                                    </video>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-transparent"></div>
                                )}
                                <div className="absolute inset-0 bg-black/70"></div>
                            </div>

                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">2. AI Creates Your Campaign</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Our AI builds a complete 4-week marketing strategy with emails, messages, social posts, branded images, and video ads.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-emerald-500 transition-colors">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 text-emerald-400">
                                <Rocket size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">3. Execute & Track Results</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Launch your campaign across email, WhatsApp, Instagram, and phone — all automated. Track everything in your live dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Everything You Need</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <FeatureCard icon={<Mail />} title="Email Campaigns" />
                        <FeatureCard icon={<MessageCircle />} title="WhatsApp Messages" />
                        <FeatureCard icon={<Instagram />} title="Social Media Posts" />
                        <FeatureCard icon={<Phone />} title="Voice Agents" />
                        <FeatureCard icon={<Video />} title="HeyGen Video Ads" />
                        <FeatureCard icon={<BarChart2 />} title="Live Dashboard" />
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-gray-400 text-sm">Watch MiCA create a campaign in real-time</p>
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-24 bg-[#0F172A] text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Growth Journey</h2>
                    <p className="text-xl text-gray-300 mb-8">Plans starting at <span className="font-semibold text-white">₹999/month</span></p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/create-campaign">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-full w-full sm:w-auto">
                                Get Started Free
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="px-8 rounded-full w-full sm:w-auto">
                            View Pricing
                        </Button>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

const FeatureCard = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:bg-gray-800 transition-colors">
        <div className="text-indigo-400 mb-3">{icon}</div>
        <h4 className="font-semibold text-gray-200">{title}</h4>
    </div>
);
