import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Rocket } from "lucide-react";
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { LANDING_VIDEOS } from '../config/landingVideos';
import FloatingHeroEyeball from '../components/FloatingHeroEyeball';
import PeekingVignette from '../components/PeekingVignette';
import MiCALogo from '../components/MiCALogo';
import EyeCharacter from '../components/EyeCharacter';
import { useTypewriter } from '../hooks/useTypewriter';
import { motion } from 'framer-motion';
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
    // ── Data Arrays ────────────────────────────────────────────────────────
    const processSteps = [
        {
            number: "1",
            title: "Tell Us Everything",
            description: "Your wellness programme, your audience, your launch date. A quick intake captures your unique voice and the social impact you want to create.",
            color: "#FF7A00",
            borderClass: "border-[#FF7A00]",
            hoverBorderClass: "hover:border-[#FF7A00]",
            textColor: "text-[#FF7A00]",
            gradient: "from-[#FF7A00]/5",
            icon: <FileText className="w-12 h-12 text-[#FF7A00] mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        },
        {
            number: "2",
            title: "Watch the Plan Unfold",
            description: "MiCA cross-references thousands of successful campaigns to autonomously select the perfect strategy (AIDA, PAS, BAB) for your specific offering.",
            color: "#A855F7",
            borderClass: "border-[#A855F7]",
            hoverBorderClass: "hover:border-[#A855F7]",
            textColor: "text-[#A855F7]",
            gradient: "from-purple-500/5",
            icon: <Sparkles className="w-12 h-12 text-purple-400 mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        },
        {
            number: "3",
            title: "Sit Back & Launch",
            description: "One click deploys everything: nurture sequences, social proof, and gentle urgency. It runs tirelessly while you focus on teaching and healing.",
            color: "#10B981",
            borderClass: "border-[#10B981]",
            hoverBorderClass: "hover:border-[#10B981]",
            textColor: "text-[#10B981]",
            gradient: "from-emerald-500/5",
            icon: <Rocket className="w-12 h-12 text-emerald-400 mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        }
    ];

    const strategies = [
        {
            number: "01",
            title: "Dynamic Framework Selection",
            description: "MiCA autonomously analyzes your offering and selects the optimal marketing framework (like AIDA, PAS, or BAB) to maximize resonance with your specific audience.",
            highlight: "Intelligent autonomous strategy",
            color: "text-[#FF7A00]"
        },
        {
            number: "02",
            title: "AIDA Funnel Automation",
            description: "When selected, the classic Attention → Interest → Desire → Action framework is algorithmically perfected to guide your community gracefully from curious to committed.",
            highlight: "Industry standard for clarity",
            color: "text-purple-400"
        },
        {
            number: "03",
            title: "Problem-Agitate-Solve (PAS)",
            description: "For deep-rooted struggles like stress or anxiety, MiCA deploys PAS to gently acknowledge the pain point before introducing your programme as the proven relief.",
            highlight: "High empathy, high conversion",
            color: "text-emerald-400"
        },
        {
            number: "04",
            title: "Pre-Event Nurture Sequences",
            description: "12-touch cadences that transform registrants into eager attendees. By building deep trust before day one, workshop show-up rates soar from 55% to 85%+.",
            highlight: "Reduces no-shows by up to 60%",
            color: "text-blue-400"
        },
        {
            number: "05",
            title: "Social Proof Cascades",
            description: "Testimonials, case studies, and community FOMO gently deployed at critical decision points. Healing histories shared to inspire others to take action.",
            highlight: "Conversion lift: +35-60%",
            color: "text-pink-400"
        },
        {
            number: "06",
            title: "Ethical Urgency Triggers",
            description: "Early-bird pricing and compassionate countdowns. Motivation designed to help those who are suffering stop procrastinating on their own well-being.",
            highlight: "Registration increase: +25-40%",
            color: "text-yellow-400"
        }
    ];

    const featuredTestimonial = {
        quoteBefore: "I have no marketing background—I just want to teach yoga. ",
        quoteAfter: " handled the entire strategy for me. Now, my local studio classes are consistently packed.",
        author: "Marcus Johnson",
        title: "Yoga & Mindfulness Teacher",
        meta: "Studio Attendance: +180%",
        initial: "M"
    };

    const testimonials = [
        {
            quote: "The automated emails don't feel robotic at all. Our open rates hit 97%. People arrived at our trauma retreat already feeling safe and understood.",
            author: "Priya Patel",
            title: "Breathwork & Wellness Retreat Director",
            initial: "P",
            color: "from-emerald-500 to-teal-500"
        },
        {
            quote: "We used to struggle to fill our workshops. MiCA changed everything by sharing our message with real empathy. Our last three retreats sold out completely.",
            author: "Sarah Chen",
            title: "Founder, Online Meditation Platform",
            initial: "S",
            color: "from-orange-500 to-amber-500"
        }
    ];

    // ── Eyeball Tracking State ────────────────────────────────────────────────
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const [vignetteVisible, setVignetteVisible] = React.useState(false);

    const idleTimeoutRef = React.useRef<NodeJS.Timeout>(null);
    const vignetteHideTimeoutRef = React.useRef<NodeJS.Timeout>(null);

    const triggerVignette = React.useCallback((duration = 2500) => {
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
                    if (!prev) triggerVignette(2500); // 2.5s duration for idle
                    return prev || true;
                });
            }, 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);
        // Initial timer
        idleTimeoutRef.current = setTimeout(() => triggerVignette(2500), 3000);

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
            <FloatingHeroEyeball onGiggle={() => triggerVignette(2500)} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-start pt-16 pb-20 overflow-hidden">
                {/* Subtle grid overlay */}
                <div className="grid-overlay z-0"></div>

                <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 md:px-8 xl:px-16 pt-0 pb-16">
                    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-16 items-center">

                        {/* Left Column - Content */}
                        <div className="text-left animate-in slide-in-from-bottom-5 duration-1000">
                            {/* MiCA Animated Acronym Logo */}
                            <div className="mb-12 md:mb-16 pb-4">
                                <MiCALogo />
                            </div>

                            {/* Flexible height container to prevent jumping/overlap */}
                            <div className="min-h-[140px] md:min-h-[180px] lg:min-h-[220px] mb-8">
                                <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight">
                                    Marketing that <br />
                                    <span className="text-[#FF7A00] italic font-serif opacity-90">{typewriterText}</span>
                                    <span className="text-[#FF7A00] animate-pulse">|</span>
                                </h1>
                            </div>

                            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-[650px] leading-relaxed">
                                MiCA is your professional Marketing Agent that delivers not just a comprehensive marketing plan built on proven frameworks, it also executes every campaign automatically across all channels until your launch day!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 relative z-20" data-interest="buttons">
                                <Link to="/create-campaign">
                                    <Button size="lg" className="bg-[#FF7A00] hover:bg-[#FF6600] text-white px-10 py-6 text-lg rounded-full shadow-lg shadow-[#FF7A00]/20 transition-all transform hover:scale-105 border-none">
                                        Create your campaign
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="border-gray-500 text-gray-300 hover:bg-white/10 px-10 py-6 text-lg rounded-full backdrop-blur-sm">
                                    Join the waitlist
                                </Button>
                            </div>
                        </div>

                        {/* Right Column - 3 Video Layout + Tagline */}
                        <div className="relative w-full flex flex-col items-center justify-center gap-6 px-2 mt-8 lg:mt-0" data-interest="videos" style={{ minHeight: '80vh' }}>

                            {/* Video Grid Segment */}
                            <div className="flex items-center justify-center gap-4 xl:gap-6 w-full relative">
                                {/* Video 1 — slightly lower */}
                                <div className="relative z-10 flex shrink-0 items-center justify-center transform translate-y-4" style={{ width: '36%', maxWidth: '380px', aspectRatio: '9 / 16' }}>
                                    {/* Peeking eyeball from behind left video */}
                                    <div className="absolute top-[30%] -left-[15%] z-0 transform -rotate-[20deg]">
                                        <EyeCharacter size={40} />
                                    </div>
                                    <div className="absolute inset-0 z-10 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden pointer-events-none">
                                        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity pointer-events-auto">
                                            <source src="/media/video1.mp4" type="video/mp4" />
                                        </video>
                                    </div>
                                </div>
                                {/* Video 2 — higher (breaks symmetry) */}
                                <div className="relative z-20 flex shrink-0 items-center justify-center transform -translate-y-6 scale-105" style={{ width: '36%', maxWidth: '380px', aspectRatio: '9 / 16' }}>
                                    {/* Peeking eyeball from top-right of center video */}
                                    <div className="absolute -top-[12%] -right-[15%] z-0 transform rotate-[15deg]">
                                        <EyeCharacter size={45} />
                                    </div>
                                    <div className="absolute inset-0 z-10 bg-gray-800/90 rounded-2xl border border-gray-600 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none">
                                        <video autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-auto">
                                            <source src="/media/video2.mp4" type="video/mp4" />
                                        </video>
                                    </div>
                                </div>
                                {/* Video 3 — middle height */}
                                <div className="relative z-10 flex shrink-0 items-center justify-center transform translate-y-0" style={{ width: '36%', maxWidth: '380px', aspectRatio: '9 / 16' }}>
                                    {/* Peeking eyeball from bottom of right video */}
                                    <div className="absolute -bottom-[10%] -right-[15%] z-0 transform rotate-[45deg]">
                                        <EyeCharacter size={50} />
                                    </div>
                                    {/* Peeking eyeball in between middle and right (placed relative to video 3 left side) */}
                                    <div className="absolute top-[15%] -left-[20%] z-0 transform rotate-[10deg]">
                                        <EyeCharacter size={35} />
                                    </div>
                                    <div className="absolute inset-0 z-10 bg-gray-900 rounded-2xl border-2 border-indigo-500/30 shadow-2xl overflow-hidden pointer-events-none">
                                        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
                                            <source src={LANDING_VIDEOS.DEMO_PORTRAIT} type="video/mp4" />
                                        </video>
                                    </div>
                                </div>
                            </div>

                            {/* NEW Tagline Below Videos (with Bam FX & Impact Lines) */}
                            <div className="mt-8 relative z-20 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300 transform md:-translate-y-4 group cursor-pointer hover-bam">


                                <h2 className="relative text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase italic text-center leading-tight">
                                    Your Info in.<br />
                                    <span className="text-[#FF7A00]">Your Campaign out!</span>
                                </h2>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* PROCESS SECTION: How it Works */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <p className="text-[#FF7A00] font-semibold tracking-wider uppercase text-sm mb-4">HOW IT WORKS</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">How MiCA Weaves Its Magic</h2>
                        <p className="text-xl text-gray-400">Three simple steps to put your marketing on autopilot.</p>
                    </div>

                    <div className="space-y-12 md:space-y-0 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#FF7A00]/30 to-transparent -translate-x-1/2"></div>

                        {processSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`flex flex-col items-center gap-8 md:gap-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} pt-12 md:pt-0 relative z-10 w-full max-w-5xl mx-auto`}
                            >
                                {/* The numbered badge */}
                                <div className={`hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-full bg-[#1e293b] border-2 ${step.borderClass} z-20 shrink-0 shadow-[0_0_20px_rgba(255,122,0,0.3)] mx-auto md:absolute md:left-1/2 md:-translate-x-1/2`}>
                                    <span className={`${step.textColor} font-bold text-xl`}>{step.number.padStart(2, '0')}</span>
                                </div>

                                {/* The Glass Card containing the text */}
                                <div className={`w-full md:w-[45%] ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                                    <div
                                        className={`glass p-8 md:p-10 rounded-3xl relative overflow-hidden group border border-white/5 ${step.hoverBorderClass} text-left transition-all duration-500 hover:-translate-y-3 hover:scale-[1.03] hover:bg-white/10`}
                                        style={{ boxShadow: 'var(--hover-shadow, none)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.setProperty('--hover-shadow', `0 0 60px ${step.color}80`)}
                                        onMouseLeave={(e) => e.currentTarget.style.setProperty('--hover-shadow', 'none')}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} to-transparent opacity-50`}></div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-6">
                                                {step.icon}
                                                <h3 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h3>
                                            </div>
                                            <p className="text-xl text-gray-200 leading-relaxed font-light">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* THE PLAYBOOK SECTION */}
            <section className="py-24 relative" id="playbook">
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <p className="text-[#FF7A00] font-semibold tracking-wider uppercase text-sm mb-4">THE PLAYBOOK</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Battle-Tested Frameworks</h2>
                        <p className="text-xl text-gray-400">Every campaign is built on proven methodologies that have filled conference halls, sold out workshops, and launched products worldwide. No guesswork—just execution.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {strategies.map((strategy, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="glass p-8 border border-white/5 rounded-2xl transition-all duration-500 group hover:scale-[1.05] hover:-translate-y-3 hover:border-[#FF7A00] hover:shadow-[0_0_60px_rgba(255,122,0,0.4)] hover:bg-white/10 relative overflow-hidden"
                            >
                                <p className={`font-serif text-5xl opacity-40 mb-4 group-hover:opacity-80 transition-opacity ${strategy.color}`}>
                                    {strategy.number}
                                </p>
                                <h3 className="text-2xl font-semibold text-white mb-3">{strategy.title}</h3>
                                <p className="text-gray-400 leading-relaxed mb-4">{strategy.description}</p>
                                <p className={`text-sm font-semibold tracking-wide uppercase ${strategy.color}`}>
                                    {strategy.highlight}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="py-24 relative border-y border-white/5">
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <p className="text-[#FF7A00] font-semibold tracking-wider uppercase text-sm mb-4">Success Stories</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Results That Speak Volumes</h2>
                    </div>

                    {/* Featured Testimonial */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass p-10 md:p-14 border border-white/10 rounded-3xl relative mb-12 hover:border-[#FF7A00]/20 hover:shadow-[0_0_40px_rgba(255,122,0,0.1)] transition-all duration-500 max-w-5xl mx-auto accent-bar card-lift"
                    >
                        <span className="absolute top-4 left-8 text-[10rem] font-serif text-white/5 leading-none select-none pointer-events-none">"</span>
                        <div className="relative z-10">
                            <blockquote className="text-2xl md:text-3xl italic text-gray-200 leading-relaxed mb-10 max-w-3xl mx-auto text-center font-serif">
                                {featuredTestimonial.quoteBefore}
                                <span className="text-[#FF7A00] font-bold not-italic">MiCA</span> {featuredTestimonial.quoteAfter}
                            </blockquote>
                            <div className="flex items-center justify-center gap-5">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7A00] to-orange-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg">{featuredTestimonial.initial}</div>
                                <div className="text-left">
                                    <p className="text-xl text-white font-semibold">{featuredTestimonial.author}</p>
                                    <p className="text-gray-400">{featuredTestimonial.title}</p>
                                    <p className="text-[#FF7A00] text-sm font-semibold tracking-wide mt-1">{featuredTestimonial.meta}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Compact Testimonials Grid */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {testimonials.map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                                className="glass p-8 border-l-4 border-[#FF7A00] rounded-r-2xl transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_60px_rgba(255,122,0,0.4)] hover:bg-white/10 hover:border-l-8 relative"
                            >
                                <blockquote className="text-lg text-gray-300 leading-relaxed mb-6">
                                    "{testimonial.quote}"
                                </blockquote>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}>
                                        <span className="font-bold text-lg text-white">
                                            {testimonial.initial}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-lg text-white font-semibold">
                                            {testimonial.author}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {testimonial.title}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOTTOM CTA: Claim My Spot - LOVABLE STYLE */}
            <section className="py-32 relative overflow-hidden flex items-center justify-center bg-gray-950" id="waitlist">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

                <div className="container mx-auto px-4 relative z-10 w-full max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="glass border border-[#FF7A00]/40 rounded-3xl p-12 md:p-20 text-center shadow-[0_0_100px_rgba(255,122,0,0.25)] relative overflow-hidden bg-gray-900/80 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_150px_rgba(255,122,0,0.7)] hover:border-[#FF7A00] hover:bg-gray-950 group"
                    >
                        {/* Glow effect inside CTA box to make it pop like Lovable */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[300px] bg-[#FF7A00]/20 blur-[120px] pointer-events-none"></div>

                        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 relative z-10 tracking-tight leading-tight">
                            Stop Planning. <br />
                            <span className="text-[#FF7A00] drop-shadow-[0_0_15px_rgba(255,122,0,0.5)]">Start Launching.</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto relative z-10 leading-relaxed font-light">
                            Your personal AI marketing team is waiting. Get a tone-perfect marketing plan & zero-click campaign execution.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
                            <Link to="/create-campaign" className="w-full sm:w-auto">
                                <Button size="lg" className="bg-[#FF7A00] hover:bg-[#FF8800] text-white px-14 py-8 text-xl font-bold rounded-full w-full shadow-[0_0_40px_rgba(255,122,0,0.6)] hover:shadow-[0_0_60px_rgba(255,122,0,0.8)] transition-all hover:-translate-y-1 border-none">
                                    Claim My Spot
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-10 text-gray-400 text-sm relative z-10 font-medium tracking-wide uppercase">Limited spots available for our upcoming beta.</p>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
}

// Remove FeatureCard since we integrated it inline using motion.div
