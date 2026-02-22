import React, { useState, useCallback } from 'react';
import { Rocket, AlertTriangle, Upload, FileText, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { generateExecutionSchedule, triggerWebhook } from '../../services/executionService';

interface LaunchSectionProps {
    campaignId: string;
    recipientCount: number;
    recommendedChannels: string[];
    emailCount: number;
    whatsappCount: number;
    socialCount: number;
    onLaunchComplete: () => void;
    onContactsUploaded?: (newCount: number) => void;
}

export const LaunchSection: React.FC<LaunchSectionProps> = ({
    campaignId,
    recipientCount,
    recommendedChannels,
    emailCount,
    whatsappCount,
    socialCount,
    onLaunchComplete,
    onContactsUploaded
}) => {
    const [isLaunching, setIsLaunching] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleLaunch = async () => {
        setIsLaunching(true);
        setError(null);
        try {
            await generateExecutionSchedule(campaignId);
            await triggerWebhook('campaign_launched', {
                campaign_id: campaignId,
                action: 'campaign_launched',
                start_date: new Date().toISOString()
            });
            onLaunchComplete();
            setShowConfirm(false);
        } catch (err: any) {
            console.error("Launch failed:", err);
            setError(err.message || 'Failed to launch campaign');
        } finally {
            setIsLaunching(false);
        }
    };

    const handleCSVUpload = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setIsUploading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as Record<string, unknown>[];
                    if (rows.length === 0) {
                        setError('CSV file is empty or has no valid data rows');
                        setIsUploading(false);
                        return;
                    }

                    // Map CSV columns to customer_data schema
                    const contactsToInsert = rows.map((row: any) => ({
                        campaign_id: campaignId,
                        name: row.name || row.Name || row.full_name || '',
                        email: row.email || row.Email || row.email_address || '',
                        phone: row.phone || row.Phone || row.mobile || row.whatsapp || '',
                    })).filter(c => c.email || c.phone); // Must have at least email or phone

                    if (contactsToInsert.length === 0) {
                        setError('No valid contacts found. CSV must have "email" or "phone" columns.');
                        setIsUploading(false);
                        return;
                    }

                    const { error: insertError } = await supabase
                        .from('customer_data')
                        .insert(contactsToInsert);

                    if (insertError) throw insertError;

                    setUploadSuccess(true);
                    if (onContactsUploaded) {
                        onContactsUploaded(contactsToInsert.length);
                    }
                } catch (err: any) {
                    console.error('CSV upload failed:', err);
                    setError(err.message || 'Failed to upload contacts');
                } finally {
                    setIsUploading(false);
                }
            },
            error: (parseError) => {
                setError('Failed to parse CSV: ' + parseError.message);
                setIsUploading(false);
            }
        });
    }, [campaignId, onContactsUploaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleCSVUpload(file);
    }, [handleCSVUpload]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleCSVUpload(file);
    }, [handleCSVUpload]);

    // ── NO CONTACT DATA: Show upload prompt ──
    if (recipientCount === 0 && !uploadSuccess) {
        return (
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-8 mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>

                <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 rounded-full mb-5 ring-1 ring-amber-500/40">
                    <Rocket className="w-7 h-7 text-amber-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Your Campaign is Ready — Almost! ✨</h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-2 text-sm">
                    All content has been generated — <span className="text-white font-medium">{emailCount} emails</span>,
                    {whatsappCount > 0 && <span className="text-white font-medium"> {whatsappCount} WhatsApp messages</span>}
                    {socialCount > 0 && <span className="text-white font-medium">, {socialCount} Instagram posts</span>}.
                    Upload your customer contacts to activate delivery.
                </p>
                <p className="text-amber-300/60 text-xs mb-6">
                    Your content won't regenerate — it's already locked in. Just add contacts and launch.
                </p>

                {/* CSV Upload Dropzone */}
                <div
                    className={`max-w-lg mx-auto border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${isDragging
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-gray-600 hover:border-amber-500/50 bg-black/20'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('csv-launch-upload')?.click()}
                >
                    <input
                        id="csv-launch-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                            <p className="text-amber-300 text-sm font-medium">Uploading contacts...</p>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-300 text-sm font-medium mb-1">Drop your CSV here or click to browse</p>
                            <p className="text-gray-500 text-xs">File must contain "email" and/or "phone" columns</p>
                        </>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4 max-w-lg mx-auto text-sm text-red-300">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // ── UPLOAD SUCCESS: Show transition state ──
    if (uploadSuccess) {
        return (
            <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-500/30 rounded-xl p-8 mb-8 text-center relative overflow-hidden animate-in fade-in">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-full mb-5 ring-1 ring-emerald-500/40">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Contacts Uploaded Successfully! 🎉</h2>
                <p className="text-gray-300 max-w-xl mx-auto mb-6 text-sm">
                    Your campaign is now fully ready to launch.
                </p>
                <div className="flex justify-center">
                    <Button
                        onClick={() => { setUploadSuccess(false); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 text-lg rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transform hover:scale-[1.05] transition-all duration-300 font-bold flex items-center gap-3"
                    >
                        <Rocket className="w-5 h-5" /> LAUNCH CAMPAIGN NOW
                    </Button>
                </div>
            </div>
        );
    }

    // ── READY STATE: Normal launch prompt ──
    if (!showConfirm) {
        return (
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-8 mb-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 group-hover:bg-purple-500/20 transition-all duration-700"></div>

                <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-full mb-6 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <Rocket className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Your Campaign is Ready to Launch 🚀</h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg">
                    Launch an automated marketing campaign across <span className="text-white font-medium">{recommendedChannels.length} channels</span> to <span className="text-white font-medium">{recipientCount} recipients</span>.
                    MiCA will handle everything automatically.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8 text-left">
                    <div className="bg-black/30 p-4 rounded-lg border border-indigo-500/20 backdrop-blur-sm">
                        <div className="text-indigo-400 font-bold text-lg mb-1">{emailCount} Email{emailCount !== 1 ? 's' : ''}</div>
                        <div className="text-gray-400 text-sm">Scheduled & ready</div>
                    </div>
                    {(recommendedChannels.includes('whatsapp')) && (
                        <div className="bg-black/30 p-4 rounded-lg border border-green-500/20 backdrop-blur-sm">
                            <div className="text-green-400 font-bold text-lg mb-1">{whatsappCount} WhatsApp Msg{whatsappCount !== 1 ? 's' : ''}</div>
                            <div className="text-gray-400 text-sm">Personalized & Automated</div>
                        </div>
                    )}
                    {(recommendedChannels.includes('instagram')) && (
                        <div className="bg-black/30 p-4 rounded-lg border border-pink-500/20 backdrop-blur-sm">
                            <div className="text-pink-400 font-bold text-lg mb-1">{socialCount} Post{socialCount !== 1 ? 's' : ''}</div>
                            <div className="text-gray-400 text-sm">Auto-published to Instagram</div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={() => setShowConfirm(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 text-lg rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transform hover:scale-[1.05] transition-all duration-300 font-bold flex items-center gap-3"
                    >
                        <Rocket className="w-5 h-5" /> LAUNCH CAMPAIGN NOW
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                    By launching, you agree to send automated messages.
                </p>
            </div>
        );
    }

    // ── CONFIRMATION MODAL ──
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-full flex-shrink-0">
                            <Rocket className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Campaign Launch?</h3>
                            <p className="text-gray-400 leading-relaxed">
                                This will immediately start the automation. Messages will be sent to <strong>{recipientCount} recipients</strong> according to the schedule.
                            </p>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 flex gap-3 text-sm text-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div>
                            Once launched, the schedule is locked. You can pause the campaign, but you cannot undo sent messages.
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                            disabled={isLaunching}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLaunch}
                            disabled={isLaunching}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[160px] relative overflow-hidden"
                        >
                            {isLaunching ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Launching...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    🚀 Yes, Launch It
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
