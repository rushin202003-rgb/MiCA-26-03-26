import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Upload, FileText, Users, Calendar, MapPin, Sparkles, AlertCircle, Rocket, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Layout } from '../../components/Layout';

import { DEMO_MODE_ENABLED, DEMO_CAMPAIGN } from '../../data/demoData';

export const CreateCampaign: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        creatorName: '',
        productName: '',
        productDescription: '',
        productLinks: '',
        launchDate: '',
        targetAudience: '',
        location: '',
        budget: 5000,
        tone: 'Professional',
        toneCustomWords: '',
    });

    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [customerFile, setCustomerFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<Record<string, unknown>[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocumentFile(e.target.files[0]);
        }
    };

    const handleCustomerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCustomerFile(file);

            Papa.parse(file, {
                preview: 3,
                header: true,
                complete: (results) => {
                    setCsvPreview(results.data as Record<string, unknown>[]);
                },
                error: (error) => {
                    console.error('CSV Parsing Error:', error);
                    setError('Failed to parse CSV file');
                }
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // DEMO MODE BYPASS
        if (DEMO_MODE_ENABLED()) {
            setTimeout(() => {
                navigate(`/campaign/${DEMO_CAMPAIGN.id}/tone-preview`);
            }, 1500); // Simulate processing delay
            return;
        }

        // Basic Validation — campaign duration: 1 to 45 days
        const launchDateObj = new Date(formData.launchDate);
        launchDateObj.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((launchDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 1) {
            setError('Launch date must be at least 1 day in the future');
            setLoading(false);
            return;
        }
        if (diffDays > 45) {
            setError('Launch date must be within 45 days from today');
            setLoading(false);
            return;
        }

        if (!user) {
            setError('You must be logged in to create a campaign');
            setLoading(false);
            return;
        }

        try {
            // 1. Upload Document if exists
            let documentUrl = null;
            if (documentFile) {
                const fileExt = documentFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('product-documents')
                    .upload(fileName, documentFile);

                if (uploadError) throw uploadError;

                // Get public URL (though bucket might be private, we store the path or signed URL usually)
                // For private buckets, we usually store the path.
                documentUrl = fileName;
            }

            // 2. Create Campaign
            const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .insert({
                    user_id: user.id,
                    product_name: formData.productName,
                    product_description: formData.productDescription,
                    product_document_url: documentUrl,
                    target_audience: formData.targetAudience,
                    launch_date: formData.launchDate,
                    budget: formData.budget,
                    location: formData.location,
                    product_links: formData.productLinks,
                    tone: formData.tone === 'Custom' ? formData.toneCustomWords : formData.tone,
                    tone_custom_words: formData.tone === 'Custom' ? formData.toneCustomWords : null,
                    creator_name: formData.creatorName,
                    status: 'tone_preview',
                })
                .select()
                .single();

            if (campaignError) throw campaignError;

            // 3. Process Customer Data if exists (Real processing would happen here or via Edge Function)
            // For now, we will just simulate parsing fully or uploading the CSV to storage if needed.
            // Requirements say: "Upload CSV and parse customer data into customer_data table"

            if (customerFile && campaign) {
                Papa.parse(customerFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const customers = (results.data as Record<string, string>[]).map((row) => ({
                            campaign_id: campaign.id,
                            name: row.name || row.Name,
                            email: row.email || row.Email,
                            phone: row.phone || row.Phone,
                            custom_fields: row
                        }));

                        if (customers.length > 0) {
                            const { error: customerError } = await supabase
                                .from('customer_data')
                                .insert(customers);

                            if (customerError) console.error('Error inserting customers:', customerError);
                        }
                    }
                });
            }

            navigate(`/campaign/${campaign.id}/tone-preview`);

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to create campaign');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Sparkles className="text-indigo-400" /> Create New Campaign
                </h1>

                <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">

                    {/* Section 1: Product Details */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-gray-800 pb-2">
                            <FileText className="w-5 h-5 text-indigo-400" /> Basic Details
                        </h2>

                        <Input
                            label="Your Name"
                            name="creatorName"
                            value={formData.creatorName}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Arjun"
                            helperText="This name will be used in your personalized video."
                        />

                        <Input
                            label="Product / Event Name"
                            name="productName"
                            value={formData.productName}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Masterclass on Digital Marketing"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Product Description</label>
                            <textarea
                                name="productDescription"
                                value={formData.productDescription}
                                onChange={handleInputChange}
                                required
                                maxLength={2000}
                                rows={4}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                placeholder="Describe what your product/course/event is about, who it's for, and what makes it special"
                            />
                        </div>

                        <Input
                            label="Product Links (Optional)"
                            name="productLinks"
                            value={formData.productLinks}
                            onChange={handleInputChange}
                            placeholder="https://yoursite.com, https://facebook.com/event"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Upload Product Document (Optional)</label>
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors bg-gray-800/50">
                                <input
                                    type="file"
                                    id="doc-upload"
                                    className="hidden"
                                    accept=".pdf,.docx,.md,.txt"
                                    onChange={handleDocumentUpload}
                                />
                                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-indigo-400 font-medium">Click to upload</span>
                                    <span className="text-xs text-gray-500">PDF, DOCX, MD, or TXT (Max 10MB)</span>
                                </label>
                                {documentFile && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400 bg-green-900/20 py-1 px-3 rounded-full">
                                        <FileText className="w-4 h-4" /> {documentFile.name}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setDocumentFile(null); const input = document.getElementById('doc-upload') as HTMLInputElement; if (input) input.value = ''; }}
                                            className="ml-2 p-0.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                            title="Remove file"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Campaign Configuration */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-gray-800 pb-2 pt-4">
                            <Calendar className="w-5 h-5 text-emerald-400" /> Campaign Configuration
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <Input
                                    label="Launch Date"
                                    name="launchDate"
                                    type="date"
                                    value={formData.launchDate}
                                    onChange={handleInputChange}
                                    required
                                    helperText="Campaign duration: 1 to 45 days from today"
                                />
                                {formData.launchDate && (() => {
                                    const ld = new Date(formData.launchDate);
                                    ld.setHours(0, 0, 0, 0);
                                    const td = new Date();
                                    td.setHours(0, 0, 0, 0);
                                    const days = Math.ceil((ld.getTime() - td.getTime()) / (1000 * 60 * 60 * 24));
                                    if (days >= 1 && days <= 45) {
                                        return <p className="text-xs text-indigo-400 mt-1">📅 {days}-day campaign</p>;
                                    } else if (days > 45) {
                                        return <p className="text-xs text-amber-400 mt-1">⚠️ Must be within 45 days</p>;
                                    } else {
                                        return <p className="text-xs text-red-400 mt-1">⚠️ Date must be in the future</p>;
                                    }
                                })()}
                            </div>

                            <Input
                                label="Budget (INR)"
                                name="budget"
                                type="number"
                                value={formData.budget}
                                onChange={handleInputChange}
                                min={1000}
                                max={500000}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                            <textarea
                                name="targetAudience"
                                value={formData.targetAudience}
                                onChange={handleInputChange}
                                required
                                maxLength={500}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                placeholder="Example: Working professionals aged 25-40 in Bangalore interested in wellness and meditation"
                            />
                        </div>

                        <Input
                            label="Location (Optional)"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="City or region"
                            leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
                        />
                    </div>

                    {/* Section 3: Tone */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-gray-800 pb-2 pt-4">
                            <Sparkles className="w-5 h-5 text-purple-400" /> Campaign Tone
                        </h2>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {['Professional', 'Warm & Inspirational', 'Urgent', 'Casual', 'Custom'].map((tone) => (
                                <div
                                    key={tone}
                                    onClick={() => setFormData(prev => ({ ...prev, tone: tone }))}
                                    className={`
                    cursor-pointer p-4 rounded-xl border transition-all text-center font-medium
                    ${formData.tone === tone
                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750'
                                        }
                  `}
                                >
                                    {tone}
                                </div>
                            ))}
                        </div>

                        {formData.tone === 'Custom' && (
                            <Input
                                label="Describe Your Tone"
                                name="toneCustomWords"
                                value={formData.toneCustomWords}
                                onChange={handleInputChange}
                                placeholder="e.g. spiritual, gentle, uplifting"
                                required
                            />
                        )}
                    </div>

                    {/* Section 4: Customer Data */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-gray-800 pb-2 pt-4">
                            <Users className="w-5 h-5 text-blue-400" /> Customer Data (Optional)
                        </h2>

                        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-800/50">
                            <input
                                type="file"
                                id="csv-upload"
                                className="hidden"
                                accept=".csv"
                                onChange={handleCustomerUpload}
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-blue-400 font-medium">Upload Customer List (CSV)</span>
                                <span className="text-xs text-gray-500">Columns: name, email, phone</span>
                            </label>
                            {customerFile && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400 bg-green-900/20 py-1 px-3 rounded-full">
                                    <FileText className="w-4 h-4" /> {customerFile.name}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setCustomerFile(null); setCsvPreview([]); const input = document.getElementById('csv-upload') as HTMLInputElement; if (input) input.value = ''; }}
                                        className="ml-2 p-0.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove file"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {csvPreview.length > 0 && (
                            <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Preview ({csvPreview.length} rows loaded)</h4>
                                <table className="w-full text-xs text-left text-gray-300">
                                    <thead className="text-gray-500 border-b border-gray-700">
                                        <tr>
                                            {Object.keys(csvPreview[0]).map(key => <th key={key} className="px-2 py-1">{key}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvPreview.slice(0, 3).map((row, i) => (
                                            <tr key={i} className="border-b border-gray-700/50">
                                                {Object.values(row).map((val, j) => <td key={j} className="px-2 py-1">{String(val)}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.01] transition-all py-4 text-lg font-bold shadow-2xl"
                            isLoading={loading}
                            rightIcon={<Rocket className="w-5 h-5" />}
                        >
                            Generate Tone Preview
                        </Button>
                    </div>

                </form>
            </div>
        </Layout>
    );
};
